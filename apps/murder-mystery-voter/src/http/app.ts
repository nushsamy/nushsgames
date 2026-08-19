import express, { type Express } from "express";
import cors from "cors";
import type { PrismaClient } from "../../generated/prisma/client.ts";
import { createEventsRouter } from "./routes/events.routes.ts";
import { createVoteRouter } from "./routes/vote.routes.ts";
import { errorHandler } from "./errors.ts";

export function createApp(prisma: PrismaClient): Express {
  const app = express();
  app.use(cors({ origin: process.env.FRONTEND_URL }));
  app.use(express.json());

  app.use("/api/events", createEventsRouter(prisma));
  app.use("/api/vote", createVoteRouter(prisma));

  app.use((_req, res) => {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found" } });
  });
  app.use(errorHandler);

  return app;
}
