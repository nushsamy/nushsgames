import { describe, it, expect } from "vitest";
import { generateGamekey } from "../../src/domain/gamekey.ts";
import { pickWordForTurn } from "../../src/domain/wordAssignment.ts";
import { normalizeSpelling, isSpelledCorrectly } from "../../src/domain/spelling.ts";
import { ValidationError } from "../../src/errors/index.ts";

describe("generateGamekey", () => {
  it("produces a BEE-XXXXXX code using only unambiguous characters", () => {
    for (let i = 0; i < 50; i++) {
      const key = generateGamekey();
      expect(key).toMatch(/^BEE-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
    }
  });

  it("is not trivially predictable across repeated calls", () => {
    const keys = new Set(Array.from({ length: 100 }, () => generateGamekey()));
    expect(keys.size).toBeGreaterThan(90);
  });
});

describe("pickWordForTurn", () => {
  it("returns the word at the given index", () => {
    expect(pickWordForTurn(["a", "b", "c"], 1)).toBe("b");
  });

  it("cycles via modulo when the index exceeds the list length", () => {
    expect(pickWordForTurn(["a", "b", "c"], 3)).toBe("a");
    expect(pickWordForTurn(["a", "b", "c"], 4)).toBe("b");
  });

  it("throws ValidationError for an empty word list", () => {
    expect(() => pickWordForTurn([], 0)).toThrow(ValidationError);
  });
});

describe("normalizeSpelling / isSpelledCorrectly", () => {
  it("normalizes case and surrounding whitespace", () => {
    expect(normalizeSpelling("  Café  ")).toBe("café");
  });

  it("is case-insensitive", () => {
    expect(isSpelledCorrectly("Necessary", "necessary")).toBe(true);
    expect(isSpelledCorrectly("necessary", "NECESSARY")).toBe(true);
  });

  it("rejects incorrect spellings", () => {
    expect(isSpelledCorrectly("necessary", "neccessary")).toBe(false);
  });

  it("tolerates surrounding whitespace but not internal differences", () => {
    expect(isSpelledCorrectly("bee", "  bee  ")).toBe(true);
    expect(isSpelledCorrectly("bee", "b e e")).toBe(false);
  });
});
