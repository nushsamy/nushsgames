import { create } from "zustand";
import type { CurrentTurn, Participant, ParticipantsList, SpellingBee } from "@/api/types";
import * as beesApi from "@/api/bees";
import * as participantsApi from "@/api/participants";
import { ApiError } from "@/api/httpClient";

interface Winner {
  id: number;
  name: string;
}

interface ControlPanelState {
  beeId: number | null;
  bee: SpellingBee | null;
  currentTurn: CurrentTurn | null;
  participants: ParticipantsList;
  submitting: boolean;
  loading: boolean;
  notFound: boolean;
  winner: Winner | null;
  finalStandings: Participant[] | null;
  lastVerdict: { participantName: string; word: string; userSpelling: string; isCorrect: boolean } | null;

  loadInitial: (beeId: number) => Promise<void>;
  refresh: () => Promise<void>;
  submitResponse: (userSpelling: string) => Promise<void>;
  skip: (participantId: number) => Promise<void>;
  addParticipant: (name: string) => Promise<{ ok: boolean; error?: string }>;
  startRound: () => Promise<{ ok: boolean; error?: string }>;
  goToNextRound: () => Promise<{ ended: boolean }>;
  endBee: () => Promise<void>;
  applyBeeCompleted: (payload: { winner: Winner | null; finalStandings: Participant[] }) => void;
}

const emptyParticipants: ParticipantsList = { active: [], eliminated: [] };

export const useControlPanelStore = create<ControlPanelState>((set, get) => ({
  beeId: null,
  bee: null,
  currentTurn: null,
  participants: emptyParticipants,
  submitting: false,
  loading: false,
  notFound: false,
  winner: null,
  finalStandings: null,
  lastVerdict: null,

  loadInitial: async (beeId) => {
    set({ beeId, loading: true, notFound: false });
    try {
      await get().refresh();
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        set({ notFound: true });
      } else {
        throw err;
      }
    } finally {
      set({ loading: false });
    }
  },

  refresh: async () => {
    const { beeId } = get();
    if (beeId === null) return;
    const [detail, participants] = await Promise.all([
      beesApi.getBee(beeId),
      participantsApi.listParticipants(beeId),
    ]);
    set({ bee: detail.bee, currentTurn: detail.currentTurn, participants });
  },

  submitResponse: async (userSpelling) => {
    const { beeId, currentTurn } = get();
    if (beeId === null || !currentTurn) return;
    set({ submitting: true });
    try {
      const result = await participantsApi.submitResponse(beeId, currentTurn.participant.id, userSpelling);
      set({
        lastVerdict: {
          participantName: result.participant.name,
          word: result.word,
          userSpelling: result.userSpelling,
          isCorrect: result.spelledCorrectly,
        },
      });
      await get().refresh();
    } finally {
      set({ submitting: false });
    }
  },

  skip: async (participantId) => {
    const { beeId } = get();
    if (beeId === null) return;
    set({ submitting: true });
    try {
      const result = await participantsApi.skipParticipant(beeId, participantId);
      set({
        lastVerdict: {
          participantName: result.participant.name,
          word: result.word,
          userSpelling: result.userSpelling,
          isCorrect: result.spelledCorrectly,
        },
      });
      await get().refresh();
    } finally {
      set({ submitting: false });
    }
  },

  addParticipant: async (name) => {
    const { beeId } = get();
    if (beeId === null) return { ok: false, error: "No bee loaded" };
    try {
      await participantsApi.addParticipant(beeId, name);
      await get().refresh();
      return { ok: true };
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to add participant";
      return { ok: false, error: message };
    }
  },

  startRound: async () => {
    const { beeId } = get();
    if (beeId === null) return { ok: false, error: "No bee loaded" };
    try {
      const result = await beesApi.startRound(beeId);
      set({ bee: result.bee, currentTurn: result.currentTurn });
      return { ok: true };
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to start round";
      return { ok: false, error: message };
    }
  },

  goToNextRound: async () => {
    const { beeId } = get();
    if (beeId === null) return { ended: false };
    const result = await beesApi.nextRound(beeId);
    set({ bee: result.bee });
    await get().refresh();
    return { ended: result.ended };
  },

  endBee: async () => {
    const { beeId } = get();
    if (beeId === null) return;
    const bee = await beesApi.endBee(beeId);
    set({ bee });
    await get().refresh();
  },

  applyBeeCompleted: ({ winner, finalStandings }) => {
    set((state) => ({
      winner,
      finalStandings,
      bee: state.bee ? { ...state.bee, status: "completed" } : state.bee,
    }));
  },
}));
