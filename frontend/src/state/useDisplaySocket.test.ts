import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Listener = (...args: unknown[]) => void;

function createFakeSocket() {
  const listeners = new Map<string, Set<Listener>>();
  return {
    on: vi.fn((event: string, cb: Listener) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(cb);
    }),
    off: vi.fn((event: string, cb: Listener) => {
      listeners.get(event)?.delete(cb);
    }),
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    trigger(event: string, payload?: unknown): void {
      listeners.get(event)?.forEach((cb) => cb(payload));
    },
  };
}

const fakeSocket = createFakeSocket();

vi.mock("socket.io-client", () => ({
  io: vi.fn(() => fakeSocket),
}));

const getGamekeyState = vi.fn();
vi.mock("@/api/gamekey", () => ({
  getGamekeyState: (...args: unknown[]) => getGamekeyState(...args),
}));

const { useDisplaySocket, VERDICT_HOLD_MS, ROUND_END_HOLD_MS, RECONNECT_ESCALATION_MS } = await import(
  "@/state/useDisplaySocket"
);

async function settle(): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
}

const baseState = {
  gamekey: "BEE-TEST01",
  status: "in_progress" as const,
  currentRound: 1,
  totalRounds: 2,
  currentParticipant: "Alice",
  nextParticipant: "Bob",
  participants: { active: [], eliminated: [] },
  standings: null,
};

describe("useDisplaySocket", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    fakeSocket.on.mockClear();
    fakeSocket.off.mockClear();
    fakeSocket.emit.mockClear();
    fakeSocket.connect.mockClear();
    fakeSocket.disconnect.mockClear();
    getGamekeyState.mockReset();
    getGamekeyState.mockResolvedValue(baseState);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("hydrates on mount and joins the socket once connected", async () => {
    const { result } = renderHook(() => useDisplaySocket("BEE-TEST01"));

    await settle();
    expect(result.current.state.phase.kind).toBe("turn");

    await act(async () => {
      fakeSocket.trigger("connect");
    });
    expect(fakeSocket.emit).toHaveBeenCalledWith("join", { gamekey: "BEE-TEST01" });

    act(() => {
      fakeSocket.trigger("client:connected", { gamekey: "BEE-TEST01", role: "display" });
    });
    expect(result.current.state.connection).toBe("open");
  });

  it("moves to fatal on join:error", async () => {
    const { result } = renderHook(() => useDisplaySocket("BEE-TEST01"));
    await settle();
    expect(result.current.state.phase.kind).toBe("turn");

    act(() => {
      fakeSocket.trigger("join:error", { message: "no bee found" });
    });
    expect(result.current.state.phase).toEqual({ kind: "fatal", message: "no bee found" });
  });

  it("clears the verdict after the hold and re-hydrates to resolve the next participant", async () => {
    const { result } = renderHook(() => useDisplaySocket("BEE-TEST01"));
    await settle();
    expect(result.current.state.phase.kind).toBe("turn");

    act(() => {
      fakeSocket.trigger("response:submitted", {
        participantId: 1,
        participantName: "Alice",
        word: "apple",
        userSpelling: "apple",
        isCorrect: true,
      });
    });
    expect(result.current.state.phase).toMatchObject({ turnStage: "verdict" });

    getGamekeyState.mockResolvedValue({ ...baseState, currentParticipant: "Bob" });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(VERDICT_HOLD_MS);
    });

    expect(result.current.state.phase).toMatchObject({ turnStage: "awaiting", participantName: "Bob" });
  });

  it("holds the round-end screen for the full duration, buffering an early round:start", async () => {
    const { result } = renderHook(() => useDisplaySocket("BEE-TEST01"));
    await settle();
    expect(result.current.state.phase.kind).toBe("turn");

    act(() => {
      fakeSocket.trigger("round:end", { advancedParticipants: ["Alice"] });
    });
    expect(result.current.state.phase.kind).toBe("roundEnd");

    act(() => {
      fakeSocket.trigger("round:start", { roundNumber: 2, participantName: "Alice" });
    });
    expect(result.current.state.phase.kind).toBe("roundEnd");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(ROUND_END_HOLD_MS);
    });
    expect(result.current.state.phase).toMatchObject({ kind: "turn", roundNumber: 2, participantName: "Alice" });
  });

  it("escalates to connection lost after 30s of continuous disconnection", async () => {
    const { result } = renderHook(() => useDisplaySocket("BEE-TEST01"));
    await settle();
    expect(result.current.state.phase.kind).toBe("turn");

    act(() => {
      fakeSocket.trigger("disconnect");
    });
    expect(result.current.state.connection).toBe("reconnecting");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(RECONNECT_ESCALATION_MS);
    });
    expect(result.current.state.connection).toBe("lost");
  });
});
