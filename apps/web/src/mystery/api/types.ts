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

/**
 * A participant is both the real person voting and a possible suspect other participants can
 * accuse -- characterName/description are the in-game persona; name/email are how the host and
 * the email system reach the real person.
 */
export interface Participant {
  id: number;
  eventId: number;
  name: string;
  email: string;
  characterName: string;
  description: string | null;
  isAttending: boolean;
}

export type RoundStatus = "pending" | "open" | "closed";

export interface Round {
  id: string;
  eventId: number;
  roundNumber: number;
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

/** Public ballot-facing view of a candidate -- deliberately excludes the participant's real name/email. */
export interface BallotSuspect {
  id: number;
  characterName: string;
  description: string | null;
}

export interface BallotView {
  participantName: string;
  eventTitle: string;
  roundNumber: number;
  suspects: BallotSuspect[];
}
