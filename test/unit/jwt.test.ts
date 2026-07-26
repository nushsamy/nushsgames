import { describe, it, expect, beforeAll } from "vitest";
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "../../src/http/jwt.ts";
import { UnauthorizedError } from "../../src/http/errors.ts";

beforeAll(() => {
  process.env.JWT_SECRET ??= "test-secret";
});

describe("access/refresh token sign+verify", () => {
  it("round-trips an access token", () => {
    const token = signAccessToken(42);
    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe("42");
    expect(payload.type).toBe("access");
  });

  it("round-trips a refresh token", () => {
    const token = signRefreshToken(42);
    const payload = verifyRefreshToken(token);
    expect(payload.sub).toBe("42");
    expect(payload.type).toBe("refresh");
  });

  it("rejects an access token passed to verifyRefreshToken", () => {
    const token = signAccessToken(42);
    expect(() => verifyRefreshToken(token)).toThrow(UnauthorizedError);
  });

  it("rejects a refresh token passed to verifyAccessToken", () => {
    const token = signRefreshToken(42);
    expect(() => verifyAccessToken(token)).toThrow(UnauthorizedError);
  });

  it("rejects a token signed with a different secret", () => {
    const realSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = "a-different-secret";
    const token = signAccessToken(42);
    process.env.JWT_SECRET = realSecret;

    expect(() => verifyAccessToken(token)).toThrow(UnauthorizedError);
  });

  it("rejects a malformed token string", () => {
    expect(() => verifyAccessToken("not-a-real-token")).toThrow(UnauthorizedError);
  });
});
