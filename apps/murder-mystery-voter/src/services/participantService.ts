import { Prisma } from "../../generated/prisma/client.ts";
import type { PrismaClient, MysteryParticipant } from "../../generated/prisma/client.ts";
import { ValidationError, NotFoundError, InvalidEventStateError, DuplicateParticipantError } from "../errors/index.ts";
import { getEventById } from "./eventService.ts";
import { isValidEmail, normalizeEmail } from "../domain/email.ts";

export interface AddParticipantInput {
  name: string;
  email: string;
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
      data: { eventId, name, email },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new DuplicateParticipantError(`A participant with email "${email}" already exists in this event`);
    }
    throw err;
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
