import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import * as beesApi from "@/api/bees";
import { ApiError } from "@/api/httpClient";
import type { SpellingBee } from "@/api/types";

export function useBeesList() {
  const [bees, setBees] = useState<SpellingBee[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setBees(await beesApi.listBees());
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load bees");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const removeBee = useCallback(async (beeId: number) => {
    try {
      await beesApi.deleteBee(beeId);
      setBees((prev) => prev.filter((b) => b.id !== beeId));
      toast.success("Bee deleted");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete bee");
    }
  }, []);

  const reopenBee = useCallback(async (beeId: number): Promise<boolean> => {
    try {
      const updated = await beesApi.reopenBee(beeId);
      setBees((prev) => prev.map((b) => (b.id === beeId ? updated : b)));
      return true;
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to reopen bee");
      return false;
    }
  }, []);

  return { bees, loading, refresh: load, removeBee, reopenBee };
}
