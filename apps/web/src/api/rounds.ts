import { api } from "@/api/httpClient";
import type { BeeRound, SpellingBee } from "@/api/types";

export function listRounds(beeId: number): Promise<BeeRound[]> {
  return api.get<BeeRound[]>(`/bees/${beeId}/rounds`);
}

export function addRound(beeId: number): Promise<BeeRound> {
  return api.post<BeeRound>(`/bees/${beeId}/rounds`);
}

export function setRoundWords(beeId: number, roundNumber: number, words: string[]): Promise<BeeRound> {
  return api.put<BeeRound>(`/bees/${beeId}/rounds/${roundNumber}/words`, { words });
}

export function deleteRound(beeId: number, roundNumber: number): Promise<SpellingBee> {
  return api.delete<SpellingBee>(`/bees/${beeId}/rounds/${roundNumber}`);
}
