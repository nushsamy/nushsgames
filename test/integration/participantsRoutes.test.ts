import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { testPrisma } from "../helpers/prismaTestClient.ts";
import { resetDatabase } from "../helpers/resetDb.ts";
import { startTestServer, type TestServer } from "../helpers/testServer.ts";
import { authHeader } from "../helpers/authHelpers.ts";
import { createTestUser, buildStartedBee, buildParticipants, answerCorrectly } from "../helpers/factories.ts";

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

describe("POST /api/bees/:beeId/participants", () => {
  it("adds a participant to a started bee", async () => {
    const bee = await buildStartedBee(testPrisma);

    const res = await request(server.baseUrl)
      .post(`/api/bees/${bee.id}/participants`)
      .set(authHeader(bee.userId))
      .send({ name: "Alice" });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Alice");
    expect(res.body.isActive).toBe(true);
  });
});

describe("GET /api/bees/:beeId/participants", () => {
  it("splits participants into active and eliminated", async () => {
    const bee = await buildStartedBee(testPrisma);
    const [alice, bob] = await buildParticipants(testPrisma, bee.id, 2);
    await answerCorrectly(testPrisma, bee.id, alice.id);
    await answerCorrectly(testPrisma, bee.id, bob.id);

    const res = await request(server.baseUrl)
      .get(`/api/bees/${bee.id}/participants`)
      .set(authHeader(bee.userId));

    expect(res.status).toBe(200);
    expect(res.body.active).toHaveLength(2);
    expect(res.body.eliminated).toHaveLength(0);
  });
});

describe("PATCH /api/participants/:participantId", () => {
  it("rejects with 409 ROUND_IN_PROGRESS while turns remain in the round", async () => {
    const bee = await buildStartedBee(testPrisma);
    const [alice, bob] = await buildParticipants(testPrisma, bee.id, 2);
    // Alice has spelled, Bob has not -- round is not yet complete.
    await answerCorrectly(testPrisma, bee.id, alice.id);

    const res = await request(server.baseUrl)
      .patch(`/api/participants/${bob.id}`)
      .set(authHeader(bee.userId))
      .send({ isActive: false, isEliminated: true });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("ROUND_IN_PROGRESS");
  });

  it("allows a manual override once the round is complete", async () => {
    const bee = await buildStartedBee(testPrisma);
    const [alice, bob] = await buildParticipants(testPrisma, bee.id, 2);
    await answerCorrectly(testPrisma, bee.id, alice.id);
    await answerCorrectly(testPrisma, bee.id, bob.id);

    const res = await request(server.baseUrl)
      .patch(`/api/participants/${bob.id}`)
      .set(authHeader(bee.userId))
      .send({ isActive: true, isEliminated: false });

    expect(res.status).toBe(200);
    expect(res.body.isActive).toBe(true);
    expect(res.body.isEliminated).toBe(false);
  });

  it("rejects a nonsensical isActive+isEliminated combination with 400", async () => {
    const bee = await buildStartedBee(testPrisma);
    const [alice] = await buildParticipants(testPrisma, bee.id, 1);

    const res = await request(server.baseUrl)
      .patch(`/api/participants/${alice.id}`)
      .set(authHeader(bee.userId))
      .send({ isActive: true, isEliminated: true });

    expect(res.status).toBe(400);
  });

  it("returns 403 for a participant belonging to another user's bee", async () => {
    const otherUser = await createTestUser(testPrisma);
    const bee = await buildStartedBee(testPrisma);
    const [alice] = await buildParticipants(testPrisma, bee.id, 1);
    await answerCorrectly(testPrisma, bee.id, alice.id);

    const res = await request(server.baseUrl)
      .patch(`/api/participants/${alice.id}`)
      .set(authHeader(otherUser.id))
      .send({ isActive: true, isEliminated: false });

    expect(res.status).toBe(403);
  });

  it("returns 404 for an unknown participant id", async () => {
    const user = await createTestUser(testPrisma);
    const res = await request(server.baseUrl)
      .patch("/api/participants/999999")
      .set(authHeader(user.id))
      .send({ isActive: true, isEliminated: false });

    expect(res.status).toBe(404);
  });
});
