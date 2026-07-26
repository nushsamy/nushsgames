import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { io as ioClient, type Socket as ClientSocket } from "socket.io-client";
import { testPrisma } from "../helpers/prismaTestClient.ts";
import { resetDatabase } from "../helpers/resetDb.ts";
import { startTestServer, type TestServer } from "../helpers/testServer.ts";
import { authHeader } from "../helpers/authHelpers.ts";
import { createTestUser, buildParticipants } from "../helpers/factories.ts";
import { createBee, startBee } from "../../src/services/beeService.ts";

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

async function buildStartedBeeForUser(userId: number, roundWords: string[][] = [["apple", "banana"]]) {
  const bee = await createBee(testPrisma, { userId, title: "Test", totalRounds: 1, roundWords });
  return startBee(testPrisma, bee.id);
}

describe("POST /api/bees/:beeId/responses", () => {
  it("records a correct spelling and broadcasts response:submitted", async () => {
    const user = await createTestUser(testPrisma);
    const bee = await buildStartedBeeForUser(user.id);
    const [alice] = await buildParticipants(testPrisma, bee.id, 1);
    const display = await joinRoom(bee.gamekey!);

    const broadcast = waitForEvent<{ isCorrect: boolean; word: string; participantName: string }>(
      display,
      "response:submitted",
    );
    const res = await request(server.baseUrl)
      .post(`/api/bees/${bee.id}/responses`)
      .set(authHeader(user.id))
      .send({ participantId: alice.id, userSpelling: "apple" });

    expect(res.status).toBe(200);
    expect(res.body.spelledCorrectly).toBe(true);

    const payload = await broadcast;
    expect(payload.isCorrect).toBe(true);
    expect(payload.word).toBe("apple");
    expect(payload.participantName).toBe(alice.name);

    display.disconnect();
  });

  it("records an incorrect spelling, eliminates the participant, and broadcasts both events", async () => {
    const user = await createTestUser(testPrisma);
    const bee = await buildStartedBeeForUser(user.id);
    const [alice] = await buildParticipants(testPrisma, bee.id, 1);
    const display = await joinRoom(bee.gamekey!);

    const submitted = waitForEvent<{ isCorrect: boolean }>(display, "response:submitted");
    const eliminated = waitForEvent<{ participantName: string }>(display, "participant:eliminated");

    const res = await request(server.baseUrl)
      .post(`/api/bees/${bee.id}/responses`)
      .set(authHeader(user.id))
      .send({ participantId: alice.id, userSpelling: "aple" });

    expect(res.status).toBe(200);
    expect(res.body.spelledCorrectly).toBe(false);
    expect((await submitted).isCorrect).toBe(false);
    expect((await eliminated).participantName).toBe(alice.name);

    display.disconnect();
  });

  it("rejects an out-of-turn submission with 409 and does not broadcast anything", async () => {
    const user = await createTestUser(testPrisma);
    const bee = await buildStartedBeeForUser(user.id);
    const [, bob] = await buildParticipants(testPrisma, bee.id, 2);
    const display = await joinRoom(bee.gamekey!);

    let sawBroadcast = false;
    display.on("response:submitted", () => {
      sawBroadcast = true;
    });

    // It's the first participant's turn (Alice), not Bob's.
    const res = await request(server.baseUrl)
      .post(`/api/bees/${bee.id}/responses`)
      .set(authHeader(user.id))
      .send({ participantId: bob.id, userSpelling: "banana" });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("PARTICIPANT_NOT_ELIGIBLE");

    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(sawBroadcast).toBe(false);

    display.disconnect();
  });

  it("returns 403 for a bee owned by another user", async () => {
    const user = await createTestUser(testPrisma);
    const otherUser = await createTestUser(testPrisma);
    const bee = await buildStartedBeeForUser(user.id);
    const [alice] = await buildParticipants(testPrisma, bee.id, 1);

    const res = await request(server.baseUrl)
      .post(`/api/bees/${bee.id}/responses`)
      .set(authHeader(otherUser.id))
      .send({ participantId: alice.id, userSpelling: "apple" });

    expect(res.status).toBe(403);
  });
});

describe("POST /api/bees/:beeId/skip", () => {
  it("eliminates the participant with an empty spelling and broadcasts both events", async () => {
    const user = await createTestUser(testPrisma);
    const bee = await buildStartedBeeForUser(user.id);
    const [alice] = await buildParticipants(testPrisma, bee.id, 1);
    const display = await joinRoom(bee.gamekey!);

    const submitted = waitForEvent<{ isCorrect: boolean; userSpelling: string }>(display, "response:submitted");
    const eliminated = waitForEvent<{ participantName: string }>(display, "participant:eliminated");

    const res = await request(server.baseUrl)
      .post(`/api/bees/${bee.id}/skip`)
      .set(authHeader(user.id))
      .send({ participantId: alice.id });

    expect(res.status).toBe(200);
    expect(res.body.userSpelling).toBe("");
    expect(res.body.spelledCorrectly).toBe(false);
    expect((await submitted).userSpelling).toBe("");
    expect((await eliminated).participantName).toBe(alice.name);

    display.disconnect();
  });
});
