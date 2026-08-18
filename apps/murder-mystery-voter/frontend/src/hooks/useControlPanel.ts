import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import * as eventsApi from "@/api/events";
import * as participantsApi from "@/api/participants";
import * as roundsApi from "@/api/rounds";
import * as lifecycleApi from "@/api/roundLifecycle";
import { ApiError } from "@/api/httpClient";
import type { MysteryEvent, Participant, Round, RoundTally } from "@/api/types";

const POLL_INTERVAL_MS = 7000;

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

export function useControlPanel(eventId: number) {
  const [event, setEvent] = useState<MysteryEvent | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [tally, setTally] = useState<RoundTally | null>(null);
  const [loading, setLoading] = useState(true);

  const openRound = rounds.find((r) => r.status === "open") ?? null;

  const refresh = useCallback(async () => {
    const [ev, p, r] = await Promise.all([
      eventsApi.getEvent(eventId),
      participantsApi.listParticipants(eventId),
      roundsApi.listRounds(eventId),
    ]);
    setEvent(ev);
    setParticipants(p);
    setRounds(r);
    return r;
  }, [eventId]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await refresh();
    } catch (err) {
      toast.error(errorMessage(err, "Failed to load event"));
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  useEffect(() => {
    void load();
  }, [load]);

  const refreshTally = useCallback(async () => {
    if (!openRound) {
      setTally(null);
      return;
    }
    try {
      setTally(await lifecycleApi.getRoundTally(eventId, openRound.roundNumber));
    } catch {
      // Transient poll failures aren't worth interrupting the host with a toast.
    }
  }, [eventId, openRound]);

  const openRoundNumber = openRound?.roundNumber;
  useEffect(() => {
    void refreshTally();
    if (!openRoundNumber) return;
    const interval = setInterval(() => void refreshTally(), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [openRoundNumber, refreshTally]);

  const saveAttendance = useCallback(
    async (presentParticipantIds: number[]) => {
      try {
        const updated = await participantsApi.setAttendance(eventId, presentParticipantIds);
        setParticipants(updated);
        toast.success("Attendance saved");
      } catch (err) {
        toast.error(errorMessage(err, "Failed to save attendance"));
      }
    },
    [eventId],
  );

  const openRoundNumberAction = useCallback(
    async (roundNumber: number) => {
      try {
        const result = await lifecycleApi.openRound(eventId, roundNumber);
        await refresh();
        if (result.email.failed.length > 0) {
          toast.warning(`Round opened, but ${result.email.failed.length} email(s) failed to send`);
        } else {
          toast.success(`Round ${roundNumber} opened`);
        }
      } catch (err) {
        toast.error(errorMessage(err, "Failed to open round"));
      }
    },
    [eventId, refresh],
  );

  const closeRoundAction = useCallback(
    async (roundNumber: number) => {
      try {
        await lifecycleApi.closeRound(eventId, roundNumber);
        await refresh();
        toast.success(`Round ${roundNumber} closed`);
      } catch (err) {
        toast.error(errorMessage(err, "Failed to close round"));
      }
    },
    [eventId, refresh],
  );

  const resendBallot = useCallback(
    async (ballotId: string) => {
      try {
        const result = await lifecycleApi.resendBallot(eventId, ballotId);
        if (result.ok) toast.success("Email resent");
        else toast.error(result.error ?? "Failed to resend email");
        await refreshTally();
      } catch (err) {
        toast.error(errorMessage(err, "Failed to resend email"));
      }
    },
    [eventId, refreshTally],
  );

  const endEvent = useCallback(async (): Promise<boolean> => {
    try {
      const updated = await eventsApi.endEvent(eventId);
      setEvent(updated);
      return true;
    } catch (err) {
      toast.error(errorMessage(err, "Failed to end event"));
      return false;
    }
  }, [eventId]);

  const takingAttendance = event?.status === "in_progress" && event.currentRound === 0;

  return {
    event,
    participants,
    rounds,
    tally,
    openRound,
    loading,
    takingAttendance,
    refresh,
    saveAttendance,
    openRoundAction: openRoundNumberAction,
    closeRoundAction,
    resendBallot,
    endEvent,
  };
}

