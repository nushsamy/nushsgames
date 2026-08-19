import { Router } from "express";
import type { CookieOptions } from "express";
import type { PrismaClient } from "../../../generated/prisma/client.ts";
import { registerUser, authenticateUser } from "../../services/userService.ts";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  requireAuth,
  UnauthorizedError,
} from "@nushsgames/shared-auth";
import { asString } from "../validate.ts";

const SESSION_COOKIE = "nushsgames_session";
const SESSION_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // matches the refresh token's own TTL

function sessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth",
    // Left unset (host-only), this works for local dev since every service here runs on
    // "localhost" — cookies aren't port-scoped, so a cookie set by this service is sent on
    // requests to any localhost:* origin. In production, set COOKIE_DOMAIN to the shared
    // parent domain (e.g. ".nushsgames.com") so it's shared across each app's subdomain too.
    domain: process.env.COOKIE_DOMAIN || undefined,
    maxAge: SESSION_COOKIE_MAX_AGE_MS,
  };
}

function toUserJson(user: { id: number; email: string; createdAt: Date }) {
  return { id: user.id, email: user.email, createdAt: user.createdAt };
}

export function createAuthRouter(prisma: PrismaClient): Router {
  const router = Router();

  router.post("/register", async (req, res) => {
    const email = asString(req.body?.email, "email");
    const password = asString(req.body?.password, "password");

    const user = await registerUser(prisma, { email, password });
    res.cookie(SESSION_COOKIE, signRefreshToken(user.id), sessionCookieOptions());
    res.status(201).json({ user: toUserJson(user), accessToken: signAccessToken(user.id) });
  });

  router.post("/login", async (req, res) => {
    const email = asString(req.body?.email, "email");
    const password = asString(req.body?.password, "password");

    const user = await authenticateUser(prisma, email, password);
    res.cookie(SESSION_COOKIE, signRefreshToken(user.id), sessionCookieOptions());
    res.status(200).json({ user: toUserJson(user), accessToken: signAccessToken(user.id) });
  });

  router.post("/refresh", (req, res) => {
    const refreshToken = req.cookies?.[SESSION_COOKIE];
    if (typeof refreshToken !== "string") {
      throw new UnauthorizedError("No session cookie present");
    }
    const payload = verifyRefreshToken(refreshToken);
    res.status(200).json({ accessToken: signAccessToken(Number(payload.sub)) });
  });

  router.post("/logout", (_req, res) => {
    res.clearCookie(SESSION_COOKIE, { path: "/api/auth", domain: process.env.COOKIE_DOMAIN || undefined });
    res.status(204).end();
  });

  router.get("/me", requireAuth, async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) {
      throw new UnauthorizedError("Account no longer exists");
    }
    res.status(200).json({ user: toUserJson(user) });
  });

  return router;
}
