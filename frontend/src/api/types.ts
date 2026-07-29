export interface User {
  id: number;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export type BeeStatus = "created" | "in_progress" | "completed";

export interface SpellingBee {
  id: number;
  userId: number;
  title: string;
  totalRounds: number;
  gamekey: string | null;
  status: BeeStatus;
  currentRound: number;
  roundStarted: boolean;
  createdAt: string;
}

export interface BeeRound {
  id: string;
  beeId: number;
  roundNumber: number;
  assignedWords: string[];
}

export interface Participant {
  id: number;
  beeId: number;
  name: string;
  isActive: boolean;
  isEliminated: boolean;
  eliminatedRound: number | null;
}

export interface CurrentTurn {
  participant: Participant;
  word: string;
  turnIndexInRound: number;
}

export interface BeeDetail {
  bee: SpellingBee;
  currentTurn: CurrentTurn | null;
}

export interface ParticipantsList {
  active: Participant[];
  eliminated: Participant[];
}

export interface SubmissionResult {
  participant: Participant;
  word: string;
  userSpelling: string;
  spelledCorrectly: boolean;
}

export interface NextRoundResult {
  bee: SpellingBee;
  ended: boolean;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}

export interface StandingsParticipant {
  id: number;
  name: string;
  isActive: boolean;
  isEliminated: boolean;
  eliminatedRound: number | null;
}

export interface Standings {
  active: StandingsParticipant[];
  eliminated: StandingsParticipant[];
  winner: StandingsParticipant | null;
}

export interface GamekeyStateResponse {
  gamekey: string;
  status: BeeStatus;
  currentRound: number;
  totalRounds: number;
  currentParticipant: string | null;
  participants: ParticipantsList;
  standings: Standings | null;
}
