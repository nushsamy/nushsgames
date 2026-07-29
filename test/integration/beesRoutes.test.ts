import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { testPrisma } from "../helpers/prismaTestClient.ts";
import { resetDatabase } from "../helpers/resetDb.ts";
import { startTestServer, type TestServer } from "../helpers/testServer.ts";
import { authHeader } from "../helpers/authHelpers.ts";
import { createTestUser } from "../helpers/factories.ts";
import { addParticipant } from "../../src/services/participantService.ts";

let server: TestServer;

async function addWordsRound(beeId: number, userId: number, words: string[] = ["apple"]): Promise<void> {
  const roundRes = await request(server.baseUrl)
    .post(`/api/bees/${beeId}/rounds`)
    .set(authHeader(userId));
  await request(server.baseUrl)
    .put(`/api/bees/${beeId}/rounds/${roundRes.body.roundNumber}/words`)
    .set(authHeader(userId))
    .send({ words });
}

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
      .send({ title: "Regional Bee" });

    expect(res.status).toBe(201);
    expect(res.body.userId).toBe(user.id);
    expect(res.body.status).toBe("created");
  });

  it("rejects requests with no Authorization header", async () => {
    const res = await request(server.baseUrl)
      .post("/api/bees")
      .send({ title: "Regional Bee" });
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
      .send({ title: "Mine" });
    await request(server.baseUrl)
      .post("/api/bees")
      .set(authHeader(otherUser.id))
      .send({ title: "Theirs" });

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
      .send({ title: "Mine" });

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
      .send({ title: "Mine" });

    const res = await request(server.baseUrl)
      .get(`/api/bees/${create.body.id}`)
      .set(authHeader(user.id));
    expect(res.body.currentTurn).toBeNull();
  });

  it("has a null currentTurn after starting with participants but before the round is explicitly started", async () => {
    const user = await createTestUser(testPrisma);
    const create = await request(server.baseUrl)
      .post("/api/bees")
      .set(authHeader(user.id))
      .send({ title: "Mine" });
    await addWordsRound(create.body.id, user.id, ["apple"]);
    await request(server.baseUrl).post(`/api/bees/${create.body.id}/start`).set(authHeader(user.id));
    await addParticipant(testPrisma, create.body.id, "Alice");

    const res = await request(server.baseUrl)
      .get(`/api/bees/${create.body.id}`)
      .set(authHeader(user.id));
    expect(res.body.bee.roundStarted).toBe(false);
    expect(res.body.currentTurn).toBeNull();
  });

  it("includes the current word (host-only) once the round is explicitly started", async () => {
    const user = await createTestUser(testPrisma);
    const create = await request(server.baseUrl)
      .post("/api/bees")
      .set(authHeader(user.id))
      .send({ title: "Mine" });
    await addWordsRound(create.body.id, user.id, ["apple"]);
    await request(server.baseUrl).post(`/api/bees/${create.body.id}/start`).set(authHeader(user.id));
    await addParticipant(testPrisma, create.body.id, "Alice");
    await request(server.baseUrl).post(`/api/bees/${create.body.id}/start-round`).set(authHeader(user.id));

    const res = await request(server.baseUrl)
      .get(`/api/bees/${create.body.id}`)
      .set(authHeader(user.id));
    expect(res.body.bee.roundStarted).toBe(true);
    expect(res.body.currentTurn.word).toBe("apple");
    expect(res.body.currentTurn.participant.name).toBe("Alice");
  });
});

describe("POST /api/bees/:beeId/start-round", () => {
  it("rejects starting a round with no participants", async () => {
    const user = await createTestUser(testPrisma);
    const create = await request(server.baseUrl)
      .post("/api/bees")
      .set(authHeader(user.id))
      .send({ title: "Mine" });
    await addWordsRound(create.body.id, user.id);
    await request(server.baseUrl).post(`/api/bees/${create.body.id}/start`).set(authHeader(user.id));

    const res = await request(server.baseUrl)
      .post(`/api/bees/${create.body.id}/start-round`)
      .set(authHeader(user.id));
    expect(res.status).toBe(400);
  });

  it("rejects starting a round that has already started", async () => {
    const user = await createTestUser(testPrisma);
    const create = await request(server.baseUrl)
      .post("/api/bees")
      .set(authHeader(user.id))
      .send({ title: "Mine" });
    await addWordsRound(create.body.id, user.id);
    await request(server.baseUrl).post(`/api/bees/${create.body.id}/start`).set(authHeader(user.id));
    await addParticipant(testPrisma, create.body.id, "Alice");
    await request(server.baseUrl).post(`/api/bees/${create.body.id}/start-round`).set(authHeader(user.id));

    const res = await request(server.baseUrl)
      .post(`/api/bees/${create.body.id}/start-round`)
      .set(authHeader(user.id));
    expect(res.status).toBe(409);
  });
});

