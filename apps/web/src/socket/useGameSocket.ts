import { useCallback, useEffect, useRef, useState } from "react";
import { GameSocketClient } from "@/socket/socketClient";
import type { ClientToServerEvents, ConnectionStatus, ServerToClientEvents } from "@/socket/types";

export interface UseGameSocketResult {
  connectionStatus: ConnectionStatus;
  emit: <E extends keyof ClientToServerEvents>(event: E, ...args: Parameters<ClientToServerEvents[E]>) => void;
}

export function useGameSocket(
  gamekey: string | null,
  handlers: Partial<ServerToClientEvents>,
): UseGameSocketResult {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;
  const clientRef = useRef<GameSocketClient | null>(null);

  useEffect(() => {
    if (!gamekey) return;

    const client = new GameSocketClient(gamekey);
    clientRef.current = client;
    const unsubscribeStatus = client.onConnectionStatusChange(setStatus);

    const eventNames = Object.keys(handlersRef.current) as Array<keyof ServerToClientEvents>;
    const wrapped = eventNames.map((event) => {
      const handler = ((...args: unknown[]) => {
        const current = handlersRef.current[event];
        (current as (...a: unknown[]) => void)?.(...args);
      }) as ServerToClientEvents[typeof event];
      client.on(event, handler);
      return { event, handler };
    });

    client.connect();

    return () => {
      wrapped.forEach(({ event, handler }) => client.off(event, handler));
      unsubscribeStatus();
      client.disconnect();
      clientRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gamekey]);

  const emit = useCallback(
    <E extends keyof ClientToServerEvents>(event: E, ...args: Parameters<ClientToServerEvents[E]>) => {
      clientRef.current?.emit(event, ...args);
    },
    [],
  );

  return { connectionStatus: status, emit };
}
