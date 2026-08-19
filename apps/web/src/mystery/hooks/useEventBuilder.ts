import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import * as eventsApi from "@/mystery/api/events";
import * as participantsApi from "@/mystery/api/participants";
import * as roundsApi from "@/mystery/api/rounds";
import { ApiError } from "@/api/httpClient";
import type { MysteryEvent, Participant, Round } from "@/mystery/api/types";

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

export function useEventBuilder(eventId: number) {
  const [event, setEvent] = useState<MysteryEvent | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [ev, p, r] = await Promise.all([
        eventsApi.getEvent(eventId),
        participantsApi.listParticipants(eventId),
        roundsApi.listRounds(eventId),
      ]);
      setEvent(ev);
      setParticipants(p);
      setRounds(r);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to load event"));
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addParticipant = useCallback(
    async (input: participantsApi.ParticipantInput) => {
      try {
        const participant = await participantsApi.addParticipant(eventId, input);
        setParticipants((prev) => [...prev, participant]);
      } catch (err) {
        toast.error(errorMessage(err, "Failed to add participant"));
      }
    },
    [eventId],
  );

  const deleteParticipant = useCallback(
    async (participantId: number) => {
      try {
        await participantsApi.deleteParticipant(eventId, participantId);
        setParticipants((prev) => prev.filter((p) => p.id !== participantId));
      } catch (err) {
        toast.error(errorMessage(err, "Failed to remove participant"));
      }
    },
    [eventId],
  );

  const addRound = useCallback(async () => {
    try {
      const round = await roundsApi.addRound(eventId);
      setRounds((prev) => [...prev, round]);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to add round"));
    }
  }, [eventId]);

  const deleteRound = useCallback(
    async (roundNumber: number) => {
      try {
        await roundsApi.deleteRound(eventId, roundNumber);
        await refresh();
      } catch (err) {
        toast.error(errorMessage(err, "Failed to delete round"));
      }
    },
    [eventId, refresh],
  );

  const canStart = !loading && participants.length > 0 && rounds.length > 0;

  const startEvent = useCallback(async (): Promise<boolean> => {
    try {
      const updated = await eventsApi.startEvent(eventId);
      setEvent(updated);
      return true;
    } catch (err) {
      toast.error(errorMessage(err, "Failed to start event"));
      return false;
    }
  }, [eventId]);

  return {
    event,
    participants,
    rounds,
    loading,
    canStart,
    refresh,
    addParticipant,
    deleteParticipant,
    addRound,
    deleteRound,
    startEvent,
  };
}
