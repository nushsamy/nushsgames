import type { PrismaClient } from "../../generated/prisma/client.ts";

export async function resetDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.$transaction([
    prisma.ballot.deleteMany(),
    prisma.mysteryRound.deleteMany(),
    prisma.mysteryParticipant.deleteMany(),
    prisma.mysteryEvent.deleteMany(),
  ]);
}
