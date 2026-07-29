import type { Participant } from "@/api/types";

export interface ServerToClientEvents {
  "client:connected": (payload: { gamekey: string; role: "host" | "display" }) => void;
  "join:error": (payload: { message: string }) => void;
  "round:start": (payload: { roundNumber: number; participantId?: number; participantName?: string }) => void;
  "typing:update": (payload: { currentSpelling: string }) => void;
  "participant:added": (payload: { participantId: number; name: string }) => void;
  "response:submitted": (payload: {
    participantId: number;
    participantName: string;
    word: string;
    userSpelling: string;
    isCorrect: boolean;
  }) => void;
  "participant:eliminated": (payload: { participantId: number; participantName: string }) => void;
  "round:end": (payload: { advancedParticipants: string[] }) => void;
  "bee:completed": (payload: { winner: { id: number; name: string } | null; finalStandings: Participant[] }) => void;
  "client:disconnected": (payload: { gamekey: string }) => void;
}

export interface ClientToServerEvents {
  join: (payload: { gamekey: string; token?: string }) => void;
  "typing:update": (payload: { currentSpelling: string }) => void;
}

export type ConnectionStatus = "connected" | "reconnecting" | "disconnected";
