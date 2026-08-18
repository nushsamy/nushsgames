import type { PrismaClient, Prisma, MysteryEvent, MysteryRound } from "../../generated/prisma/client.ts";
import { NotFoundError, InvalidEventStateError, ValidationError } from "../errors/index.ts";
import { getEventById } from "./eventService.ts";

export async function addRound(prisma: PrismaClient, eventId: number): Promise<MysteryRound> {
  return prisma.$transaction(async (tx) => {
    const event = await getEventById(tx, eventId);
    if (event.status !== "created") {
      throw new InvalidEventStateError(`Rounds can only be added while event ${eventId} is "created"`);
    }

    const roundNumber = event.totalRounds + 1;
    const round = await tx.mysteryRound.create({
      data: { eventId, roundNumber, suspectIds: [] },
    });
    await tx.mysteryEvent.update({ where: { id: eventId }, data: { totalRounds: roundNumber } });
    return round;
  });
}

export async function setRoundSuspects(
  prisma: PrismaClient,
  eventId: number,
  roundNumber: number,
  suspectIds: number[],
): Promise<MysteryRound> {
  if (!Array.isArray(suspectIds) || suspectIds.length === 0) {
    throw new ValidationError("suspectIds must be a non-empty array");
  }

  const event = await getEventById(prisma, eventId);
  if (event.status !== "created") {
    throw new InvalidEventStateError(`Round suspects can only be edited while event ${eventId} is "created"`);
  }

  const round = await prisma.mysteryRound.findUnique({
    where: { eventId_roundNumber: { eventId, roundNumber } },
  });
  if (!round) {
    throw new NotFoundError(`Round ${roundNumber} for event ${eventId} not found`);
  }

  const eventSuspects = await prisma.suspect.findMany({ where: { eventId } });
  const validIds = new Set(eventSuspects.map((s) => s.id));
  const invalid = suspectIds.filter((id) => !validIds.has(id));
  if (invalid.length > 0) {
    throw new ValidationError(`Suspect ids do not belong to event ${eventId}: ${invalid.join(", ")}`);
  }

  return prisma.mysteryRound.update({
    where: { id: round.id },
    data: { suspectIds },
  });
}

export async function listRounds(
  prisma: PrismaClient | Prisma.TransactionClient,
  eventId: number,
): Promise<MysteryRound[]> {
  return prisma.mysteryRound.findMany({ where: { eventId }, orderBy: { roundNumber: "asc" } });
}

export async function getRoundByNumber(
  prisma: PrismaClient | Prisma.TransactionClient,
  eventId: number,
  roundNumber: number,
): Promise<MysteryRound> {
  const round = await prisma.mysteryRound.findUnique({
    where: { eventId_roundNumber: { eventId, roundNumber } },
  });
  if (!round) {
    throw new NotFoundError(`Round ${roundNumber} for event ${eventId} not found`);
  }
  return round;
}

export async function deleteRound(
  prisma: PrismaClient,
  eventId: number,
  roundNumber: number,
): Promise<MysteryEvent> {
  return prisma.$transaction(async (tx) => {
    const event = await getEventById(tx, eventId);
    if (event.status !== "created") {
      throw new InvalidEventStateError(`Rounds can only be deleted while event ${eventId} is "created"`);
    }

    const round = await tx.mysteryRound.findUnique({
      where: { eventId_roundNumber: { eventId, roundNumber } },
    });
    if (!round) {
      throw new NotFoundError(`Round ${roundNumber} for event ${eventId} not found`);
    }

    await tx.mysteryRound.delete({ where: { id: round.id } });

    // Renumber subsequent rounds down by one, ascending, so each write targets the slot
    // the previous step just vacated -- this never collides with @@unique([eventId, roundNumber])
    // because addRound always appends contiguously, so rounds are always 1..totalRounds pre-delete.
    const subsequent = await tx.mysteryRound.findMany({
      where: { eventId, roundNumber: { gt: roundNumber } },
      orderBy: { roundNumber: "asc" },
    });
    for (const r of subsequent) {
      await tx.mysteryRound.update({ where: { id: r.id }, data: { roundNumber: r.roundNumber - 1 } });
    }

    return tx.mysteryEvent.update({
      where: { id: eventId },
      data: { totalRounds: event.totalRounds - 1 },
    });
  });
}
