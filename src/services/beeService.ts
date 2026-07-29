import type { PrismaClient, SpellingBee } from "../../generated/prisma/client.ts";
import { Prisma } from "../../generated/prisma/client.ts";
import { ValidationError, NotFoundError, InvalidBeeStateError } from "../errors/index.ts";
import { generateUniqueGamekey } from "../domain/gamekey.ts";

export interface CreateBeeInput {
  userId: number;
  title: string;
}

export async function createBee(
  prisma: PrismaClient,
  input: CreateBeeInput,
): Promise<SpellingBee> {
  if (!input.title.trim()) {
    throw new ValidationError("Bee title must not be empty");
  }

  return prisma.spellingBee.create({
    data: {
      userId: input.userId,
      title: input.title.trim(),
    },
  });
}

export async function getBeeById(
  prisma: PrismaClient | Prisma.TransactionClient,
  beeId: number,
): Promise<SpellingBee> {
  const bee = await prisma.spellingBee.findUnique({ where: { id: beeId } });
  if (!bee) {
    throw new NotFoundError(`Spelling bee ${beeId} not found`);
  }
  return bee;
}

export async function startBee(
  prisma: PrismaClient,
  beeId: number,
): Promise<SpellingBee> {
  return prisma.$transaction(async (tx) => {
    const bee = await getBeeById(tx, beeId);
    if (bee.status !== "created") {
      throw new InvalidBeeStateError(
        `Bee ${beeId} cannot be started from status "${bee.status}"`,
      );
    }

    const rounds = await tx.beeRound.findMany({ where: { beeId } });
    if (rounds.length === 0) {
      throw new ValidationError(`Bee ${beeId} has no rounds to start`);
    }
    const emptyRound = rounds.find((round) => (round.assignedWords as string[]).length === 0);
    if (emptyRound) {
      throw new ValidationError(`Round ${emptyRound.roundNumber} has no words assigned`);
    }

    const gamekey = await generateUniqueGamekey(tx);

    return tx.spellingBee.update({
      where: { id: beeId },
      data: { gamekey, status: "in_progress", currentRound: 1 },
    });
  });
}

export async function endBee(
  prisma: PrismaClient | Prisma.TransactionClient,
  beeId: number,
): Promise<SpellingBee> {
  const bee = await getBeeById(prisma, beeId);
  if (bee.status !== "in_progress") {
    throw new InvalidBeeStateError(`Bee ${beeId} cannot be ended from status "${bee.status}"`);
  }
  return prisma.spellingBee.update({
    where: { id: beeId },
    data: { status: "completed" },
  });
}

export async function reopenBee(
  prisma: PrismaClient,
  beeId: number,
): Promise<SpellingBee> {
  return prisma.$transaction(async (tx) => {
    const bee = await getBeeById(tx, beeId);
    if (bee.status !== "completed") {
      throw new InvalidBeeStateError(
        `Bee ${beeId} can only be reopened from "completed", not "${bee.status}"`,
      );
    }

    await tx.participant.deleteMany({ where: { beeId } });

    return tx.spellingBee.update({
      where: { id: beeId },
      data: { status: "created", gamekey: null, currentRound: 0, roundStarted: false },
    });
  });
}

export async function deleteBee(prisma: PrismaClient, beeId: number): Promise<void> {
  const bee = await getBeeById(prisma, beeId);
  if (bee.status !== "created") {
    throw new InvalidBeeStateError(
      `Bee ${beeId} can only be deleted while "created", not "${bee.status}"`,
    );
  }
  await prisma.spellingBee.delete({ where: { id: beeId } });
}

export async function getBeeByGamekey(
  prisma: PrismaClient | Prisma.TransactionClient,
  gamekey: string,
): Promise<SpellingBee> {
  const bee = await prisma.spellingBee.findUnique({ where: { gamekey } });
  if (!bee) {
    throw new NotFoundError(`No bee found for gamekey "${gamekey}"`);
  }
  return bee;
}

export interface UpdateBeeInput {
  title?: string;
}

export async function updateBee(
  prisma: PrismaClient,
  beeId: number,
  updates: UpdateBeeInput,
): Promise<SpellingBee> {
  const bee = await getBeeById(prisma, beeId);
  if (bee.status !== "created") {
    throw new InvalidBeeStateError(
      `Bee ${beeId} config can only be edited while "created", not "${bee.status}"`,
    );
  }

  const data: Prisma.SpellingBeeUpdateInput = {};
  if (updates.title !== undefined) {
    if (!updates.title.trim()) {
      throw new ValidationError("Bee title must not be empty");
    }
    data.title = updates.title.trim();
  }

  return prisma.spellingBee.update({ where: { id: beeId }, data });
}
