import { randomUUID } from "node:crypto";
import type { PrismaClient, MysteryEvent, Suspect, MysteryParticipant } from "../../generated/prisma/client.ts";
import { createEvent, startEvent } from "../../src/services/eventService.ts";
import { addSuspect } from "../../src/services/suspectService.ts";
import { addParticipant, setAttendance } from "../../src/services/participantService.ts";
import { addRound, setRoundSuspects } from "../../src/services/roundService.ts";
import { openRound } from "../../src/services/roundLifecycleService.ts";

export async function createTestUser(prisma: PrismaClient) {
  return prisma.user.create({
    data: {
      email: `${randomUUID()}@test.dev`,
      passwordHash: "test-hash",
    },
  });
}

export interface BuildEventOptions {
  title?: string;
  userId?: number;
  suspectNames?: string[];
  participants?: { name: string; email: string }[];
}

export interface BuiltEvent {
  event: MysteryEvent;
  userId: number;
  suspects: Suspect[];
  participants: MysteryParticipant[];
}

export async function buildEvent(prisma: PrismaClient, overrides: BuildEventOptions = {}): Promise<BuiltEvent> {
  const {
    title = "Test Mystery",
    suspectNames = ["Butler", "Maid"],
    participants: participantInputs = [
      { name: "Pat", email: `pat-${randomUUID()}@test.dev` },
      { name: "Sam", email: `sam-${randomUUID()}@test.dev` },
    ],
  } = overrides;

  const userId = overrides.userId ?? (await createTestUser(prisma)).id;
  const event = await createEvent(prisma, { userId, title });

  const suspects: Suspect[] = [];
  for (const name of suspectNames) {
    suspects.push(await addSuspect(prisma, event.id, { name }));
  }

  const participants: MysteryParticipant[] = [];
  for (const input of participantInputs) {
    participants.push(await addParticipant(prisma, event.id, input));
  }

  return { event, userId, suspects, participants };
}

export async function addRoundWithSuspects(
  prisma: PrismaClient,
  eventId: number,
  suspectIds: number[],
) {
  const round = await addRound(prisma, eventId);
  return setRoundSuspects(prisma, eventId, round.roundNumber, suspectIds);
}

/** Builds an event with one round, starts it, marks everyone attending, and opens round 1. */
export async function buildLiveEvent(prisma: PrismaClient, overrides: BuildEventOptions = {}) {
  const built = await buildEvent(prisma, overrides);
  await addRoundWithSuspects(
    prisma,
    built.event.id,
    built.suspects.map((s) => s.id),
  );

  await startEvent(prisma, built.event.id);
  await setAttendance(
    prisma,
    built.event.id,
    built.participants.map((p) => p.id),
  );
  const { ballots } = await openRound(prisma, built.event.id, 1);

  return { ...built, ballots };
}
