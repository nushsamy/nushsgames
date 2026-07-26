import { Prisma } from "../../generated/prisma/client.ts";
import type { PrismaClient, Participant } from "../../generated/prisma/client.ts";
import {
  ValidationError,
  NotFoundError,
  InvalidBeeStateError,
  DuplicateParticipantError,
  RoundInProgressError,
} from "../errors/index.ts";
import { getBeeById } from "./beeService.ts";
import { isRoundComplete } from "./roundService.ts";

export async function addParticipant(
  prisma: PrismaClient,
  beeId: number,
  name: string,
): Promise<Participant> {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new ValidationError("Participant name must not be empty");
  }

  const bee = await getBeeById(prisma, beeId);
  if (bee.status !== "in_progress") {
    throw new InvalidBeeStateError(
      `Cannot add a participant to bee ${beeId} while it is "${bee.status}"`,
    );
  }

  const existing = await prisma.participant.findFirst({
    where: { beeId, name: { equals: trimmedName, mode: "insensitive" } },
  });
  if (existing) {
    throw new DuplicateParticipantError(
      `A participant named "${trimmedName}" already exists in this bee`,
    );
  }

  try {
    return await prisma.participant.create({
      data: { beeId, name: trimmedName },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new DuplicateParticipantError(
        `A participant named "${trimmedName}" already exists in this bee`,
      );
    }
    throw err;
  }
}

export async function reactivateParticipant(
  prisma: PrismaClient,
  participantId: number,
): Promise<Participant> {
  const participant = await prisma.participant.findUnique({ where: { id: participantId } });
  if (!participant) {
    throw new NotFoundError(`Participant ${participantId} not found`);
  }

  const bee = await getBeeById(prisma, participant.beeId);
  if (bee.status !== "in_progress") {
    throw new InvalidBeeStateError(
      `Cannot reactivate a participant in bee ${bee.id} while it is "${bee.status}"`,
    );
  }

  return prisma.participant.update({
    where: { id: participantId },
    data: { isActive: true, isEliminated: false },
  });
}

export async function getParticipantById(
  prisma: PrismaClient | Prisma.TransactionClient,
  participantId: number,
): Promise<Participant> {
  const participant = await prisma.participant.findUnique({ where: { id: participantId } });
  if (!participant) {
    throw new NotFoundError(`Participant ${participantId} not found`);
  }
  return participant;
}

export interface UpdateParticipantStatusInput {
  isActive?: boolean;
  isEliminated?: boolean;
}

export async function updateParticipantStatus(
  prisma: PrismaClient,
  participantId: number,
  updates: UpdateParticipantStatusInput,
): Promise<Participant> {
  if (updates.isActive === undefined && updates.isEliminated === undefined) {
    throw new ValidationError("At least one of isActive or isEliminated must be provided");
  }
  if (updates.isActive === true && updates.isEliminated === true) {
    throw new ValidationError("A participant cannot be both active and eliminated");
  }

  return prisma.$transaction(async (tx) => {
    const participant = await getParticipantById(tx, participantId);
    const bee = await getBeeById(tx, participant.beeId);
    if (bee.status !== "in_progress") {
      throw new InvalidBeeStateError(
        `Cannot update participant ${participantId} while bee ${bee.id} is "${bee.status}"`,
      );
    }
    if (!(await isRoundComplete(tx, bee.id))) {
      throw new RoundInProgressError(
        `Cannot manually update participants in bee ${bee.id} until the current round is complete`,
      );
    }

    return tx.participant.update({
      where: { id: participantId },
      data: updates,
    });
  });
}

export async function listParticipants(
  prisma: PrismaClient,
  beeId: number,
): Promise<{ active: Participant[]; eliminated: Participant[] }> {
  await getBeeById(prisma, beeId);

  const participants = await prisma.participant.findMany({
    where: { beeId },
    orderBy: { id: "asc" },
  });

  return {
    active: participants.filter((p) => !p.isEliminated),
    eliminated: participants.filter((p) => p.isEliminated),
  };
}
