import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import * as beesApi from "@/api/bees";
import * as roundsApi from "@/api/rounds";
import { ApiError } from "@/api/httpClient";
import type { BeeRound, SpellingBee } from "@/api/types";

export function useRoundBuilder(beeId: number) {
  const [bee, setBee] = useState<SpellingBee | null>(null);
  const [rounds, setRounds] = useState<BeeRound[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [detail, roundsList] = await Promise.all([beesApi.getBee(beeId), roundsApi.listRounds(beeId)]);
      setBee(detail.bee);
      setRounds(roundsList);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setNotFound(true);
      } else {
        toast.error(err instanceof ApiError ? err.message : "Failed to load bee");
      }
    } finally {
      setLoading(false);
    }
  }, [beeId]);

  useEffect(() => {
    void load();
  }, [load]);

  const addRound = useCallback(async () => {
    try {
      const round = await roundsApi.addRound(beeId);
      setRounds((prev) => [...prev, round]);
      setBee((prev) => (prev ? { ...prev, totalRounds: prev.totalRounds + 1 } : prev));
      toast.success(`Round ${round.roundNumber} added`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to add round");
    }
  }, [beeId]);

  const saveRoundWords = useCallback(
    async (roundNumber: number, words: string[]) => {
      try {
        const round = await roundsApi.setRoundWords(beeId, roundNumber, words);
        setRounds((prev) => prev.map((r) => (r.roundNumber === roundNumber ? round : r)));
        toast.success(`Round ${roundNumber} words saved`);
        return true;
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Failed to save words");
        return false;
      }
    },
    [beeId],
  );

  const removeRound = useCallback(
    async (roundNumber: number) => {
      try {
        const updatedBee = await roundsApi.deleteRound(beeId, roundNumber);
        setBee(updatedBee);
        await load();
        toast.success(`Round ${roundNumber} deleted`);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Failed to delete round");
      }
    },
    [beeId, load],
  );

  const start = useCallback(async () => {
    try {
      const updated = await beesApi.startBee(beeId);
      setBee(updated);
      return updated;
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to start bee");
      return null;
    }
  }, [beeId]);

  const removeBee = useCallback(async () => {
    try {
      await beesApi.deleteBee(beeId);
      return true;
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete bee");
      return false;
    }
  }, [beeId]);

  const canStart = rounds.length > 0 && rounds.every((r) => r.assignedWords.length > 0);

  return {
    bee,
    rounds,
    loading,
    notFound,
    canStart,
    addRound,
    saveRoundWords,
    removeRound,
    start,
    removeBee,
  };
}
