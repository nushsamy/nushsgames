import { api } from "@/api/httpClient";
import type { Suspect } from "@/api/types";

export function listSuspects(eventId: number): Promise<Suspect[]> {
  return api.get<Suspect[]>(`/events/${eventId}/suspects`);
}

export function addSuspect(eventId: number, name: string, description?: string): Promise<Suspect> {
  return api.post<Suspect>(`/events/${eventId}/suspects`, { name, description });
}

export function updateSuspect(
  eventId: number,
  suspectId: number,
  updates: { name?: string; description?: string },
): Promise<Suspect> {
  return api.patch<Suspect>(`/events/${eventId}/suspects/${suspectId}`, updates);
}

export function deleteSuspect(eventId: number, suspectId: number): Promise<void> {
  return api.delete<void>(`/events/${eventId}/suspects/${suspectId}`);
}
