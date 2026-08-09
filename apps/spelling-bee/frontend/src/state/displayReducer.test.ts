import { describe, expect, it } from "vitest";
import { displayReducer } from "@/state/displayReducer";
import { INITIAL_DISPLAY_STATE, type DisplayState } from "@/state/displayTypes";

const inTurn: DisplayState = {
  connection: "open",
  phase: {
    kind: "turn",
    roundNumber: 1,
    totalRounds: 3,
    participantName: "Alice",
    nextParticipantName: "Bob",
    turnStage: "awaiting",
    spelling: "",
    verdict: null,
  },
};

describe("displayReducer", () => {
  it("hydrate:success with status in_progress enters turn phase awaiting the given participant", () => {
    const result = displayReducer(INITIAL_DISPLAY_STATE, {
      type: "hydrate:success",
      status: "in_progress",
      roundNumber: 2,
      totalRounds: 4,
      currentParticipant: "Bob",
      nextParticipant: "Zoe",
      winner: null,
    });
    expect(result.phase).toEqual({
      kind: "turn",
      roundNumber: 2,
      totalRounds: 4,
      participantName: "Bob",
      nextParticipantName: "Zoe",
      turnStage: "awaiting",
      spelling: "",
      verdict: null,
    });
  });

  it("hydrate:success with status in_progress and no resolved participant shows null (unresolved)", () => {
    const result = displayReducer(INITIAL_DISPLAY_STATE, {
      type: "hydrate:success",
      status: "in_progress",
      roundNumber: 1,
      totalRounds: 1,
      currentParticipant: null,
      nextParticipant: null,
      winner: null,
    });
    expect(result.phase.kind).toBe("turn");
    if (result.phase.kind === "turn") {
      expect(result.phase.participantName).toBeNull();
    }
  });

  it("hydrate:success with status completed and a winner enters winner phase", () => {
    const winner = { id: 1, name: "Alice" };
    const result = displayReducer(INITIAL_DISPLAY_STATE, {
      type: "hydrate:success",
      status: "completed",
      roundNumber: 3,
      totalRounds: 3,
      currentParticipant: null,
      nextParticipant: null,
      winner,
    });
    expect(result.phase).toEqual({ kind: "winner", winner });
  });

  it("hydrate:success with status completed and no winner enters gameOverNoWinner", () => {
    const result = displayReducer(INITIAL_DISPLAY_STATE, {
      type: "hydrate:success",
      status: "completed",
      roundNumber: 3,
      totalRounds: 3,
      currentParticipant: null,
      nextParticipant: null,
      winner: null,
    });
    expect(result.phase).toEqual({ kind: "gameOverNoWinner" });
  });

  it("hydrate:error and join:error move to fatal", () => {
    expect(displayReducer(INITIAL_DISPLAY_STATE, { type: "hydrate:error", message: "nope" }).phase).toEqual({
      kind: "fatal",
      message: "nope",
    });
    expect(displayReducer(INITIAL_DISPLAY_STATE, { type: "join:error", message: "bad gamekey" }).phase).toEqual({
      kind: "fatal",
      message: "bad gamekey",
    });
  });

  it("round:start resets to a fresh turn, with participantName defaulting to null when absent", () => {
    const result = displayReducer(inTurn, {
      type: "round:start",
      roundNumber: 2,
      totalRounds: 3,
      participantName: null,
      nextParticipantName: null,
    });
    expect(result.phase).toEqual({
      kind: "turn",
      roundNumber: 2,
      totalRounds: 3,
      participantName: null,
      nextParticipantName: null,
      turnStage: "awaiting",
      spelling: "",
      verdict: null,
    });
  });

  it("typing:update only applies while in a turn phase", () => {
    const result = displayReducer(inTurn, { type: "typing:update", currentSpelling: "ap" });
    expect(result.phase).toMatchObject({ turnStage: "typing", spelling: "ap" });

    const notInTurn: DisplayState = { connection: "open", phase: { kind: "loading" } };
    expect(displayReducer(notInTurn, { type: "typing:update", currentSpelling: "ap" })).toBe(notInTurn);
  });

  it("response:submitted sets the verdict and self-heals an unresolved participant name", () => {
    const unresolved: DisplayState = {
      connection: "open",
      phase: { ...inTurn.phase, participantName: null } as DisplayState["phase"],
    };
    const verdict = { participantName: "Carol", word: "apple", userSpelling: "aple", isCorrect: false };
    const result = displayReducer(unresolved, { type: "response:submitted", verdict });
    expect(result.phase).toMatchObject({ turnStage: "verdict", verdict, participantName: "Carol" });
  });

  it("verdict:cleared resets the turn back to awaiting with an unresolved participant, only from verdict stage", () => {
    const inVerdict: DisplayState = {
      connection: "open",
      phase: {
        ...inTurn.phase,
        turnStage: "verdict",
        verdict: { participantName: "Alice", word: "apple", userSpelling: "apple", isCorrect: true },
      } as DisplayState["phase"],
    };
    const result = displayReducer(inVerdict, { type: "verdict:cleared" });
    expect(result.phase).toMatchObject({
      turnStage: "awaiting",
      spelling: "",
      verdict: null,
      participantName: null,
      nextParticipantName: null,
    });

    // No-op when not in the verdict stage.
    expect(displayReducer(inTurn, { type: "verdict:cleared" })).toBe(inTurn);
  });

  it("round:end carries the round number forward from the last turn phase", () => {
    const result = displayReducer(inTurn, { type: "round:end", advancedParticipants: ["Alice", "Bob"] });
    expect(result.phase).toEqual({ kind: "roundEnd", roundNumber: 1, advancedParticipants: ["Alice", "Bob"] });
  });

  it("bee:completed enters winner or gameOverNoWinner", () => {
    const winner = { id: 2, name: "Bob" };
    expect(displayReducer(inTurn, { type: "bee:completed", winner }).phase).toEqual({ kind: "winner", winner });
    expect(displayReducer(inTurn, { type: "bee:completed", winner: null }).phase).toEqual({
      kind: "gameOverNoWinner",
    });
  });

  it("connection actions update connection without touching phase", () => {
    for (const type of ["conn:connecting", "conn:open", "conn:reconnecting", "conn:lost"] as const) {
      const result = displayReducer(inTurn, { type });
      expect(result.phase).toBe(inTurn.phase);
    }
    expect(displayReducer(inTurn, { type: "conn:lost" }).connection).toBe("lost");
  });
});
