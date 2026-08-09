import { Server as SocketIOServer, type Socket } from "socket.io";
import type { Server as HttpServer } from "node:http";
import type { PrismaClient } from "../../../generated/prisma/client.ts";
import { getBeeByGamekey } from "../../services/beeService.ts";
import { verifyAccessToken } from "@nushsgames/shared-auth";
import { roomName, hostRoomName } from "./rooms.ts";

type Role = "host" | "display";

interface JoinPayload {
  gamekey?: string;
  token?: string;
}

export function createSocketServer(httpServer: HttpServer, prisma: PrismaClient): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: { origin: process.env.FRONTEND_URL },
    // WebSocket-only: avoids a known engine.io HTTP long-polling race that can
    // write a response twice and crash the process (ERR_HTTP_HEADERS_SENT).
    transports: ["websocket"],
  });

  io.on("connection", (socket: Socket) => {
    socket.on("join", async (payload: JoinPayload) => {
      const gamekey = payload?.gamekey;
      if (typeof gamekey !== "string" || !gamekey) {
        socket.emit("join:error", { message: "A gamekey is required to join" });
        return;
      }

      let bee;
      try {
        bee = await getBeeByGamekey(prisma, gamekey);
      } catch {
        socket.emit("join:error", { message: `No bee found for gamekey "${gamekey}"` });
        return;
      }

      let role: Role = "display";
      if (payload?.token) {
        try {
          const { sub } = verifyAccessToken(payload.token);
          if (Number(sub) === bee.userId) {
            role = "host";
            await socket.join(hostRoomName(gamekey));
          }
        } catch {
          // Invalid/expired token: fall back to a display-role join rather than failing.
        }
      }

      socket.data.role = role;
      socket.data.gamekey = gamekey;
      await socket.join(roomName(gamekey));
      socket.emit("client:connected", { gamekey, role });
    });

    socket.on("typing:update", (payload) => {
      if (socket.data.role !== "host" || !socket.data.gamekey) {
        return;
      }
      io.to(roomName(socket.data.gamekey)).emit("typing:update", payload);
    });

    socket.on("word:revealed", (payload) => {
      if (socket.data.role !== "host" || !socket.data.gamekey) {
        return;
      }
      io.to(hostRoomName(socket.data.gamekey)).emit("word:revealed", payload);
    });

    socket.on("disconnect", () => {
      if (socket.data.gamekey) {
        socket.to(roomName(socket.data.gamekey)).emit("client:disconnected", { gamekey: socket.data.gamekey });
      }
    });
  });

  return io;
}
