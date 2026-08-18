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

if (!process.env.RESEND_API_KEY) {
  console.warn("RESEND_API_KEY is not set -- ballot emails will be logged, not sent.");
}

const port = Number(process.env.PORT ?? 5001);

const app = createApp(prisma);

app.listen(port, () => {
  console.log(`murder-mystery-voter server listening on port ${port}`);
});
