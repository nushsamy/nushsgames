import { api } from "@/api/httpClient";

export interface WordDefinition {
  partOfSpeech: string;
  definition: string;
}

export function getWordDefinition(word: string, signal?: AbortSignal): Promise<WordDefinition> {
  return api.get<WordDefinition>(`/dictionary/${encodeURIComponent(word)}`, { signal });
}
