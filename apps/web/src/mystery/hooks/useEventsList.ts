import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import * as eventsApi from "@/mystery/api/events";
import { ApiError } from "@/api/httpClient";
import type { MysteryEvent } from "@/mystery/api/types";

export function useEventsList() {
  const [events, setEvents] = useState<MysteryEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setEvents(await eventsApi.listEvents());
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const removeEvent = useCallback(async (eventId: number) => {
    try {
      await eventsApi.deleteEvent(eventId);
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      toast.success("Event deleted");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete event");
    }
  }, []);

  return { events, loading, refresh: load, removeEvent };
}
