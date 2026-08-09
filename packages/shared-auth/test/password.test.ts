import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../src/utils/password.ts";

describe("hashPassword / verifyPassword", () => {
  it("round-trips: a hash verifies against its own plaintext", async () => {
    const hash = await hashPassword("correct horse battery staple");
    await expect(verifyPassword("correct horse battery staple", hash)).resolves.toBe(true);
  });

  it("rejects the wrong password", async () => {
    const hash = await hashPassword("correct horse battery staple");
    await expect(verifyPassword("wrong password", hash)).resolves.toBe(false);
  });

  it("produces a hash that differs from the plaintext", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(hash).not.toBe("correct horse battery staple");
  });
});
