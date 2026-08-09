import type { Server as SocketIOServer } from "socket.io";
import { roomName } from "./rooms.ts";

export function emitToGamekey(io: SocketIOServer, gamekey: string, event: string, payload: unknown): void {
  io.to(roomName(gamekey)).emit(event, payload);
}

export function emitRoundStart(
  io: SocketIOServer,
  gamekey: string,
  payload: {
    roundNumber: number;
    participantId?: number;
    participantName?: string;
    nextParticipantId?: number;
    nextParticipantName?: string;
  },
): void {
  emitToGamekey(io, gamekey, "round:start", payload);
}

export function emitParticipantAdded(
  io: SocketIOServer,
  gamekey: string,
  payload: { participantId: number; name: string },
): void {
  emitToGamekey(io, gamekey, "participant:added", payload);
}

export function emitResponseSubmitted(
  io: SocketIOServer,
  gamekey: string,
  payload: {
    participantId: number;
    participantName: string;
    word: string;
    userSpelling: string;
    isCorrect: boolean;
  },
): void {
  emitToGamekey(io, gamekey, "response:submitted", payload);
}

export function emitParticipantEliminated(
  io: SocketIOServer,
  gamekey: string,
  payload: { participantId: number; participantName: string },
): void {
  emitToGamekey(io, gamekey, "participant:eliminated", payload);
}

export function emitRoundEnd(
  io: SocketIOServer,
  gamekey: string,
  payload: { advancedParticipants: string[] },
): void {
  emitToGamekey(io, gamekey, "round:end", payload);
}

export function emitBeeCompleted(
  io: SocketIOServer,
  gamekey: string,
  payload: {
    winner: { id: number; name: string } | null;
    finalStandings: Array<{
      id: number;
      name: string;
      isActive: boolean;
      isEliminated: boolean;
      eliminatedRound: number | null;
    }>;
  },
): void {
  emitToGamekey(io, gamekey, "bee:completed", payload);
}
