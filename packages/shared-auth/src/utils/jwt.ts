import jwt, { type JwtPayload } from "jsonwebtoken";
import { UnauthorizedError } from "../errors.ts";

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL = "30d";

type TokenType = "access" | "refresh";

export interface AccessTokenPayload {
  sub: string;
  type: "access";
}

export interface RefreshTokenPayload {
  sub: string;
  type: "refresh";
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return secret;
}

export function signAccessToken(userId: number): string {
  return jwt.sign({ type: "access" satisfies TokenType }, getSecret(), {
    subject: String(userId),
    expiresIn: ACCESS_TOKEN_TTL,
  });
}

export function signRefreshToken(userId: number): string {
  return jwt.sign({ type: "refresh" satisfies TokenType }, getSecret(), {
    subject: String(userId),
    expiresIn: REFRESH_TOKEN_TTL,
  });
}

function verifyToken(token: string, expectedType: TokenType): { sub: string; type: TokenType } {
  let decoded: JwtPayload;
  try {
    decoded = jwt.verify(token, getSecret()) as JwtPayload;
  } catch {
    throw new UnauthorizedError("Invalid or expired token");
  }
  if (typeof decoded.sub !== "string" || decoded.type !== expectedType) {
    throw new UnauthorizedError(`Expected a "${expectedType}" token`);
  }
  return { sub: decoded.sub, type: expectedType };
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return verifyToken(token, "access") as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return verifyToken(token, "refresh") as RefreshTokenPayload;
}
