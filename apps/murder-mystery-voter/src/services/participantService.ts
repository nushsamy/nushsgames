import { Prisma } from "../../generated/prisma/client.ts";
import type { PrismaClient, MysteryParticipant } from "../../generated/prisma/client.ts";
import {
  ValidationError,
  NotFoundError,
  InvalidEventStateError,
  DuplicateSuspectError,
  DuplicateParticipantError,
} from "../errors/index.ts";
import { getEventById } from "./eventService.ts";
import { isValidEmail, normalizeEmail } from "../domain/email.ts";

export interface AddParticipantInput {
  name: string;
  email: string;
  characterName: string;
  description?: string;
}

/**
 * P2002's `meta` shape depends on how the error reached us: the classic query engine reports
 * `meta.target` as a plain field-name array, while the pg driver adapter (used here) nests it
 * under `meta.driverAdapterError.cause.constraint.fields` with each name still double-quoted.
 */
function violatedUniqueFields(err: Prisma.PrismaClientKnownRequestError): string[] {
  const target = err.meta?.target;
  if (Array.isArray(target)) {
    return target as string[];
  }

  const driverFields = (
    err.meta?.driverAdapterError as
      | { cause?: { constraint?: { fields?: string[] } } }
      | undefined
  )?.cause?.constraint?.fields;
  if (Array.isArray(driverFields)) {
    return driverFields.map((field) => field.replace(/^"|"$/g, ""));
  }

  return [];
}

function duplicateFieldError(err: unknown, name: string, characterName: string): Error | null {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError) || err.code !== "P2002") {
    return null;
  }
  const fields = violatedUniqueFields(err);
  if (fields.includes("characterName")) {
    return new DuplicateSuspectError(`A suspect named "${characterName}" already exists in this event`);
  }
  return new DuplicateParticipantError(`A participant named "${name}" already exists in this event`);
}

export async function addParticipant(
  prisma: PrismaClient,
  eventId: number,
  input: AddParticipantInput,
): Promise<MysteryParticipant> {
  const name = input.name.trim();
  if (!name) {
    throw new ValidationError("Participant name must not be empty");
  }
  const characterName = input.characterName.trim();
  if (!characterName) {
    throw new ValidationError("Suspect name must not be empty");
  }
  const email = normalizeEmail(input.email);
  if (!isValidEmail(email)) {
    throw new ValidationError("A valid participant email address is required");
  }

  const event = await getEventById(prisma, eventId);
  if (event.status !== "created") {
    throw new InvalidEventStateError(`Participants can only be added while event ${eventId} is "created"`);
  }

  try {
    return await prisma.mysteryParticipant.create({
      data: { eventId, name, email, characterName, description: input.description?.trim() || null },
    });
  } catch (err) {
    throw duplicateFieldError(err, name, characterName) ?? err;
  }
}

export async function listParticipants(prisma: PrismaClient, eventId: number): Promise<MysteryParticipant[]> {
  await getEventById(prisma, eventId);
  return prisma.mysteryParticipant.findMany({ where: { eventId }, orderBy: { id: "asc" } });
}

export async function getParticipantById(
  prisma: PrismaClient,
  eventId: number,
  participantId: number,
): Promise<MysteryParticipant> {
  const participant = await prisma.mysteryParticipant.findUnique({ where: { id: participantId } });
  if (!participant || participant.eventId !== eventId) {
    throw new NotFoundError(`Participant ${participantId} not found in event ${eventId}`);
  }
  return participant;
}

export interface UpdateParticipantInput {
  name?: string;
  email?: string;
  characterName?: string;
  description?: string;
}

export async function updateParticipant(
  prisma: PrismaClient,
  eventId: number,
  participantId: number,
  updates: UpdateParticipantInput,
): Promise<MysteryParticipant> {
  const event = await getEventById(prisma, eventId);
  if (event.status !== "created") {
    throw new InvalidEventStateError(`Participants can only be edited while event ${eventId} is "created"`);
  }
  await getParticipantById(prisma, eventId, participantId);

  const data: Prisma.MysteryParticipantUpdateInput = {};
  if (updates.name !== undefined) {
    if (!updates.name.trim()) {
      throw new ValidationError("Participant name must not be empty");
    }
    data.name = updates.name.trim();
  }
  if (updates.characterName !== undefined) {
    if (!updates.characterName.trim()) {
      throw new ValidationError("Suspect name must not be empty");
    }
    data.characterName = updates.characterName.trim();
  }
  if (updates.email !== undefined) {
    const email = normalizeEmail(updates.email);
    if (!isValidEmail(email)) {
      throw new ValidationError("A valid participant email address is required");
    }
    data.email = email;
  }
  if (updates.description !== undefined) {
    data.description = updates.description.trim() || null;
  }

  try {
    return await prisma.mysteryParticipant.update({ where: { id: participantId }, data });
  } catch (err) {
    throw duplicateFieldError(err, data.name as string, data.characterName as string) ?? err;
  }
}

export async function deleteParticipant(prisma: PrismaClient, eventId: number, participantId: number): Promise<void> {
  const event = await getEventById(prisma, eventId);
  if (event.status !== "created") {
    throw new InvalidEventStateError(`Participants can only be removed while event ${eventId} is "created"`);
  }
  await getParticipantById(prisma, eventId, participantId);
  await prisma.mysteryParticipant.delete({ where: { id: participantId } });
}

export async function setAttendance(
  prisma: PrismaClient,
  eventId: number,
  presentParticipantIds: number[],
): Promise<MysteryParticipant[]> {
  return prisma.$transaction(async (tx) => {
    const event = await getEventById(tx, eventId);
    if (event.status !== "in_progress" || event.currentRound !== 0) {
      throw new InvalidEventStateError(
        `Attendance for event ${eventId} can only be taken after it starts and before round 1 opens`,
      );
    }

    const participants = await tx.mysteryParticipant.findMany({ where: { eventId } });
    const validIds = new Set(participants.map((p) => p.id));
    const invalid = presentParticipantIds.filter((id) => !validIds.has(id));
    if (invalid.length > 0) {
      throw new ValidationError(`Participant ids not found in event ${eventId}: ${invalid.join(", ")}`);
    }

    const presentSet = new Set(presentParticipantIds);
    await Promise.all(
      participants.map((participant) =>
        tx.mysteryParticipant.update({
          where: { id: participant.id },
          data: { isAttending: presentSet.has(participant.id) },
        }),
      ),
    );

    return tx.mysteryParticipant.findMany({ where: { eventId }, orderBy: { id: "asc" } });
  });
}
