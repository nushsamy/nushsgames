export type ConnectionState = "connecting" | "open" | "reconnecting" | "lost";

export interface WinnerInfo {
  id: number;
  name: string;
}

export interface Verdict {
  participantName: string;
  word: string;
  userSpelling: string;
  isCorrect: boolean;
}

export type TurnStage = "awaiting" | "typing" | "verdict";

export type Phase =
  | { kind: "loading" }
  | { kind: "fatal"; message: string }
  | {
      kind: "turn";
      roundNumber: number;
      totalRounds: number;
      participantName: string | null;
      nextParticipantName: string | null;
      turnStage: TurnStage;
      spelling: string;
      verdict: Verdict | null;
    }
  | { kind: "roundEnd"; roundNumber: number; advancedParticipants: string[] }
  | { kind: "winner"; winner: WinnerInfo }
  | { kind: "gameOverNoWinner" };

export interface DisplayState {
  connection: ConnectionState;
  phase: Phase;
}

export type DisplayAction =
  | { type: "hydrate:success"; status: "in_progress" | "completed"; roundNumber: number; totalRounds: number; currentParticipant: string | null; nextParticipant: string | null; winner: WinnerInfo | null }
  | { type: "hydrate:error"; message: string }
  | { type: "join:error"; message: string }
  | { type: "round:start"; roundNumber: number; totalRounds: number; participantName: string | null; nextParticipantName: string | null }
  | { type: "typing:update"; currentSpelling: string }
  | { type: "response:submitted"; verdict: Verdict }
  | { type: "verdict:cleared" }
  | { type: "round:end"; advancedParticipants: string[] }
  | { type: "bee:completed"; winner: WinnerInfo | null }
  | { type: "conn:connecting" }
  | { type: "conn:open" }
  | { type: "conn:reconnecting" }
  | { type: "conn:lost" };

export const INITIAL_DISPLAY_STATE: DisplayState = {
  connection: "connecting",
  phase: { kind: "loading" },
};
