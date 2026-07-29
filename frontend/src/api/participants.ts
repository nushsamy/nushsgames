import { api } from "@/api/httpClient";
import type { Participant, ParticipantsList, SubmissionResult } from "@/api/types";

export function addParticipant(beeId: number, name: string): Promise<Participant> {
  return api.post<Participant>(`/bees/${beeId}/participants`, { name });
}

export function listParticipants(beeId: number): Promise<ParticipantsList> {
  return api.get<ParticipantsList>(`/bees/${beeId}/participants`);
}

export function submitResponse(beeId: number, participantId: number, userSpelling: string): Promise<SubmissionResult> {
  return api.post<SubmissionResult>(`/bees/${beeId}/responses`, { participantId, userSpelling });
}

export function skipParticipant(beeId: number, participantId: number): Promise<SubmissionResult> {
  return api.post<SubmissionResult>(`/bees/${beeId}/skip`, { participantId });
}

export function updateParticipant(
  participantId: number,
  updates: { isActive?: boolean; isEliminated?: boolean },
): Promise<Participant> {
  return api.patch<Participant>(`/participants/${participantId}`, updates);
}
