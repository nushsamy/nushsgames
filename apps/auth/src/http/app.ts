import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import type { PrismaClient } from "../../generated/prisma/client.ts";
import { createAuthRouter } from "./routes/auth.routes.ts";
import { errorHandler } from "./errors.ts";

function parseFrontendUrls(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((url) => url.trim())
    .filter((url) => url.length > 0);
}

export function createApp(prisma: PrismaClient): Express {
  const app = express();
  // credentials: true + an explicit origin allowlist (never "*") is required so the browser
  // will both send and store the httpOnly session cookie on cross-origin requests from either
  // frontend.
  app.use(cors({ origin: parseFrontendUrls(process.env.FRONTEND_URLS), credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.use("/api/auth", createAuthRouter(prisma));

  app.use((_req, res) => {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found" } });
  });
  app.use(errorHandler);

  return app;
}
