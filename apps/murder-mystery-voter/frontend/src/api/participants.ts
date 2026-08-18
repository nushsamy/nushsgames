import { api } from "@/api/httpClient";
import type { Participant } from "@/api/types";

export function listParticipants(eventId: number): Promise<Participant[]> {
  return api.get<Participant[]>(`/events/${eventId}/participants`);
}

export function addParticipant(eventId: number, name: string, email: string): Promise<Participant> {
  return api.post<Participant>(`/events/${eventId}/participants`, { name, email });
}

export function deleteParticipant(eventId: number, participantId: number): Promise<void> {
  return api.delete<void>(`/events/${eventId}/participants/${participantId}`);
}

export function setAttendance(eventId: number, presentParticipantIds: number[]): Promise<Participant[]> {
  return api.put<Participant[]>(`/events/${eventId}/attendance`, { presentParticipantIds });
}
