import type { PrismaClient, Prisma, Participant, SpellingBee, BeeRound } from "../../generated/prisma/client.ts";
import { NotFoundError, InvalidBeeStateError, RoundNotCompleteError, ValidationError } from "../errors/index.ts";
import { pickWordForTurn } from "../domain/wordAssignment.ts";
import { getBeeById, endBee } from "./beeService.ts";

export async function addRound(
  prisma: PrismaClient,
  beeId: number,
): Promise<BeeRound> {
  return prisma.$transaction(async (tx) => {
    const bee = await getBeeById(tx, beeId);
    if (bee.status !== "created") {
      throw new InvalidBeeStateError(`Rounds can only be added while bee ${beeId} is "created"`);
    }

    const roundNumber = bee.totalRounds + 1;
    const round = await tx.beeRound.create({
      data: { beeId, roundNumber, assignedWords: [] },
    });
    await tx.spellingBee.update({ where: { id: beeId }, data: { totalRounds: roundNumber } });
    return round;
  });
}

export async function setRoundWords(
  prisma: PrismaClient,
  beeId: number,
  roundNumber: number,
  words: string[],
): Promise<BeeRound> {
  if (!Array.isArray(words) || words.length === 0 || words.some((word) => !word.trim())) {
    throw new ValidationError("words must be a non-empty array of non-empty strings");
  }

  const bee = await getBeeById(prisma, beeId);
  if (bee.status !== "created") {
    throw new InvalidBeeStateError(`Round words can only be edited while bee ${beeId} is "created"`);
  }

  const round = await prisma.beeRound.findUnique({
    where: { beeId_roundNumber: { beeId, roundNumber } },
  });
  if (!round) {
    throw new NotFoundError(`Round ${roundNumber} for bee ${beeId} not found`);
  }

  return prisma.beeRound.update({
    where: { id: round.id },
    data: { assignedWords: words },
  });
}

export interface NextTurn {
  participant: Participant;
  word: string;
  turnIndexInRound: number;
}

export function requireInProgress(bee: SpellingBee): void {
  if (bee.status !== "in_progress") {
    throw new InvalidBeeStateError(`Bee ${bee.id} has no active round while "${bee.status}"`);
  }
}

export async function getCurrentRoundWords(
  prisma: PrismaClient | Prisma.TransactionClient,
  beeId: number,
): Promise<string[]> {
  const bee = await getBeeById(prisma, beeId);
  requireInProgress(bee);

  const round = await prisma.beeRound.findUnique({
    where: { beeId_roundNumber: { beeId, roundNumber: bee.currentRound } },
  });
  if (!round) {
    throw new NotFoundError(`Round ${bee.currentRound} for bee ${beeId} not found`);
  }
  return round.assignedWords as string[];
}

export async function getNextTurn(
  prisma: PrismaClient | Prisma.TransactionClient,
  beeId: number,
): Promise<NextTurn | null> {
  const bee = await getBeeById(prisma, beeId);
  requireInProgress(bee);

  const [nextParticipant, assignedWords] = await Promise.all([
    prisma.participant.findFirst({
      where: { beeId, isActive: true, isEliminated: false },
      orderBy: { id: "asc" },
    }),
    getCurrentRoundWords(prisma, beeId),
  ]);

  if (!nextParticipant) {
    return null;
  }

  // No per-turn records are persisted, so the word-cycling position is derived from the
  // participant's stable creation-order rank within the bee rather than a live turn counter.
  const turnIndexInRound = await prisma.participant.count({
    where: { beeId, id: { lt: nextParticipant.id } },
  });

  return {
    participant: nextParticipant,
    word: pickWordForTurn(assignedWords, turnIndexInRound),
    turnIndexInRound,
  };
}

export async function isRoundComplete(
  prisma: PrismaClient | Prisma.TransactionClient,
  beeId: number,
): Promise<boolean> {
  return (await getNextTurn(prisma, beeId)) === null;
}

export async function completeRoundAndProgress(
  prisma: PrismaClient,
  beeId: number,
): Promise<{ bee: SpellingBee; ended: boolean }> {
  return prisma.$transaction(async (tx) => {
    const bee = await getBeeById(tx, beeId);
    requireInProgress(bee);

    if (!(await isRoundComplete(tx, beeId))) {
      throw new RoundNotCompleteError(
        `Round ${bee.currentRound} for bee ${beeId} still has participants left to spell`,
      );
    }

    const activeCount = await tx.participant.count({ where: { beeId, isEliminated: false } });
    const shouldEnd = activeCount <= 1 || bee.currentRound >= bee.totalRounds;

    if (shouldEnd) {
      const ended = await endBee(tx, beeId);
      return { bee: ended, ended: true };
    }

    await tx.participant.updateMany({
      where: { beeId, isEliminated: false },
      data: { isActive: true },
    });

    const advanced = await tx.spellingBee.update({
      where: { id: beeId },
      data: { currentRound: bee.currentRound + 1 },
    });
    return { bee: advanced, ended: false };
  });
}
