import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import request from "supertest";
import { testPrisma } from "../helpers/prismaTestClient.ts";
import { resetDatabase } from "../helpers/resetDb.ts";
import { startTestServer, type TestServer } from "../helpers/testServer.ts";

let server: TestServer;

beforeAll(() => {
  server = startTestServer(testPrisma);
});

beforeEach(async () => {
  await resetDatabase(testPrisma);
});

describe("POST /api/auth/register", () => {
  it("creates a user and returns tokens", async () => {
    const res = await request(server.app)
      .post("/api/auth/register")
      .send({ email: "host@example.com", password: "password123" });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe("host@example.com");
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();
  });

  it("rejects a duplicate email", async () => {
    await request(server.app).post("/api/auth/register").send({ email: "host@example.com", password: "password123" });
    const res = await request(server.app)
      .post("/api/auth/register")
      .send({ email: "host@example.com", password: "password123" });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("EMAIL_ALREADY_REGISTERED");
  });
});

describe("POST /api/auth/login", () => {
  it("rejects invalid credentials", async () => {
    const res = await request(server.app)
      .post("/api/auth/login")
      .send({ email: "nobody@example.com", password: "whatever1" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("logs in a registered user", async () => {
    await request(server.app).post("/api/auth/register").send({ email: "host@example.com", password: "password123" });
    const res = await request(server.app)
      .post("/api/auth/login")
      .send({ email: "host@example.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
  });
});
