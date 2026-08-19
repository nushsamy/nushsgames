import { createApiClient, MYSTERY_API_URL } from "@/api/httpClient";

const api = createApiClient(MYSTERY_API_URL);
import type { Participant } from "@/mystery/api/types";

export interface ParticipantInput {
  name: string;
  email: string;
  characterName: string;
  description?: string;
}

export function listParticipants(eventId: number): Promise<Participant[]> {
  return api.get<Participant[]>(`/events/${eventId}/participants`);
}

export function addParticipant(eventId: number, input: ParticipantInput): Promise<Participant> {
  return api.post<Participant>(`/events/${eventId}/participants`, input);
}

export function updateParticipant(
  eventId: number,
  participantId: number,
  updates: Partial<ParticipantInput>,
): Promise<Participant> {
  return api.patch<Participant>(`/events/${eventId}/participants/${participantId}`, updates);
}

export function deleteParticipant(eventId: number, participantId: number): Promise<void> {
  return api.delete<void>(`/events/${eventId}/participants/${participantId}`);
}

export function setAttendance(eventId: number, presentParticipantIds: number[]): Promise<Participant[]> {
  return api.put<Participant[]>(`/events/${eventId}/attendance`, { presentParticipantIds });
}
