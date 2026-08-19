import { createApiClient, MYSTERY_API_URL } from "@/api/httpClient";
import type { Round, MysteryEvent } from "@/mystery/api/types";

const api = createApiClient(MYSTERY_API_URL);

export function listRounds(eventId: number): Promise<Round[]> {
  return api.get<Round[]>(`/events/${eventId}/rounds`);
}

export function addRound(eventId: number): Promise<Round> {
  return api.post<Round>(`/events/${eventId}/rounds`);
}

export function deleteRound(eventId: number, roundNumber: number): Promise<MysteryEvent> {
  return api.delete<MysteryEvent>(`/events/${eventId}/rounds/${roundNumber}`);
}
