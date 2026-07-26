import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { io as ioClient, type Socket as ClientSocket } from "socket.io-client";
import { testPrisma } from "../helpers/prismaTestClient.ts";
import { resetDatabase } from "../helpers/resetDb.ts";
import { startTestServer, type TestServer } from "../helpers/testServer.ts";
import { authHeader } from "../helpers/authHelpers.ts";
import { buildStartedBee, buildParticipants, answerCorrectly, answerIncorrectly } from "../helpers/factories.ts";

let server: TestServer;

beforeAll(async () => {
  server = await startTestServer(testPrisma);
});

afterAll(async () => {
  await server.close();
  await testPrisma.$disconnect();
});

beforeEach(async () => {
  await resetDatabase(testPrisma);
});

function connectClient(): ClientSocket {
  return ioClient(server.baseUrl, { transports: ["websocket"], forceNew: true });
}

function waitForEvent<T = unknown>(socket: ClientSocket, event: string): Promise<T> {
  return new Promise((resolve) => socket.once(event, resolve));
}

async function joinRoom(gamekey: string): Promise<ClientSocket> {
  const client = connectClient();
  const connected = waitForEvent(client, "client:connected");
  client.emit("join", { gamekey });
  await connected;
  return client;
}

describe("POST /api/bees/:beeId/next-round", () => {
  it("rejects with 409 while turns remain in the current round", async () => {
    const bee = await buildStartedBee(testPrisma, { roundWords: [["apple", "banana"], ["cherry", "date"]] });
    await buildParticipants(testPrisma, bee.id, 2);
    // Nobody has spelled yet -- round is not complete.

    const res = await request(server.baseUrl)
      .post(`/api/bees/${bee.id}/next-round`)
      .set(authHeader(bee.userId));

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("ROUND_NOT_COMPLETE");
  });

  it("advances to the next round and broadcasts round:end then round:start", async () => {
    const bee = await buildStartedBee(testPrisma, { roundWords: [["apple", "banana"], ["cherry", "date"]] });
    const [alice, bob] = await buildParticipants(testPrisma, bee.id, 2);
    await answerCorrectly(testPrisma, bee.id, alice.id);
    await answerCorrectly(testPrisma, bee.id, bob.id);

    const display = await joinRoom(bee.gamekey!);
    const roundEnd = waitForEvent<{ advancedParticipants: string[] }>(display, "round:end");
    const roundStart = waitForEvent<{ roundNumber: number }>(display, "round:start");

    const res = await request(server.baseUrl)
      .post(`/api/bees/${bee.id}/next-round`)
      .set(authHeader(bee.userId));

    expect(res.status).toBe(200);
    expect(res.body.ended).toBe(false);
    expect(res.body.bee.currentRound).toBe(2);

    const endPayload = await roundEnd;
    expect(endPayload.advancedParticipants.sort()).toEqual([alice.name, bob.name].sort());
    expect((await roundStart).roundNumber).toBe(2);

    display.disconnect();
  });

  it("ends the bee on the final round and broadcasts round:end then bee:completed with the winner", async () => {
    const bee = await buildStartedBee(testPrisma, { roundWords: [["apple", "banana"]] });
    const [alice, bob] = await buildParticipants(testPrisma, bee.id, 2);
    await answerCorrectly(testPrisma, bee.id, alice.id);
    await answerIncorrectly(testPrisma, bee.id, bob.id);

    const display = await joinRoom(bee.gamekey!);
    const roundEnd = waitForEvent<{ advancedParticipants: string[] }>(display, "round:end");
    const beeCompleted = waitForEvent<{ winner: { name: string } | null }>(display, "bee:completed");

    const res = await request(server.baseUrl)
      .post(`/api/bees/${bee.id}/next-round`)
      .set(authHeader(bee.userId));

    expect(res.status).toBe(200);
    expect(res.body.ended).toBe(true);
    expect(res.body.bee.status).toBe("completed");

    expect((await roundEnd).advancedParticipants).toEqual([alice.name]);
    expect((await beeCompleted).winner?.name).toBe(alice.name);

    display.disconnect();
  });
});
