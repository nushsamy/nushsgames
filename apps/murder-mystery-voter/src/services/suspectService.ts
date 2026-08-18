import { Prisma } from "../../generated/prisma/client.ts";
import type { PrismaClient, Suspect } from "../../generated/prisma/client.ts";
import { ValidationError, NotFoundError, InvalidEventStateError, DuplicateSuspectError } from "../errors/index.ts";
import { getEventById } from "./eventService.ts";

export interface AddSuspectInput {
  name: string;
  description?: string;
}

export async function addSuspect(
  prisma: PrismaClient,
  eventId: number,
  input: AddSuspectInput,
): Promise<Suspect> {
  const name = input.name.trim();
  if (!name) {
    throw new ValidationError("Suspect name must not be empty");
  }

  const event = await getEventById(prisma, eventId);
  if (event.status !== "created") {
    throw new InvalidEventStateError(`Suspects can only be added while event ${eventId} is "created"`);
  }

  try {
    return await prisma.suspect.create({
      data: { eventId, name, description: input.description?.trim() || null },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new DuplicateSuspectError(`A suspect named "${name}" already exists in this event`);
    }
    throw err;
  }
}

export async function listSuspects(prisma: PrismaClient, eventId: number): Promise<Suspect[]> {
  await getEventById(prisma, eventId);
  return prisma.suspect.findMany({ where: { eventId }, orderBy: { id: "asc" } });
}

export async function getSuspectById(prisma: PrismaClient, eventId: number, suspectId: number): Promise<Suspect> {
  const suspect = await prisma.suspect.findUnique({ where: { id: suspectId } });
  if (!suspect || suspect.eventId !== eventId) {
    throw new NotFoundError(`Suspect ${suspectId} not found in event ${eventId}`);
  }
  return suspect;
}

export interface UpdateSuspectInput {
  name?: string;
  description?: string;
}

export async function updateSuspect(
  prisma: PrismaClient,
  eventId: number,
  suspectId: number,
  updates: UpdateSuspectInput,
): Promise<Suspect> {
  const event = await getEventById(prisma, eventId);
  if (event.status !== "created") {
    throw new InvalidEventStateError(`Suspects can only be edited while event ${eventId} is "created"`);
  }
  await getSuspectById(prisma, eventId, suspectId);

  const data: Prisma.SuspectUpdateInput = {};
  if (updates.name !== undefined) {
    if (!updates.name.trim()) {
      throw new ValidationError("Suspect name must not be empty");
    }
    data.name = updates.name.trim();
  }
  if (updates.description !== undefined) {
    data.description = updates.description.trim() || null;
  }

  try {
    return await prisma.suspect.update({ where: { id: suspectId }, data });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new DuplicateSuspectError(`A suspect named "${data.name}" already exists in this event`);
    }
    throw err;
  }
}

export async function deleteSuspect(prisma: PrismaClient, eventId: number, suspectId: number): Promise<void> {
  const event = await getEventById(prisma, eventId);
  if (event.status !== "created") {
    throw new InvalidEventStateError(`Suspects can only be deleted while event ${eventId} is "created"`);
  }
  await getSuspectById(prisma, eventId, suspectId);

  const rounds = await prisma.mysteryRound.findMany({ where: { eventId } });
  const referencedByRound = rounds.find((round) => (round.suspectIds as number[]).includes(suspectId));
  if (referencedByRound) {
    throw new ValidationError(
      `Suspect ${suspectId} is still assigned to round ${referencedByRound.roundNumber} -- remove it from that round first`,
    );
  }

  await prisma.suspect.delete({ where: { id: suspectId } });
}
