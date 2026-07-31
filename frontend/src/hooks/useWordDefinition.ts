import { useEffect, useState } from "react";
import { getWordDefinition } from "@/api/dictionary";
import { ApiError } from "@/api/httpClient";

export type WordDefinitionStatus = "idle" | "loading" | "success" | "not-found" | "error";

export interface WordDefinitionResult {
  status: WordDefinitionStatus;
  partOfSpeech: string | null;
  definition: string | null;
}

const IDLE: WordDefinitionResult = { status: "idle", partOfSpeech: null, definition: null };

const cache = new Map<string, WordDefinitionResult>();

/** Looks up a word's first dictionary definition via the backend's dictionary proxy. Host-only, never synced to the display client. */
export function useWordDefinition(word: string | undefined): WordDefinitionResult {
  const [result, setResult] = useState<WordDefinitionResult>(IDLE);

  useEffect(() => {
    const key = word?.trim().toLowerCase();
    if (!key) {
      setResult(IDLE);
      return;
    }

    const cached = cache.get(key);
    if (cached) {
      setResult(cached);
      return;
    }

    const controller = new AbortController();
    setResult({ status: "loading", partOfSpeech: null, definition: null });

    getWordDefinition(key, controller.signal)
      .then((definition) => {
        const success: WordDefinitionResult = { status: "success", ...definition };
        cache.set(key, success);
        setResult(success);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (err instanceof ApiError && err.status === 404) {
          const notFound: WordDefinitionResult = { status: "not-found", partOfSpeech: null, definition: null };
          cache.set(key, notFound);
          setResult(notFound);
          return;
        }
        setResult({ status: "error", partOfSpeech: null, definition: null });
      });

    return () => controller.abort();
  }, [word]);

  return result;
}
