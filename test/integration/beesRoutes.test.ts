import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { testPrisma } from "../helpers/prismaTestClient.ts";
import { resetDatabase } from "../helpers/resetDb.ts";
import { startTestServer, type TestServer } from "../helpers/testServer.ts";
import { authHeader } from "../helpers/authHelpers.ts";
import { createTestUser, DEFAULT_ROUND_WORDS } from "../helpers/factories.ts";
import { addParticipant } from "../../src/services/participantService.ts";

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

describe("POST /api/bees", () => {
  it("creates a bee owned by the authenticated user", async () => {
    const user = await createTestUser(testPrisma);
    const res = await request(server.baseUrl)
      .post("/api/bees")
      .set(authHeader(user.id))
      .send({ title: "Regional Bee", totalRounds: 2, roundWords: DEFAULT_ROUND_WORDS });

    expect(res.status).toBe(201);
    expect(res.body.userId).toBe(user.id);
    expect(res.body.status).toBe("created");
  });

  it("rejects requests with no Authorization header", async () => {
    const res = await request(server.baseUrl)
      .post("/api/bees")
      .send({ title: "Regional Bee", totalRounds: 2, roundWords: DEFAULT_ROUND_WORDS });
    expect(res.status).toBe(401);
  });
});

describe("GET /api/bees", () => {
  it("lists only the authenticated user's bees", async () => {
    const user = await createTestUser(testPrisma);
    const otherUser = await createTestUser(testPrisma);
    await request(server.baseUrl)
      .post("/api/bees")
      .set(authHeader(user.id))
      .send({ title: "Mine", totalRounds: 1, roundWords: [["a"]] });
    await request(server.baseUrl)
      .post("/api/bees")
      .set(authHeader(otherUser.id))
      .send({ title: "Theirs", totalRounds: 1, roundWords: [["b"]] });

    const res = await request(server.baseUrl).get("/api/bees").set(authHeader(user.id));
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe("Mine");
  });
});

describe("GET /api/bees/:beeId", () => {
  it("returns 403 when a different user requests it", async () => {
    const user = await createTestUser(testPrisma);
    const otherUser = await createTestUser(testPrisma);
    const create = await request(server.baseUrl)
      .post("/api/bees")
      .set(authHeader(user.id))
      .send({ title: "Mine", totalRounds: 1, roundWords: [["a"]] });

    const res = await request(server.baseUrl)
      .get(`/api/bees/${create.body.id}`)
      .set(authHeader(otherUser.id));
    expect(res.status).toBe(403);
  });

  it("returns 404 for an unknown bee id", async () => {
    const user = await createTestUser(testPrisma);
    const res = await request(server.baseUrl).get("/api/bees/999999").set(authHeader(user.id));
    expect(res.status).toBe(404);
  });

  it("has a null currentTurn before the bee is started", async () => {
    const user = await createTestUser(testPrisma);
    const create = await request(server.baseUrl)
      .post("/api/bees")
      .set(authHeader(user.id))
      .send({ title: "Mine", totalRounds: 1, roundWords: [["apple"]] });

    const res = await request(server.baseUrl)
      .get(`/api/bees/${create.body.id}`)
      .set(authHeader(user.id));
    expect(res.body.currentTurn).toBeNull();
  });

  it("includes the current word (host-only) once started with a participant", async () => {
    const user = await createTestUser(testPrisma);
    const create = await request(server.baseUrl)
      .post("/api/bees")
      .set(authHeader(user.id))
      .send({ title: "Mine", totalRounds: 1, roundWords: [["apple"]] });
    await request(server.baseUrl).post(`/api/bees/${create.body.id}/start`).set(authHeader(user.id));
    await addParticipant(testPrisma, create.body.id, "Alice");

    const res = await request(server.baseUrl)
      .get(`/api/bees/${create.body.id}`)
      .set(authHeader(user.id));
    expect(res.body.currentTurn.word).toBe("apple");
    expect(res.body.currentTurn.participant.name).toBe("Alice");
  });
});

describe("PATCH /api/bees/:beeId", () => {
  it("updates the title while status is created", async () => {
    const user = await createTestUser(testPrisma);
    const create = await request(server.baseUrl)
      .post("/api/bees")
      .set(authHeader(user.id))
      .send({ title: "Old Title", totalRounds: 1, roundWords: [["a"]] });

    const res = await request(server.baseUrl)
      .patch(`/api/bees/${create.body.id}`)
      .set(authHeader(user.id))
      .send({ title: "New Title" });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("New Title");
  });

  it("rejects editing after the bee has started", async () => {
    const user = await createTestUser(testPrisma);
    const create = await request(server.baseUrl)
      .post("/api/bees")
      .set(authHeader(user.id))
      .send({ title: "Old Title", totalRounds: 1, roundWords: [["a"]] });
    await request(server.baseUrl).post(`/api/bees/${create.body.id}/start`).set(authHeader(user.id));

    const res = await request(server.baseUrl)
      .patch(`/api/bees/${create.body.id}`)
      .set(authHeader(user.id))
      .send({ title: "New Title" });
    expect(res.status).toBe(409);
  });
});

describe("POST /api/bees/:beeId/start and /end", () => {
  it("starts a bee: generates a gamekey and sets status in_progress", async () => {
    const user = await createTestUser(testPrisma);
    const create = await request(server.baseUrl)
      .post("/api/bees")
      .set(authHeader(user.id))
      .send({ title: "Mine", totalRounds: 1, roundWords: [["a"]] });

    const res = await request(server.baseUrl)
      .post(`/api/bees/${create.body.id}/start`)
      .set(authHeader(user.id));
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("in_progress");
    expect(res.body.gamekey).toMatch(/^BEE-/);
  });

  it("ends a bee: sets status completed", async () => {
    const user = await createTestUser(testPrisma);
    const create = await request(server.baseUrl)
      .post("/api/bees")
      .set(authHeader(user.id))
      .send({ title: "Mine", totalRounds: 1, roundWords: [["a"]] });
    await request(server.baseUrl).post(`/api/bees/${create.body.id}/start`).set(authHeader(user.id));

    const res = await request(server.baseUrl)
      .post(`/api/bees/${create.body.id}/end`)
      .set(authHeader(user.id));
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("completed");
  });

  it("rejects starting a bee owned by another user with 403", async () => {
    const user = await createTestUser(testPrisma);
    const otherUser = await createTestUser(testPrisma);
    const create = await request(server.baseUrl)
      .post("/api/bees")
      .set(authHeader(user.id))
      .send({ title: "Mine", totalRounds: 1, roundWords: [["a"]] });

    const res = await request(server.baseUrl)
      .post(`/api/bees/${create.body.id}/start`)
      .set(authHeader(otherUser.id));
    expect(res.status).toBe(403);
  });
});
