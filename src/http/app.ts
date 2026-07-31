import express, { type Express } from "express";
import cors from "cors";
import type { Server as SocketIOServer } from "socket.io";
import type { PrismaClient } from "../../generated/prisma/client.ts";
import { createAuthRouter } from "./routes/auth.routes.ts";
import { createBeesRouter } from "./routes/bees.routes.ts";
import { createParticipantsRouter } from "./routes/participants.routes.ts";
import { createJoinRouter, createGamekeyStateRouter } from "./routes/public.routes.ts";
import { createDictionaryRouter } from "./routes/dictionary.routes.ts";
import { errorHandler } from "./errors.ts";

export function createApp(prisma: PrismaClient, io: SocketIOServer): Express {
  const app = express();
  app.use(cors({ origin: process.env.FRONTEND_URL }));
  app.use(express.json());

  app.use("/api/auth", createAuthRouter(prisma));
  app.use("/api/bees", createBeesRouter(prisma, io));
  app.use("/api/participants", createParticipantsRouter(prisma));
  app.use("/api/join", createJoinRouter(prisma, io));
  app.use("/api/gamekey", createGamekeyStateRouter(prisma));
  app.use("/api/dictionary", createDictionaryRouter());

  app.use((_req, res) => {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found" } });
  });
  app.use(errorHandler);

  return app;
}
