import { Router } from "express";
import type { PrismaClient } from "../../../generated/prisma/client.ts";
import { registerUser, authenticateUser } from "../../services/userService.ts";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../jwt.ts";
import { asString } from "../validate.ts";

function toUserJson(user: { id: number; email: string; createdAt: Date }) {
  return { id: user.id, email: user.email, createdAt: user.createdAt };
}

export function createAuthRouter(prisma: PrismaClient): Router {
  const router = Router();

  router.post("/register", async (req, res) => {
    const email = asString(req.body?.email, "email");
    const password = asString(req.body?.password, "password");

    const user = await registerUser(prisma, { email, password });
    res.status(201).json({
      user: toUserJson(user),
      accessToken: signAccessToken(user.id),
      refreshToken: signRefreshToken(user.id),
    });
  });

  router.post("/login", async (req, res) => {
    const email = asString(req.body?.email, "email");
    const password = asString(req.body?.password, "password");

    const user = await authenticateUser(prisma, email, password);
    res.status(200).json({
      user: toUserJson(user),
      accessToken: signAccessToken(user.id),
      refreshToken: signRefreshToken(user.id),
    });
  });

  router.post("/refresh", (req, res) => {
    const refreshToken = asString(req.body?.refreshToken, "refreshToken");
    const payload = verifyRefreshToken(refreshToken);
    res.status(200).json({ accessToken: signAccessToken(Number(payload.sub)) });
  });

  return router;
}
