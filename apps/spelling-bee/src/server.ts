import "dotenv/config";
import { prisma } from "./db/client.ts";
import { buildServer } from "./http/buildServer.ts";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

requireEnv("JWT_SECRET");
requireEnv("FRONTEND_URL");

const port = Number(process.env.PORT ?? 5000);

const { httpServer } = buildServer(prisma);

httpServer.listen(port, () => {
  console.log(`Spelling bee server listening on port ${port}`);
});
