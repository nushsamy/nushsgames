import type { DisplayAction, DisplayState, Phase } from "@/state/displayTypes";

function turnPhase(input: {
  roundNumber: number;
  totalRounds: number;
  participantName: string | null;
}): Phase {
  return {
    kind: "turn",
    roundNumber: input.roundNumber,
    totalRounds: input.totalRounds,
    participantName: input.participantName,
    turnStage: "awaiting",
    spelling: "",
    verdict: null,
  };
}

export function displayReducer(state: DisplayState, action: DisplayAction): DisplayState {
  switch (action.type) {
    case "hydrate:success": {
      if (action.status === "completed") {
        return {
          ...state,
          phase: action.winner ? { kind: "winner", winner: action.winner } : { kind: "gameOverNoWinner" },
        };
      }
      return {
        ...state,
        phase: turnPhase({
          roundNumber: action.roundNumber,
          totalRounds: action.totalRounds,
          participantName: action.currentParticipant,
        }),
      };
    }

    case "hydrate:error":
    case "join:error":
      return { ...state, phase: { kind: "fatal", message: action.message } };

    case "round:start":
      return {
        ...state,
        phase: turnPhase({
          roundNumber: action.roundNumber,
          totalRounds: action.totalRounds,
          participantName: action.participantName,
        }),
      };

    case "typing:update": {
      if (state.phase.kind !== "turn") return state;
      return {
        ...state,
        phase: { ...state.phase, turnStage: "typing", spelling: action.currentSpelling },
      };
    }

    case "response:submitted": {
      if (state.phase.kind !== "turn") return state;
      return {
        ...state,
        phase: {
          ...state.phase,
          turnStage: "verdict",
          verdict: action.verdict,
          participantName: action.verdict.participantName,
        },
      };
    }

    case "verdict:cleared": {
      if (state.phase.kind !== "turn" || state.phase.turnStage !== "verdict") return state;
      return {
        ...state,
        phase: {
          ...state.phase,
          turnStage: "awaiting",
          spelling: "",
          verdict: null,
          participantName: null,
        },
      };
    }

    case "round:end": {
      const roundNumber = state.phase.kind === "turn" ? state.phase.roundNumber : 0;
      return {
        ...state,
        phase: { kind: "roundEnd", roundNumber, advancedParticipants: action.advancedParticipants },
      };
    }

    case "bee:completed":
      return {
        ...state,
        phase: action.winner ? { kind: "winner", winner: action.winner } : { kind: "gameOverNoWinner" },
      };

    case "conn:connecting":
      return { ...state, connection: "connecting" };
    case "conn:open":
      return { ...state, connection: "open" };
    case "conn:reconnecting":
      return { ...state, connection: "reconnecting" };
    case "conn:lost":
      return { ...state, connection: "lost" };

    default:
      return state;
  }
}
