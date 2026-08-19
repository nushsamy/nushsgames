import { createApiClient, MYSTERY_API_URL } from "@/api/httpClient";

const api = createApiClient(MYSTERY_API_URL);
import type { OpenRoundResult, Round, RoundTally } from "@/mystery/api/types";

export function openRound(eventId: number, roundNumber: number): Promise<OpenRoundResult> {
  return api.post<OpenRoundResult>(`/events/${eventId}/rounds/${roundNumber}/open`);
}

export function closeRound(eventId: number, roundNumber: number): Promise<Round> {
  return api.post<Round>(`/events/${eventId}/rounds/${roundNumber}/close`);
}

export function getRoundTally(eventId: number, roundNumber: number): Promise<RoundTally> {
  return api.get<RoundTally>(`/events/${eventId}/rounds/${roundNumber}/tally`);
}

export function resendBallot(eventId: number, ballotId: string): Promise<{ ok: boolean; error: string | null }> {
  return api.post(`/events/${eventId}/ballots/${ballotId}/resend`);
}
