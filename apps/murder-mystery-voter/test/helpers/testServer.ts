import type { PrismaClient } from "../../generated/prisma/client.ts";
import { createApp } from "../../src/http/app.ts";

export interface TestServer {
  app: ReturnType<typeof createApp>;
}

export function startTestServer(prisma: PrismaClient): TestServer {
  return { app: createApp(prisma) };
}
