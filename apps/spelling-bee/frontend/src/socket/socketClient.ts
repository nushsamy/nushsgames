import { io, type Socket } from "socket.io-client";
import { ensureFreshAccessToken, forceRefreshAccessToken } from "@/api/httpClient";
import type { ClientToServerEvents, ConnectionStatus, ServerToClientEvents } from "@/socket/types";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? "http://localhost:5000";

type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export class GameSocketClient {
  private socket: GameSocket | null = null;
  private gamekey: string;
  private statusListeners = new Set<(status: ConnectionStatus) => void>();
  private hasSelfHealed = false;

  constructor(gamekey: string) {
    this.gamekey = gamekey;
  }

  connect(): void {
    if (this.socket) return;

    // Match the server's websocket-only transport config (see src/http/io/index.ts).
    const socket: GameSocket = io(SOCKET_URL, { transports: ["websocket"] });
    this.socket = socket;

    socket.on("connect", () => {
      this.hasSelfHealed = false;
      void this.joinRoom();
    });

    socket.on("client:connected", ({ role }) => {
      if (role === "host") {
        this.setStatus("connected");
        return;
      }
      // Server silently downgraded to display (invalid/expired token at join time) -- self-heal once.
      if (!this.hasSelfHealed) {
        this.hasSelfHealed = true;
        void this.joinRoom(true);
      }
    });

    socket.on("disconnect", () => this.setStatus("disconnected"));
    socket.io.on("reconnect_attempt", () => this.setStatus("reconnecting"));
  }

  private async joinRoom(forceRefresh = false): Promise<void> {
    if (!this.socket) return;
    const token = forceRefresh ? await forceRefreshAccessToken() : await ensureFreshAccessToken();
    this.socket.emit("join", { gamekey: this.gamekey, token: token ?? undefined });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.statusListeners.clear();
  }

  emit<E extends keyof ClientToServerEvents>(event: E, ...args: Parameters<ClientToServerEvents[E]>): void {
    this.socket?.emit(event, ...args);
  }

  on<E extends keyof ServerToClientEvents>(event: E, handler: ServerToClientEvents[E]): void {
    this.socket?.on(event, handler as never);
  }

  off<E extends keyof ServerToClientEvents>(event: E, handler: ServerToClientEvents[E]): void {
    this.socket?.off(event, handler as never);
  }

  onConnectionStatusChange(cb: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(cb);
    return () => this.statusListeners.delete(cb);
  }

  private setStatus(status: ConnectionStatus): void {
    this.statusListeners.forEach((cb) => cb(status));
  }
}
