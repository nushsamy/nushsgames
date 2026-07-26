import type { PrismaClient, SpellingBee } from "../../generated/prisma/client.ts";
import { Prisma } from "../../generated/prisma/client.ts";
import { ValidationError, NotFoundError, InvalidBeeStateError } from "../errors/index.ts";
import { generateUniqueGamekey } from "../domain/gamekey.ts";

export interface CreateBeeInput {
  userId: number;
  title: string;
  totalRounds: number;
  /** One word list per round; roundWords[i] holds the words for round i + 1. No fixed word count per round. */
  roundWords: string[][];
}

export async function createBee(
  prisma: PrismaClient,
  input: CreateBeeInput,
): Promise<SpellingBee> {
  if (!input.title.trim()) {
    throw new ValidationError("Bee title must not be empty");
  }
  if (!Number.isInteger(input.totalRounds) || input.totalRounds <= 0) {
    throw new ValidationError("totalRounds must be a positive integer");
  }
  if (!Array.isArray(input.roundWords) || input.roundWords.length !== input.totalRounds) {
    throw new ValidationError(`roundWords must contain exactly ${input.totalRounds} round(s) of words`);
  }
  input.roundWords.forEach((words, index) => {
    if (!Array.isArray(words) || words.length === 0) {
      throw new ValidationError(`Round ${index + 1} must have at least one word`);
    }
  });

  return prisma.$transaction(async (tx) => {
    const bee = await tx.spellingBee.create({
      data: {
        userId: input.userId,
        title: input.title.trim(),
        totalRounds: input.totalRounds,
      },
    });

    await tx.beeRound.createMany({
      data: input.roundWords.map((assignedWords, index) => ({
        beeId: bee.id,
        roundNumber: index + 1,
        assignedWords,
      })),
    });

    return bee;
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
