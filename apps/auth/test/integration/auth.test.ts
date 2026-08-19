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
  it("registers a new account, returns an access token, and sets an httpOnly session cookie", async () => {
    const res = await request(server.baseUrl)
      .post("/api/auth/register")
      .send({ email: "host@example.com", password: "hunter22" });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe("host@example.com");
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.refreshToken).toBeUndefined();

    const cookies = res.headers["set-cookie"] as unknown as string[];
    const sessionCookie = cookies.find((c) => c.startsWith("nushsgames_session="));
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie).toMatch(/HttpOnly/i);
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
  it("exchanges the session cookie set at login for a new access token", async () => {
    const agent = request.agent(server.baseUrl);
    await agent.post("/api/auth/register").send({ email: "host@example.com", password: "hunter22" });

    const res = await agent.post("/api/auth/refresh").send();

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
  });

  it("rejects a refresh request with no session cookie with 401", async () => {
    const res = await request(server.baseUrl).post("/api/auth/refresh").send();
    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/logout", () => {
  it("clears the session cookie, so a later refresh fails", async () => {
    const agent = request.agent(server.baseUrl);
    await agent.post("/api/auth/register").send({ email: "host@example.com", password: "hunter22" });

    const logoutRes = await agent.post("/api/auth/logout").send();
    expect(logoutRes.status).toBe(204);

    const refreshRes = await agent.post("/api/auth/refresh").send();
    expect(refreshRes.status).toBe(401);
  });
});

describe("GET /api/auth/me", () => {
  it("returns the current user's profile for a valid access token", async () => {
    const register = await request(server.baseUrl)
      .post("/api/auth/register")
      .send({ email: "host@example.com", password: "hunter22" });

    const res = await request(server.baseUrl)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${register.body.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("host@example.com");
  });

  it("rejects a request with no access token with 401", async () => {
    const res = await request(server.baseUrl).get("/api/auth/me");
    expect(res.status).toBe(401);
  });
});
