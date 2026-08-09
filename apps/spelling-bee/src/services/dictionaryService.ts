export interface WordDefinition {
  partOfSpeech: string;
  definition: string;
}

interface DictionaryApiMeaning {
  partOfSpeech: string;
  definitions: { definition: string }[];
}

interface DictionaryApiEntry {
  meanings: DictionaryApiMeaning[];
}

const cache = new Map<string, WordDefinition | null>();

/** Looks up a word's first dictionary definition via the free, keyless Dictionary API, caching results in-process. */
export async function getWordDefinition(word: string): Promise<WordDefinition | null> {
  const key = word.trim().toLowerCase();
  if (cache.has(key)) {
    return cache.get(key)!;
  }

  const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(key)}`);
  if (res.status === 404) {
    cache.set(key, null);
    return null;
  }
  if (!res.ok) {
    throw new Error(`Dictionary API returned ${res.status}`);
  }

  const entries = (await res.json()) as DictionaryApiEntry[];
  const meaning = entries[0]?.meanings[0];
  const definition = meaning?.definitions[0]?.definition;
  const result = definition ? { partOfSpeech: meaning.partOfSpeech, definition } : null;
  cache.set(key, result);
  return result;
}
