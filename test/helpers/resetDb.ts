import type { PrismaClient } from "../../generated/prisma/client.ts";

export async function resetDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.$transaction([
    prisma.beeRound.deleteMany(),
    prisma.participant.deleteMany(),
    prisma.spellingBee.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}
