/** Splits pasted/typed word-list text on newlines or commas, trimming and dropping blanks. */
export function parseWordList(text: string): string[] {
  return text
    .split(/[\n,]/)
    .map((w) => w.trim())
    .filter((w) => w.length > 0);
}