describe("POST /api/bees/:beeId/rounds and PUT .../rounds/:roundNumber/words", () => {
  it("adds sequential rounds and sets their words", async () => {
    const user = await createTestUser(testPrisma);
    const create = await request(server.baseUrl)
      .post("/api/bees")
      .set(authHeader(user.id))
      .send({ title: "Mine" });

    const round1 = await request(server.baseUrl)
      .post(`/api/bees/${create.body.id}/rounds`)
      .set(authHeader(user.id));
    expect(round1.status).toBe(201);
    expect(round1.body.roundNumber).toBe(1);
    expect(round1.body.assignedWords).toEqual([]);

    const round2 = await request(server.baseUrl)
      .post(`/api/bees/${create.body.id}/rounds`)
      .set(authHeader(user.id));
    expect(round2.body.roundNumber).toBe(2);

    const wordsRes = await request(server.baseUrl)
      .put(`/api/bees/${create.body.id}/rounds/${round1.body.roundNumber}/words`)
      .set(authHeader(user.id))
      .send({ words: ["apple", "banana"] });
    expect(wordsRes.status).toBe(200);
    expect(wordsRes.body.assignedWords).toEqual(["apple", "banana"]);

    const beeRes = await request(server.baseUrl).get(`/api/bees/${create.body.id}`).set(authHeader(user.id));
    expect(beeRes.body.bee.totalRounds).toBe(2);
  });

  it("rejects an empty words array with 400", async () => {
    const user = await createTestUser(testPrisma);
    const create = await request(server.baseUrl)
      .post("/api/bees")
      .set(authHeader(user.id))
      .send({ title: "Mine" });
    const round = await request(server.baseUrl)
      .post(`/api/bees/${create.body.id}/rounds`)
      .set(authHeader(user.id));

    const res = await request(server.baseUrl)
      .put(`/api/bees/${create.body.id}/rounds/${round.body.roundNumber}/words`)
      .set(authHeader(user.id))
      .send({ words: [] });
    expect(res.status).toBe(400);
  });

  it("returns 403 when adding a round to another user's bee", async () => {
    const user = await createTestUser(testPrisma);
    const otherUser = await createTestUser(testPrisma);
    const create = await request(server.baseUrl)
      .post("/api/bees")
      .set(authHeader(user.id))
      .send({ title: "Mine" });

    const res = await request(server.baseUrl)
      .post(`/api/bees/${create.body.id}/rounds`)
      .set(authHeader(otherUser.id));
    expect(res.status).toBe(403);
  });
});

describe("GET /api/bees/:beeId/rounds", () => {
  it("lists rounds in ascending roundNumber order", async () => {
    const user = await createTestUser(testPrisma);
    const create = await request(server.baseUrl)
      .post("/api/bees")
      .set(authHeader(user.id))
      .send({ title: "Mine" });
    await addWordsRound(create.body.id, user.id, ["apple", "banana"]);
    await addWordsRound(create.body.id, user.id, ["cherry"]);

    const res = await request(server.baseUrl)
      .get(`/api/bees/${create.body.id}/rounds`)
      .set(authHeader(user.id));
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].roundNumber).toBe(1);
    expect(res.body[0].assignedWords).toEqual(["apple", "banana"]);
    expect(res.body[1].roundNumber).toBe(2);
    expect(res.body[1].assignedWords).toEqual(["cherry"]);
  });

  it("shows an empty assignedWords array for a round with no words set", async () => {
    const user = await createTestUser(testPrisma);
    const create = await request(server.baseUrl)
      .post("/api/bees")
      .set(authHeader(user.id))
      .send({ title: "Mine" });
    await request(server.baseUrl).post(`/api/bees/${create.body.id}/rounds`).set(authHeader(user.id));

    const res = await request(server.baseUrl)
      .get(`/api/bees/${create.body.id}/rounds`)
      .set(authHeader(user.id));
    expect(res.body[0].assignedWords).toEqual([]);
  });

  it("returns 403 for another user's bee", async () => {
    const user = await createTestUser(testPrisma);
    const otherUser = await createTestUser(testPrisma);
    const create = await request(server.baseUrl)
      .post("/api/bees")
      .set(authHeader(user.id))
      .send({ title: "Mine" });

    const res = await request(server.baseUrl)
      .get(`/api/bees/${create.body.id}/rounds`)
      .set(authHeader(otherUser.id));
    expect(res.status).toBe(403);
  });
});

