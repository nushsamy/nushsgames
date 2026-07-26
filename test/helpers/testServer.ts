import type { AddressInfo } from "node:net";
import type { PrismaClient } from "../../generated/prisma/client.ts";
import { buildServer, type BuiltServer } from "../../src/http/buildServer.ts";

export interface TestServer {
  app: BuiltServer["app"];
  io: BuiltServer["io"];
  baseUrl: string;
  close: () => Promise<void>;
}

export async function startTestServer(prisma: PrismaClient): Promise<TestServer> {
  const { app, httpServer, io } = buildServer(prisma);

  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  const { port } = httpServer.address() as AddressInfo;

  return {
    app,
    io,
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((resolve, reject) => {
      io.close((err) => (err ? reject(err) : resolve()));
    }),
  };
}
