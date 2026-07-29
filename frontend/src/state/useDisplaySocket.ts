import { useEffect, useReducer, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { getGamekeyState } from "@/api/gamekey";
import type { ClientToServerEvents, ServerToClientEvents } from "@/socket/types";
import { displayReducer } from "@/state/displayReducer";
import { INITIAL_DISPLAY_STATE, type DisplayAction, type DisplayState, type WinnerInfo } from "@/state/displayTypes";

const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL as string | undefined) ?? "http://localhost:5000";

export const VERDICT_HOLD_MS = 3500;
export const ROUND_END_HOLD_MS = 5000;
export const RECONNECT_ESCALATION_MS = 30_000;

export interface UseDisplaySocketResult {
  state: DisplayState;
  retryConnection: () => void;
}

/**
 * `GameSocketClient` (src/socket/socketClient.ts) is host-oriented: it always attempts a
 * token-authenticated join and only ever reports "connected" for role "host", so it can't
 * represent a genuinely public display connection. This hook talks to the raw socket.io-client
 * directly instead, reusing only the shared event-type contract from src/socket/types.ts.
 */
export function useDisplaySocket(gamekey: string): UseDisplaySocketResult {
  const [state, dispatch] = useReducer(displayReducer, INITIAL_DISPLAY_STATE);
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);

  useEffect(() => {
    let cancelled = false;
    let hasJoinedOnce = false;
    let roundEndHoldActive = false;
    let pendingAction: DisplayAction | null = null;
    let verdictTimer: ReturnType<typeof setTimeout> | null = null;
    let roundEndTimer: ReturnType<typeof setTimeout> | null = null;
    let escalationTimer: ReturnType<typeof setTimeout> | null = null;
    // totalRounds is fixed once a bee starts (rounds can only be added pre-start), and
    // round:start never carries it -- cache it from hydrate() for later round:start events,
    // since `state` inside this effect closure is a one-time snapshot, not live.
    let totalRounds = 0;

    async function hydrate(): Promise<void> {
      try {
        const data = await getGamekeyState(gamekey);
        if (cancelled) return;
        totalRounds = data.totalRounds;
        const winner: WinnerInfo | null = data.standings?.winner
          ? { id: data.standings.winner.id, name: data.standings.winner.name }
          : null;
        dispatch({
          type: "hydrate:success",
          status: data.status === "completed" ? "completed" : "in_progress",
          roundNumber: data.currentRound,
          totalRounds: data.totalRounds,
          currentParticipant: data.currentParticipant,
          winner,
        });
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Could not load bee state";
        dispatch({ type: "hydrate:error", message });
      }
    }

    function clearEscalationTimer(): void {
      if (escalationTimer) {
        clearTimeout(escalationTimer);
        escalationTimer = null;
      }
    }

    function dispatchOrBuffer(action: DisplayAction): void {
      if (roundEndHoldActive) {
        pendingAction = action;
        return;
      }
      dispatch(action);
    }

    void (async () => {
      await hydrate();
      if (cancelled) return;

      // Match the server's websocket-only transport config (see src/http/io/index.ts).
      const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SOCKET_URL, {
        transports: ["websocket"],
      });
      socketRef.current = socket;

      socket.on("connect", () => {
        dispatch({ type: hasJoinedOnce ? "conn:reconnecting" : "conn:connecting" });
        socket.emit("join", { gamekey });
      });

      socket.on("client:connected", () => {
        clearEscalationTimer();
        dispatch({ type: "conn:open" });
        if (hasJoinedOnce) {
          void hydrate();
        }
        hasJoinedOnce = true;
      });

      socket.on("join:error", ({ message }) => {
        dispatch({ type: "join:error", message });
      });

      socket.on("disconnect", () => {
        dispatch({ type: "conn:reconnecting" });
        escalationTimer = setTimeout(() => {
          dispatch({ type: "conn:lost" });
        }, RECONNECT_ESCALATION_MS);
      });

      socket.on("connect_error", () => {
        dispatch({ type: "conn:reconnecting" });
      });

      socket.on("round:start", ({ roundNumber, participantName }) => {
        dispatchOrBuffer({
          type: "round:start",
          roundNumber,
          totalRounds,
          participantName: participantName ?? null,
        });
      });

      socket.on("typing:update", ({ currentSpelling }) => {
        dispatch({ type: "typing:update", currentSpelling });
      });

      socket.on("response:submitted", ({ participantName, word, userSpelling, isCorrect }) => {
        dispatch({ type: "response:submitted", verdict: { participantName, word, userSpelling, isCorrect } });
        if (verdictTimer) clearTimeout(verdictTimer);
        verdictTimer = setTimeout(() => {
          dispatch({ type: "verdict:cleared" });
          void hydrate();
        }, VERDICT_HOLD_MS);
      });

      socket.on("round:end", ({ advancedParticipants }) => {
        dispatch({ type: "round:end", advancedParticipants });
        roundEndHoldActive = true;
        pendingAction = null;
        roundEndTimer = setTimeout(() => {
          roundEndHoldActive = false;
          if (pendingAction) {
            dispatch(pendingAction);
            pendingAction = null;
          }
        }, ROUND_END_HOLD_MS);
      });

      socket.on("bee:completed", ({ winner }) => {
        dispatchOrBuffer({ type: "bee:completed", winner: winner ? { id: winner.id, name: winner.name } : null });
      });
    })();

    return () => {
      cancelled = true;
      if (verdictTimer) clearTimeout(verdictTimer);
      if (roundEndTimer) clearTimeout(roundEndTimer);
      clearEscalationTimer();
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gamekey]);

  function retryConnection(): void {
    socketRef.current?.connect();
  }

  return { state, retryConnection };
}
