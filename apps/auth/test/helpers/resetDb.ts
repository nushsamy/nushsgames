import type { PrismaClient } from "../../generated/prisma/client.ts";

export async function resetDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.user.deleteMany();
}
