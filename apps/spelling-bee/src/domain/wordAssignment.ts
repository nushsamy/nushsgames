import { ValidationError } from "../errors/index.ts";

export function pickWordForTurn(assignedWords: string[], turnIndexInRound: number): string {
  if (assignedWords.length === 0) {
    throw new ValidationError("Cannot pick a word from an empty assigned-words list");
  }
  return assignedWords[turnIndexInRound % assignedWords.length];
}
