import { api } from "@/api/httpClient";
import type { GamekeyStateResponse } from "@/api/types";

export function getGamekeyState(gamekey: string): Promise<GamekeyStateResponse> {
  return api.get<GamekeyStateResponse>(`/gamekey/${gamekey}/state`);
}
