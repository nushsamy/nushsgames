import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import type { PrismaClient } from "../../generated/prisma/client.ts";
import { createApp } from "../../src/http/app.ts";

export interface TestServer {
  baseUrl: string;
  close: () => Promise<void>;
}

export async function startTestServer(prisma: PrismaClient): Promise<TestServer> {
  const app = createApp(prisma);
  const httpServer: Server = app.listen(0);

  await new Promise<void>((resolve) => httpServer.once("listening", resolve));
  const { port } = httpServer.address() as AddressInfo;

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((resolve, reject) => {
      httpServer.close((err) => (err ? reject(err) : resolve()));
    }),
  };
}