describe("DELETE /api/bees/:beeId/rounds/:roundNumber", () => {
  it("deletes a middle round and renumbers subsequent rounds contiguously", async () => {
    const user = await createTestUser(testPrisma);
    const create = await request(server.baseUrl)
      .post("/api/bees")
      .set(authHeader(user.id))
      .send({ title: "Mine" });
    await addWordsRound(create.body.id, user.id, ["apple"]);
    await addWordsRound(create.body.id, user.id, ["banana"]);
    await addWordsRound(create.body.id, user.id, ["cherry"]);

    const del = await request(server.baseUrl)
      .delete(`/api/bees/${create.body.id}/rounds/1`)
      .set(authHeader(user.id));
    expect(del.status).toBe(200);
    expect(del.body.totalRounds).toBe(2);

    const rounds = await request(server.baseUrl)
      .get(`/api/bees/${create.body.id}/rounds`)
      .set(authHeader(user.id));
    expect(rounds.body).toHaveLength(2);
    expect(rounds.body[0].roundNumber).toBe(1);
    expect(rounds.body[0].assignedWords).toEqual(["banana"]);
    expect(rounds.body[1].roundNumber).toBe(2);
    expect(rounds.body[1].assignedWords).toEqual(["cherry"]);
  });

  it("deletes the last round without renumbering anything else", async () => {
    const user = await createTestUser(testPrisma);
    const create = await request(server.baseUrl)
      .post("/api/bees")
      .set(authHeader(user.id))
      .send({ title: "Mine" });
    await addWordsRound(create.body.id, user.id, ["apple"]);
    await addWordsRound(create.body.id, user.id, ["banana"]);

    const del = await request(server.baseUrl)
      .delete(`/api/bees/${create.body.id}/rounds/2`)
      .set(authHeader(user.id));
    expect(del.status).toBe(200);
    expect(del.body.totalRounds).toBe(1);

    const rounds = await request(server.baseUrl)
      .get(`/api/bees/${create.body.id}/rounds`)
      .set(authHeader(user.id));
    expect(rounds.body).toHaveLength(1);
    expect(rounds.body[0].roundNumber).toBe(1);
    expect(rounds.body[0].assignedWords).toEqual(["apple"]);
  });

  it("returns 409 once the bee has started", async () => {
    const user = await createTestUser(testPrisma);
    const create = await request(server.baseUrl)
      .post("/api/bees")
      .set(authHeader(user.id))
      .send({ title: "Mine" });
    await addWordsRound(create.body.id, user.id);
    await request(server.baseUrl).post(`/api/bees/${create.body.id}/start`).set(authHeader(user.id));

    const res = await request(server.baseUrl)
      .delete(`/api/bees/${create.body.id}/rounds/1`)
      .set(authHeader(user.id));
    expect(res.status).toBe(409);
  });

  it("returns 404 for an unknown round number", async () => {
    const user = await createTestUser(testPrisma);
    const create = await request(server.baseUrl)
      .post("/api/bees")
      .set(authHeader(user.id))
      .send({ title: "Mine" });
    await addWordsRound(create.body.id, user.id);

    const res = await request(server.baseUrl)
      .delete(`/api/bees/${create.body.id}/rounds/99`)
      .set(authHeader(user.id));
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/bees/:beeId", () => {
  it("deletes a bee while created, cascading rounds and participants", async () => {
    const user = await createTestUser(testPrisma);
    const create = await request(server.baseUrl)
      .post("/api/bees")
      .set(authHeader(user.id))
      .send({ title: "Mine" });
    await addWordsRound(create.body.id, user.id);

    const res = await request(server.baseUrl)
      .delete(`/api/bees/${create.body.id}`)
      .set(authHeader(user.id));
    expect(res.status).toBe(204);

    const getRes = await request(server.baseUrl)
      .get(`/api/bees/${create.body.id}`)
      .set(authHeader(user.id));
    expect(getRes.status).toBe(404);
  });

  it("returns 409 once the bee has started", async () => {
    const user = await createTestUser(testPrisma);
    const create = await request(server.baseUrl)
      .post("/api/bees")
      .set(authHeader(user.id))
      .send({ title: "Mine" });
    await addWordsRound(create.body.id, user.id);
    await request(server.baseUrl).post(`/api/bees/${create.body.id}/start`).set(authHeader(user.id));

    const res = await request(server.baseUrl)
      .delete(`/api/bees/${create.body.id}`)
      .set(authHeader(user.id));
    expect(res.status).toBe(409);
  });

  it("returns 403 when deleting another user's bee", async () => {
    const user = await createTestUser(testPrisma);
    const otherUser = await createTestUser(testPrisma);
    const create = await request(server.baseUrl)
      .post("/api/bees")
      .set(authHeader(user.id))
      .send({ title: "Mine" });

    const res = await request(server.baseUrl)
      .delete(`/api/bees/${create.body.id}`)
      .set(authHeader(otherUser.id));
    expect(res.status).toBe(403);
  });
});

describe("PATCH /api/bees/:beeId", () => {
  it("updates the title while status is created", async () => {
    const user = await createTestUser(testPrisma);
    const create = await request(server.baseUrl)
      .post("/api/bees")
      .set(authHeader(user.id))
      .send({ title: "Old Title" });

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
      .send({ title: "Old Title" });
    await addWordsRound(create.body.id, user.id);
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
      .send({ title: "Mine" });
    await addWordsRound(create.body.id, user.id);

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
      .send({ title: "Mine" });
    await addWordsRound(create.body.id, user.id);
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
      .send({ title: "Mine" });

    const res = await request(server.baseUrl)
      .post(`/api/bees/${create.body.id}/start`)
      .set(authHeader(otherUser.id));
    expect(res.status).toBe(403);
  });
});

describe("POST /api/bees/:beeId/reopen", () => {
  async function completeBee(userId: number): Promise<number> {
    const create = await request(server.baseUrl)
      .post("/api/bees")
      .set(authHeader(userId))
      .send({ title: "Mine" });
    await addWordsRound(create.body.id, userId);
    await request(server.baseUrl).post(`/api/bees/${create.body.id}/start`).set(authHeader(userId));
    await addParticipant(testPrisma, create.body.id, "Alice");
    await request(server.baseUrl).post(`/api/bees/${create.body.id}/end`).set(authHeader(userId));
    return create.body.id;
  }

  it("reopens a completed bee back to created, clearing the gamekey and participants", async () => {
    const user = await createTestUser(testPrisma);
    const beeId = await completeBee(user.id);

    const res = await request(server.baseUrl)
      .post(`/api/bees/${beeId}/reopen`)
      .set(authHeader(user.id));
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("created");
    expect(res.body.gamekey).toBeNull();
    expect(res.body.currentRound).toBe(0);

    const participants = await request(server.baseUrl)
      .get(`/api/bees/${beeId}/participants`)
      .set(authHeader(user.id));
    expect(participants.body.active).toHaveLength(0);
    expect(participants.body.eliminated).toHaveLength(0);
  });

  it("keeps the bee's rounds and word lists intact so it can be restarted as-is", async () => {
    const user = await createTestUser(testPrisma);
    const beeId = await completeBee(user.id);

    await request(server.baseUrl).post(`/api/bees/${beeId}/reopen`).set(authHeader(user.id));

    const rounds = await request(server.baseUrl)
      .get(`/api/bees/${beeId}/rounds`)
      .set(authHeader(user.id));
    expect(rounds.body).toHaveLength(1);
    expect(rounds.body[0].assignedWords).toEqual(["apple"]);

    const restart = await request(server.baseUrl)
      .post(`/api/bees/${beeId}/start`)
      .set(authHeader(user.id));
    expect(restart.status).toBe(200);
    expect(restart.body.status).toBe("in_progress");
  });

  it("rejects reopening a bee that isn't completed", async () => {
    const user = await createTestUser(testPrisma);
    const create = await request(server.baseUrl)
      .post("/api/bees")
      .set(authHeader(user.id))
      .send({ title: "Mine" });

    const res = await request(server.baseUrl)
      .post(`/api/bees/${create.body.id}/reopen`)
      .set(authHeader(user.id));
    expect(res.status).toBe(409);
  });

  it("returns 403 when reopening another user's bee", async () => {
    const user = await createTestUser(testPrisma);
    const otherUser = await createTestUser(testPrisma);
    const beeId = await completeBee(user.id);

    const res = await request(server.baseUrl)
      .post(`/api/bees/${beeId}/reopen`)
      .set(authHeader(otherUser.id));
    expect(res.status).toBe(403);
  });
});
