import type { PrismaClient, SpellingBee, Participant } from "../../generated/prisma/client.ts";
import { createBee, startBee, getBeeById } from "../../src/services/beeService.ts";
import { addParticipant } from "../../src/services/participantService.ts";
import { getNextTurn, addRound, setRoundWords, startRound } from "../../src/services/roundService.ts";
import { submitResponse, skipParticipant } from "../../src/services/responseService.ts";

export { startRound };

export const DEFAULT_ROUND_WORDS: string[][] = [
  ["apple", "banana"],
  ["cherry", "date"],
];

let nextTestUserId = 1;

/**
 * Users now live in the separate @nushsgames/auth service's database, so there's no local
 * table to insert into — just hand back a fresh opaque id, as if it came from that service.
 */
export async function createTestUser(_prisma: PrismaClient): Promise<{ id: number }> {
  return { id: nextTestUserId++ };
}

export interface BuildBeeOptions {
  title?: string;
  /** One word list per round; roundWords[i] becomes round i + 1. Pass [] to build a bee with no rounds. */
  roundWords?: string[][];
}

export async function buildBee(
  prisma: PrismaClient,
  overrides: BuildBeeOptions = {},
): Promise<SpellingBee> {
  const { title = "Test Bee", roundWords = DEFAULT_ROUND_WORDS } = overrides;
  const user = await createTestUser(prisma);
  const bee = await createBee(prisma, { userId: user.id, title });

  for (const words of roundWords) {
    const round = await addRound(prisma, bee.id);
    await setRoundWords(prisma, bee.id, round.roundNumber, words);
  }

  return roundWords.length > 0 ? getBeeById(prisma, bee.id) : bee;
}

export async function buildStartedBee(
  prisma: PrismaClient,
  overrides: BuildBeeOptions = {},
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
