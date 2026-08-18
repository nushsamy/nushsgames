import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import * as eventsApi from "@/api/events";
import * as suspectsApi from "@/api/suspects";
import * as participantsApi from "@/api/participants";
import * as roundsApi from "@/api/rounds";
import { ApiError } from "@/api/httpClient";
import type { MysteryEvent, Suspect, Participant, Round } from "@/api/types";

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

export function useEventBuilder(eventId: number) {
  const [event, setEvent] = useState<MysteryEvent | null>(null);
  const [suspects, setSuspects] = useState<Suspect[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [ev, s, p, r] = await Promise.all([
        eventsApi.getEvent(eventId),
        suspectsApi.listSuspects(eventId),
        participantsApi.listParticipants(eventId),
        roundsApi.listRounds(eventId),
      ]);
      setEvent(ev);
      setSuspects(s);
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

  const addSuspect = useCallback(
    async (name: string, description?: string) => {
      try {
        const suspect = await suspectsApi.addSuspect(eventId, name, description);
        setSuspects((prev) => [...prev, suspect]);
      } catch (err) {
        toast.error(errorMessage(err, "Failed to add suspect"));
      }
    },
    [eventId],
  );

  const deleteSuspect = useCallback(
    async (suspectId: number) => {
      try {
        await suspectsApi.deleteSuspect(eventId, suspectId);
        setSuspects((prev) => prev.filter((s) => s.id !== suspectId));
      } catch (err) {
        toast.error(errorMessage(err, "Failed to delete suspect"));
      }
    },
    [eventId],
  );

  const addParticipant = useCallback(
    async (name: string, email: string) => {
      try {
        const participant = await participantsApi.addParticipant(eventId, name, email);
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

  const setRoundSuspects = useCallback(
    async (roundNumber: number, suspectIds: number[]) => {
      try {
        const round = await roundsApi.setRoundSuspects(eventId, roundNumber, suspectIds);
        setRounds((prev) => prev.map((r) => (r.roundNumber === roundNumber ? round : r)));
      } catch (err) {
        toast.error(errorMessage(err, "Failed to update round"));
      }
    },
    [eventId],
  );

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

  const canStart =
    !loading && suspects.length > 0 && participants.length > 0 && rounds.length > 0 &&
    rounds.every((r) => r.suspectIds.length > 0);

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
    suspects,
    participants,
    rounds,
    loading,
    canStart,
    refresh,
    addSuspect,
    deleteSuspect,
    addParticipant,
    deleteParticipant,
    addRound,
    setRoundSuspects,
    deleteRound,
    startEvent,
  };
}
