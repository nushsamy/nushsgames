import { api } from "@/api/httpClient";
import type { Round, MysteryEvent } from "@/api/types";

export function listRounds(eventId: number): Promise<Round[]> {
  return api.get<Round[]>(`/events/${eventId}/rounds`);
}

export function addRound(eventId: number): Promise<Round> {
  return api.post<Round>(`/events/${eventId}/rounds`);
}

export function setRoundSuspects(eventId: number, roundNumber: number, suspectIds: number[]): Promise<Round> {
  return api.put<Round>(`/events/${eventId}/rounds/${roundNumber}/suspects`, { suspectIds });
}

export function deleteRound(eventId: number, roundNumber: number): Promise<MysteryEvent> {
  return api.delete<MysteryEvent>(`/events/${eventId}/rounds/${roundNumber}`);
}
