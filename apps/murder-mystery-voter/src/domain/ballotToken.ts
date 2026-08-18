import { randomBytes } from "node:crypto";
import type { PrismaClient, Prisma } from "../../generated/prisma/client.ts";

// base64url, 256 bits of entropy -- this is clicked from an email link, never typed by hand,
// so there's no need for a short or unambiguous alphabet like the spelling-bee gamekey uses.
const TOKEN_BYTES = 32;
const MAX_GENERATION_ATTEMPTS = 5;

export function generateBallotToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

export async function generateUniqueBallotToken(
  tx: PrismaClient | Prisma.TransactionClient,
): Promise<string> {
  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    const candidate = generateBallotToken();
    const existing = await tx.ballot.findUnique({ where: { token: candidate } });
    if (!existing) {
      return candidate;
    }
  }
  throw new Error(`Failed to generate a unique ballot token after ${MAX_GENERATION_ATTEMPTS} attempts`);
}
