import type { PrismaClient, Prisma, Participant } from "../../generated/prisma/client.ts";
import {
  NotFoundError,
  ParticipantNotInBeeError,
  ParticipantNotEligibleError,
} from "../errors/index.ts";
import { isSpelledCorrectly } from "../domain/spelling.ts";
import { getBeeById } from "./beeService.ts";
import { requireRoundStarted, getNextTurn } from "./roundService.ts";

export interface SubmitResponseInput {
  beeId: number;
  participantId: number;
  userSpelling: string;
}

export interface SubmissionResult {
  participant: Participant;
  word: string;
  userSpelling: string;
  spelledCorrectly: boolean;
}

async function loadEligibleTurn(
  tx: Prisma.TransactionClient,
  beeId: number,
  participantId: number,
) {
  const bee = await getBeeById(tx, beeId);
  requireRoundStarted(bee);

  const participant = await tx.participant.findUnique({ where: { id: participantId } });
  if (!participant) {
    throw new NotFoundError(`Participant ${participantId} not found`);
  }
  if (participant.beeId !== beeId) {
    throw new ParticipantNotInBeeError(`Participant ${participantId} does not belong to bee ${beeId}`);
  }
  if (!participant.isActive || participant.isEliminated) {
    throw new ParticipantNotEligibleError(`Participant ${participantId} is not active in bee ${beeId}`);
  }

  const nextTurn = await getNextTurn(tx, beeId);
  if (!nextTurn || nextTurn.participant.id !== participantId) {
    throw new ParticipantNotEligibleError(
      `It is not participant ${participantId}'s turn in bee ${beeId}`,
    );
  }

  return { bee, participant, nextTurn };
}

export async function submitResponse(
  prisma: PrismaClient,
  input: SubmitResponseInput,
): Promise<SubmissionResult> {
  return prisma.$transaction(async (tx) => {
    const { bee, nextTurn } = await loadEligibleTurn(tx, input.beeId, input.participantId);
    const spelledCorrectly = isSpelledCorrectly(nextTurn.word, input.userSpelling);

    const participant = await tx.participant.update({
      where: { id: input.participantId },
      data: spelledCorrectly
        ? { isActive: false }
        : { isActive: false, isEliminated: true, eliminatedRound: bee.currentRound },
    });

    return {
      participant,
      word: nextTurn.word,
      userSpelling: input.userSpelling,
      spelledCorrectly,
    };
  });
}

export async function skipParticipant(
  prisma: PrismaClient,
  beeId: number,
  participantId: number,
): Promise<SubmissionResult> {
  return prisma.$transaction(async (tx) => {
    const { bee, nextTurn } = await loadEligibleTurn(tx, beeId, participantId);

    const participant = await tx.participant.update({
      where: { id: participantId },
      data: { isActive: false, isEliminated: true, eliminatedRound: bee.currentRound },
    });

    return {
      participant,
      word: nextTurn.word,
      userSpelling: "",
      spelledCorrectly: false,
    };
  });
}
