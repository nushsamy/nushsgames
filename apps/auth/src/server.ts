import "dotenv/config";
import { prisma } from "./db/client.ts";
import { createApp } from "./http/app.ts";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

requireEnv("JWT_SECRET");
requireEnv("FRONTEND_URL");

const port = Number(process.env.PORT ?? 5002);

const app = createApp(prisma);

app.listen(port, () => {
  console.log(`auth server listening on port ${port}`);
});
