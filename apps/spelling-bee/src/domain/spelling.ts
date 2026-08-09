export function normalizeSpelling(s: string): string {
  return s.trim().toLowerCase();
}

export function isSpelledCorrectly(word: string, userSpelling: string): boolean {
  return normalizeSpelling(word) === normalizeSpelling(userSpelling);
}
