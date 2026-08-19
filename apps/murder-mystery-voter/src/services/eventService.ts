import type { PrismaClient, MysteryEvent } from "../../generated/prisma/client.ts";
import { Prisma } from "../../generated/prisma/client.ts";
import { ValidationError, NotFoundError, InvalidEventStateError } from "../errors/index.ts";

export interface CreateEventInput {
  userId: number;
  title: string;
}

export async function createEvent(
  prisma: PrismaClient,
  input: CreateEventInput,
): Promise<MysteryEvent> {
  if (!input.title.trim()) {
    throw new ValidationError("Event title must not be empty");
  }

  return prisma.mysteryEvent.create({
    data: {
      userId: input.userId,
      title: input.title.trim(),
    },
  });
}

export async function getEventById(
  prisma: PrismaClient | Prisma.TransactionClient,
  eventId: number,
): Promise<MysteryEvent> {
  const event = await prisma.mysteryEvent.findUnique({ where: { id: eventId } });
  if (!event) {
    throw new NotFoundError(`Mystery event ${eventId} not found`);
  }
  return event;
}

export interface UpdateEventInput {
  title?: string;
}

export async function updateEvent(
  prisma: PrismaClient,
  eventId: number,
  updates: UpdateEventInput,
): Promise<MysteryEvent> {
  const event = await getEventById(prisma, eventId);
  if (event.status !== "created") {
    throw new InvalidEventStateError(
      `Event ${eventId} config can only be edited while "created", not "${event.status}"`,
    );
  }

  const data: Prisma.MysteryEventUpdateInput = {};
  if (updates.title !== undefined) {
    if (!updates.title.trim()) {
      throw new ValidationError("Event title must not be empty");
    }
    data.title = updates.title.trim();
  }

  return prisma.mysteryEvent.update({ where: { id: eventId }, data });
}

export async function startEvent(prisma: PrismaClient, eventId: number): Promise<MysteryEvent> {
  return prisma.$transaction(async (tx) => {
    const event = await getEventById(tx, eventId);
    if (event.status !== "created") {
      throw new InvalidEventStateError(
        `Event ${eventId} cannot be started from status "${event.status}"`,
      );
    }

    const [participantCount, roundCount] = await Promise.all([
      tx.mysteryParticipant.count({ where: { eventId } }),
      tx.mysteryRound.count({ where: { eventId } }),
    ]);

    if (participantCount === 0) {
      throw new ValidationError(`Event ${eventId} has no participants`);
    }
    if (roundCount === 0) {
      throw new ValidationError(`Event ${eventId} has no rounds`);
    }

    return tx.mysteryEvent.update({
      where: { id: eventId },
      data: { status: "in_progress" },
    });
  });
}

export async function endEvent(prisma: PrismaClient, eventId: number): Promise<MysteryEvent> {
  return prisma.$transaction(async (tx) => {
    const event = await getEventById(tx, eventId);
    if (event.status !== "in_progress") {
      throw new InvalidEventStateError(`Event ${eventId} cannot be ended from status "${event.status}"`);
    }

    const openRound = await tx.mysteryRound.findFirst({ where: { eventId, status: "open" } });
    if (openRound) {
      throw new InvalidEventStateError(
        `Round ${openRound.roundNumber} is still open -- close it before ending event ${eventId}`,
      );
    }

    return tx.mysteryEvent.update({
      where: { id: eventId },
      data: { status: "completed" },
    });
  });
}

export async function deleteEvent(prisma: PrismaClient, eventId: number): Promise<void> {
  const event = await getEventById(prisma, eventId);
  if (event.status !== "created") {
    throw new InvalidEventStateError(
      `Event ${eventId} can only be deleted while "created", not "${event.status}"`,
    );
  }
  await prisma.mysteryEvent.delete({ where: { id: eventId } });
}
