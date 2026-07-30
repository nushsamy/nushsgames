import { useEffect, useState } from "react";

export type WordDefinitionStatus = "idle" | "loading" | "success" | "not-found" | "error";

export interface WordDefinitionResult {
  status: WordDefinitionStatus;
  partOfSpeech: string | null;
  definition: string | null;
}

interface DictionaryApiMeaning {
  partOfSpeech: string;
  definitions: { definition: string }[];
}

interface DictionaryApiEntry {
  meanings: DictionaryApiMeaning[];
}

const IDLE: WordDefinitionResult = { status: "idle", partOfSpeech: null, definition: null };

const cache = new Map<string, WordDefinitionResult>();

/** Looks up a word's first dictionary definition via the free, keyless Dictionary API. Host-only, never synced to the display client. */
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

    fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(key)}`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        if (res.status === 404) {
          const notFound: WordDefinitionResult = { status: "not-found", partOfSpeech: null, definition: null };
          cache.set(key, notFound);
          setResult(notFound);
          return;
        }
        if (!res.ok) {
          throw new Error(`Dictionary API returned ${res.status}`);
        }
        const entries = (await res.json()) as DictionaryApiEntry[];
        const meaning = entries[0]?.meanings[0];
        const definition = meaning?.definitions[0]?.definition;
        const success: WordDefinitionResult = definition
          ? { status: "success", partOfSpeech: meaning.partOfSpeech, definition }
          : { status: "not-found", partOfSpeech: null, definition: null };
        cache.set(key, success);
        setResult(success);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setResult({ status: "error", partOfSpeech: null, definition: null });
      });

    return () => controller.abort();
  }, [word]);

  return result;
}
