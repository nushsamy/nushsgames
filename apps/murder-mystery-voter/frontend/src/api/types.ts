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

export type EventStatus = "created" | "in_progress" | "completed";

export interface MysteryEvent {
  id: number;
  userId: number;
  title: string;
  status: EventStatus;
  totalRounds: number;
  currentRound: number;
  createdAt: string;
}

export interface Suspect {
  id: number;
  eventId: number;
  name: string;
  description: string | null;
}

export interface Participant {
  id: number;
  eventId: number;
  name: string;
  email: string;
  isAttending: boolean;
}

export type RoundStatus = "pending" | "open" | "closed";

export interface Round {
  id: string;
  eventId: number;
  roundNumber: number;
  suspectIds: number[];
  status: RoundStatus;
}

export type BallotStatus = "pending" | "cast" | "expired";

export interface SuspectTally {
  suspectId: number;
  name: string;
  count: number;
  percentage: number;
}

export interface ParticipantBallotStatus {
  ballotId: string;
  participantId: number;
  name: string;
  email: string;
  ballotStatus: BallotStatus;
}

export interface RoundTally {
  totalBallots: number;
  castCount: number;
  pendingCount: number;
  expiredCount: number;
  tally: SuspectTally[];
  participants: ParticipantBallotStatus[];
}

export interface OpenRoundResult {
  round: Round;
  email: { sent: number; failed: { participantId: number; error: string }[] };
}

export interface BallotView {
  participantName: string;
  eventTitle: string;
  roundNumber: number;
  suspects: Suspect[];
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}
