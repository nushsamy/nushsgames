import http from "node:http";
import type { PrismaClient } from "../../generated/prisma/client.ts";
import { createApp } from "./app.ts";
import { createSocketServer } from "./io/index.ts";

export interface BuiltServer {
  app: ReturnType<typeof createApp>;
  httpServer: http.Server;
  io: ReturnType<typeof createSocketServer>;
}

export function buildServer(prisma: PrismaClient): BuiltServer {
  const httpServer = http.createServer();
  const io = createSocketServer(httpServer, prisma);
  const app = createApp(prisma, io);
  httpServer.on("request", app);
  return { app, httpServer, io };
}
