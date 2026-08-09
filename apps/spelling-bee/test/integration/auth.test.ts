import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { testPrisma } from "../helpers/prismaTestClient.ts";
import { resetDatabase } from "../helpers/resetDb.ts";
import { startTestServer, type TestServer } from "../helpers/testServer.ts";

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

describe("POST /api/auth/register", () => {
  it("registers a new host and returns tokens without leaking the password hash", async () => {
    const res = await request(server.baseUrl)
      .post("/api/auth/register")
      .send({ email: "host@example.com", password: "hunter22" });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe("host@example.com");
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.refreshToken).toEqual(expect.any(String));
  });

  it("rejects duplicate email registration with 409", async () => {
    await request(server.baseUrl)
      .post("/api/auth/register")
      .send({ email: "host@example.com", password: "hunter22" });

    const res = await request(server.baseUrl)
      .post("/api/auth/register")
      .send({ email: "host@example.com", password: "hunter22" });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("EMAIL_ALREADY_REGISTERED");
  });

  it("rejects a missing password with 400", async () => {
    const res = await request(server.baseUrl)
      .post("/api/auth/register")
      .send({ email: "host@example.com" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("POST /api/auth/login", () => {
  it("logs in with correct credentials", async () => {
    await request(server.baseUrl)
      .post("/api/auth/register")
      .send({ email: "host@example.com", password: "hunter22" });

    const res = await request(server.baseUrl)
      .post("/api/auth/login")
      .send({ email: "host@example.com", password: "hunter22" });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
  });

  it("rejects a wrong password with 401", async () => {
    await request(server.baseUrl)
      .post("/api/auth/register")
      .send({ email: "host@example.com", password: "hunter22" });

    const res = await request(server.baseUrl)
      .post("/api/auth/login")
      .send({ email: "host@example.com", password: "wrong-password" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
  });
});

describe("POST /api/auth/refresh", () => {
  it("exchanges a refresh token for a new access token", async () => {
    const register = await request(server.baseUrl)
      .post("/api/auth/register")
      .send({ email: "host@example.com", password: "hunter22" });

    const res = await request(server.baseUrl)
      .post("/api/auth/refresh")
      .send({ refreshToken: register.body.refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
  });

  it("rejects an access token used as a refresh token with 401", async () => {
    const register = await request(server.baseUrl)
      .post("/api/auth/register")
      .send({ email: "host@example.com", password: "hunter22" });

    const res = await request(server.baseUrl)
      .post("/api/auth/refresh")
      .send({ refreshToken: register.body.accessToken });

    expect(res.status).toBe(401);
  });
});
