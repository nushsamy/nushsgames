import "dotenv/config";
import express from "express";
import cors from "cors";
import { requireAuth } from "@nushsgames/shared-auth";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

requireEnv("JWT_SECRET");
requireEnv("FRONTEND_URL");

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Proves @nushsgames/shared-auth is wired up: accepts the same access tokens
// signAccessToken() issues in the spelling-bee app.
app.get("/api/me", requireAuth, (req, res) => {
  res.json({ userId: req.userId });
});

const port = Number(process.env.PORT ?? 5001);

app.listen(port, () => {
  console.log(`murder-mystery-voter server listening on port ${port}`);
});
