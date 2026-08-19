import { api } from "@/api/httpClient";
import type { BeeDetail, CurrentTurn, NextRoundResult, SpellingBee } from "@/api/types";

export interface StartRoundResult {
  bee: SpellingBee;
  currentTurn: CurrentTurn;
}

export function createBee(title: string): Promise<SpellingBee> {
  return api.post<SpellingBee>("/bees", { title });
}

export function listBees(): Promise<SpellingBee[]> {
  return api.get<SpellingBee[]>("/bees");
}

export function getBee(beeId: number): Promise<BeeDetail> {
  return api.get<BeeDetail>(`/bees/${beeId}`);
}

export function updateBee(beeId: number, title: string): Promise<SpellingBee> {
  return api.patch<SpellingBee>(`/bees/${beeId}`, { title });
}

export function deleteBee(beeId: number): Promise<void> {
  return api.delete<void>(`/bees/${beeId}`);
}

export function startBee(beeId: number): Promise<SpellingBee> {
  return api.post<SpellingBee>(`/bees/${beeId}/start`);
}

export function endBee(beeId: number): Promise<SpellingBee> {
  return api.post<SpellingBee>(`/bees/${beeId}/end`);
}

export function reopenBee(beeId: number): Promise<SpellingBee> {
  return api.post<SpellingBee>(`/bees/${beeId}/reopen`);
}

export function nextRound(beeId: number): Promise<NextRoundResult> {
  return api.post<NextRoundResult>(`/bees/${beeId}/next-round`);
}

export function startRound(beeId: number): Promise<StartRoundResult> {
  return api.post<StartRoundResult>(`/bees/${beeId}/start-round`);
}
