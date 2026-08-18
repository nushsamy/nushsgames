import { api } from "@/api/httpClient";
import type { BallotView } from "@/api/types";

export function getBallotByToken(token: string): Promise<BallotView> {
  return api.get<BallotView>(`/vote/${token}`);
}

export function castVote(token: string, suspectId: number): Promise<{ ok: boolean }> {
  return api.post<{ ok: boolean }>(`/vote/${token}`, { suspectId });
}
