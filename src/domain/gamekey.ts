import { randomBytes } from "node:crypto";
import type { PrismaClient, Prisma } from "../../generated/prisma/client.ts";

// Unambiguous alphabet: no 0/O or 1/I, so a gamekey read aloud or typed by hand is unlikely to be misheard.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;
const MAX_GENERATION_ATTEMPTS = 5;

export function generateGamekey(): string {
  const bytes = randomBytes(CODE_LENGTH);
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return `BEE-${code}`;
}

export async function generateUniqueGamekey(
  tx: PrismaClient | Prisma.TransactionClient,
): Promise<string> {
  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    const candidate = generateGamekey();
    const existing = await tx.spellingBee.findUnique({ where: { gamekey: candidate } });
    if (!existing) {
      return candidate;
    }
  }
  throw new Error(`Failed to generate a unique gamekey after ${MAX_GENERATION_ATTEMPTS} attempts`);
}
