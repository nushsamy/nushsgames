import { randomUUID } from "node:crypto";
import type { PrismaClient, SpellingBee, Participant } from "../../generated/prisma/client.ts";
import { createBee, startBee, type CreateBeeInput } from "../../src/services/beeService.ts";
import { addParticipant } from "../../src/services/participantService.ts";
import { getNextTurn } from "../../src/services/roundService.ts";
import { submitResponse, skipParticipant } from "../../src/services/responseService.ts";

export const DEFAULT_ROUND_WORDS: string[][] = [
  ["apple", "banana"],
  ["cherry", "date"],
];

export async function createTestUser(prisma: PrismaClient) {
  return prisma.user.create({
    data: {
      email: `${randomUUID()}@test.dev`,
      passwordHash: "test-hash",
    },
  });
}

export async function buildBee(
  prisma: PrismaClient,
  overrides: Partial<Omit<CreateBeeInput, "userId">> = {},
): Promise<SpellingBee> {
  const user = await createTestUser(prisma);
  return createBee(prisma, {
    userId: user.id,
    title: "Test Bee",
    totalRounds: DEFAULT_ROUND_WORDS.length,
    roundWords: DEFAULT_ROUND_WORDS,
    ...overrides,
  });
}

export async function buildStartedBee(
  prisma: PrismaClient,
  overrides: Partial<Omit<CreateBeeInput, "userId">> = {},
): Promise<SpellingBee> {
  const bee = await buildBee(prisma, overrides);
  return startBee(prisma, bee.id);
}

export async function buildParticipants(
  prisma: PrismaClient,
  beeId: number,
  count: number,
  namePrefix = "Participant",
): Promise<Participant[]> {
  const participants: Participant[] = [];
  for (let i = 1; i <= count; i++) {
    participants.push(await addParticipant(prisma, beeId, `${namePrefix} ${i}`));
  }
  return participants;
}

/** Submits a correct answer for whichever participant is next up. Throws if it's not `participantId`'s turn. */
export async function answerCorrectly(prisma: PrismaClient, beeId: number, participantId: number) {
  const turn = await getNextTurn(prisma, beeId);
  if (!turn || turn.participant.id !== participantId) {
    throw new Error(`answerCorrectly: it is not participant ${participantId}'s turn`);
  }
  return submitResponse(prisma, { beeId, participantId, userSpelling: turn.word });
}

/** Submits an incorrect answer for whichever participant is next up. */
export async function answerIncorrectly(prisma: PrismaClient, beeId: number, participantId: number) {
  const turn = await getNextTurn(prisma, beeId);
  if (!turn || turn.participant.id !== participantId) {
    throw new Error(`answerIncorrectly: it is not participant ${participantId}'s turn`);
  }
  return submitResponse(prisma, { beeId, participantId, userSpelling: `${turn.word}-wrong` });
}

export async function skipTurn(prisma: PrismaClient, beeId: number, participantId: number) {
  return skipParticipant(prisma, beeId, participantId);
}

/**
 * Drives every remaining turn in the current round to completion, answering correctly
 * unless the participant's id is in `incorrectIds`/`skipIds`.
 */
export async function playOutRound(
  prisma: PrismaClient,
  beeId: number,
  options: { incorrectIds?: Set<number>; skipIds?: Set<number> } = {},
) {
  const incorrectIds = options.incorrectIds ?? new Set<number>();
  const skipIds = options.skipIds ?? new Set<number>();

  let turn = await getNextTurn(prisma, beeId);
  while (turn) {
    const participantId = turn.participant.id;
    if (skipIds.has(participantId)) {
      await skipTurn(prisma, beeId, participantId);
    } else if (incorrectIds.has(participantId)) {
      await answerIncorrectly(prisma, beeId, participantId);
    } else {
      await answerCorrectly(prisma, beeId, participantId);
    }
    turn = await getNextTurn(prisma, beeId);
  }
}
