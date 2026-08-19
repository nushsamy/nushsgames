import { createApiClient, MYSTERY_API_URL } from "@/api/httpClient";

const api = createApiClient(MYSTERY_API_URL);
import type { BallotView } from "@/mystery/api/types";

export function getBallotByToken(token: string): Promise<BallotView> {
  return api.get<BallotView>(`/vote/${token}`);
}

export function castVote(token: string, suspectId: number): Promise<{ ok: boolean }> {
  return api.post<{ ok: boolean }>(`/vote/${token}`, { suspectId });
}
