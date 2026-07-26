import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { io as ioClient, type Socket as ClientSocket } from "socket.io-client";
import { testPrisma } from "../helpers/prismaTestClient.ts";
import { resetDatabase } from "../helpers/resetDb.ts";
import { startTestServer, type TestServer } from "../helpers/testServer.ts";
import { createTestUser, buildParticipants, answerCorrectly, answerIncorrectly } from "../helpers/factories.ts";
import { createBee, startBee } from "../../src/services/beeService.ts";
import { completeRoundAndProgress } from "../../src/services/roundService.ts";

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

describe("POST /api/join/:gamekey", () => {
  it("adds a participant without any auth and broadcasts participant:added", async () => {
    const user = await createTestUser(testPrisma);
    const bee = await buildStartedBeeForUser(user.id);
    const display = await joinRoom(bee.gamekey!);

    const broadcast = waitForEvent<{ name: string }>(display, "participant:added");
    const res = await request(server.baseUrl).post(`/api/join/${bee.gamekey}`).send({ name: "Alice" });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Alice");
    expect((await broadcast).name).toBe("Alice");

    display.disconnect();
  });

  it("rejects a duplicate name with 409", async () => {
    const user = await createTestUser(testPrisma);
    const bee = await buildStartedBeeForUser(user.id);
    await request(server.baseUrl).post(`/api/join/${bee.gamekey}`).send({ name: "Alice" });

    const res = await request(server.baseUrl).post(`/api/join/${bee.gamekey}`).send({ name: "alice" });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("DUPLICATE_PARTICIPANT");
  });

  it("returns 404 for an unknown gamekey", async () => {
    const res = await request(server.baseUrl).post("/api/join/BEE-NOPE99").send({ name: "Alice" });
    expect(res.status).toBe(404);
  });
});

describe("GET /api/gamekey/:gamekey/state", () => {
  it("reflects persisted state without ever exposing the current word or a verdict", async () => {
    const user = await createTestUser(testPrisma);
    const bee = await buildStartedBeeForUser(user.id);
    const [alice] = await buildParticipants(testPrisma, bee.id, 1);

    const res = await request(server.baseUrl).get(`/api/gamekey/${bee.gamekey}/state`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("in_progress");
    expect(res.body.currentRound).toBe(1);
    expect(res.body.currentParticipant).toBe(alice.name);
    expect(res.body.participants.active).toHaveLength(1);

    const serialized = JSON.stringify(res.body);
    expect(serialized).not.toContain("apple");
    expect(serialized.toLowerCase()).not.toContain("word");
    expect(serialized.toLowerCase()).not.toContain("iscorrect");
  });

  it("includes standings and a winner once the bee is completed", async () => {
    const user = await createTestUser(testPrisma);
    const bee = await buildStartedBeeForUser(user.id);
    const [alice, bob] = await buildParticipants(testPrisma, bee.id, 2);
    await answerCorrectly(testPrisma, bee.id, alice.id);
    await answerIncorrectly(testPrisma, bee.id, bob.id);
    // Drive the bee to completion directly through the service layer -- the /next-round
    // HTTP route itself is already covered by nextRoundRoute.test.ts.
    await completeRoundAndProgress(testPrisma, bee.id);

    const res = await request(server.baseUrl).get(`/api/gamekey/${bee.gamekey}/state`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("completed");
    expect(res.body.standings.winner.name).toBe(alice.name);
  });

  it("returns 404 for an unknown gamekey", async () => {
    const res = await request(server.baseUrl).get("/api/gamekey/BEE-NOPE99/state");
    expect(res.status).toBe(404);
  });
});
