import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import request from "supertest";
import { testPrisma } from "../helpers/prismaTestClient.ts";
import { resetDatabase } from "../helpers/resetDb.ts";
import { startTestServer, type TestServer } from "../helpers/testServer.ts";
import { authHeader } from "../helpers/authHelpers.ts";
import { createTestUser, buildEvent, buildLiveEvent } from "../helpers/factories.ts";

let server: TestServer;

beforeAll(() => {
  server = startTestServer(testPrisma);
});

beforeEach(async () => {
  await resetDatabase(testPrisma);
});

describe("auth guarding", () => {
  it("rejects requests with no Authorization header", async () => {
    const res = await request(server.app).get("/api/events");
    expect(res.status).toBe(401);
  });
});

describe("ownership", () => {
  it("returns 403 when a different host requests the event", async () => {
    const { event } = await buildEvent(testPrisma);
    const otherUser = await createTestUser(testPrisma);

    const res = await request(server.app).get(`/api/events/${event.id}`).set(authHeader(otherUser.id));
    expect(res.status).toBe(403);
  });
});

describe("event + builder flow over HTTP", () => {
  it("creates an event, adds a participant (who doubles as a suspect), builds a round, and starts it", async () => {
    const user = await createTestUser(testPrisma);

    const eventRes = await request(server.app)
      .post("/api/events")
      .set(authHeader(user.id))
      .send({ title: "The Lighthouse" });
    expect(eventRes.status).toBe(201);
    const eventId = eventRes.body.id;

    const participantRes = await request(server.app)
      .post(`/api/events/${eventId}/participants`)
      .set(authHeader(user.id))
      .send({ name: "Jo", email: "jo@example.com", characterName: "The Keeper" });
    expect(participantRes.status).toBe(201);

    const roundRes = await request(server.app).post(`/api/events/${eventId}/rounds`).set(authHeader(user.id));
    expect(roundRes.status).toBe(201);

    const startRes = await request(server.app).post(`/api/events/${eventId}/start`).set(authHeader(user.id));
    expect(startRes.status).toBe(200);
    expect(startRes.body.status).toBe("in_progress");
  });

  it("rejects an invalid email when adding a participant", async () => {
    const { event, userId } = await buildEvent(testPrisma, { participants: [] });
    const res = await request(server.app)
      .post(`/api/events/${event.id}/participants`)
      .set(authHeader(userId))
      .send({ name: "Jo", email: "not-an-email" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("attendance + round lifecycle over HTTP", () => {
  it("takes attendance, opens a round, and reports a tally excluding absentees", async () => {
    const { event, userId, participants } = await buildEvent(testPrisma);

    await request(server.app).post(`/api/events/${event.id}/rounds`).set(authHeader(userId));
    await request(server.app).post(`/api/events/${event.id}/start`).set(authHeader(userId));

    const attendanceRes = await request(server.app)
      .put(`/api/events/${event.id}/attendance`)
      .set(authHeader(userId))
      .send({ presentParticipantIds: [participants[0].id] });
    expect(attendanceRes.status).toBe(200);

    const openRes = await request(server.app)
      .post(`/api/events/${event.id}/rounds/1/open`)
      .set(authHeader(userId));
    expect(openRes.status).toBe(200);
    expect(openRes.body.round.status).toBe("open");

    const tallyRes = await request(server.app)
      .get(`/api/events/${event.id}/rounds/1/tally`)
      .set(authHeader(userId));
    expect(tallyRes.status).toBe(200);
    expect(tallyRes.body.totalBallots).toBe(1);
    expect(tallyRes.body.participants).toHaveLength(1);
    expect(tallyRes.body.participants[0].participantId).toBe(participants[0].id);
  });
});

describe("public vote routes", () => {
  it("returns ballot details for GET and records a vote for POST", async () => {
    const { ballots, suspects } = await buildLiveEvent(testPrisma);

    const getRes = await request(server.app).get(`/api/vote/${ballots[0].token}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.suspects.length).toBeGreaterThan(0);

    const postRes = await request(server.app)
      .post(`/api/vote/${ballots[0].token}`)
      .send({ suspectId: suspects[0].id });
    expect(postRes.status).toBe(200);
    expect(postRes.body.ok).toBe(true);

    const again = await request(server.app).get(`/api/vote/${ballots[0].token}`);
    expect(again.status).toBe(409);
    expect(again.body.error.code).toBe("BALLOT_ALREADY_CAST");
  });

  it("returns 404 for an unknown token", async () => {
    const res = await request(server.app).get("/api/vote/does-not-exist");
    expect(res.status).toBe(404);
  });
});
