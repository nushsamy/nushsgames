import { randomUUID } from "node:crypto";
import type { PrismaClient, MysteryEvent, MysteryParticipant } from "../../generated/prisma/client.ts";
import { createEvent, startEvent } from "../../src/services/eventService.ts";
import { addParticipant, setAttendance } from "../../src/services/participantService.ts";
import { addRound } from "../../src/services/roundService.ts";
import { openRound } from "../../src/services/roundLifecycleService.ts";

let nextTestUserId = 1;

/**
 * Users now live in the separate @nushsgames/auth service's database, so there's no local
 * table to insert into — just hand back a fresh opaque id, as if it came from that service.
 */
export async function createTestUser(_prisma: PrismaClient): Promise<{ id: number }> {
  return { id: nextTestUserId++ };
}

export interface BuildEventParticipantInput {
  name: string;
  email: string;
  characterName: string;
  description?: string;
}

export interface BuildEventOptions {
  title?: string;
  userId?: number;
  participants?: BuildEventParticipantInput[];
}

export interface BuiltEvent {
  event: MysteryEvent;
  userId: number;
  participants: MysteryParticipant[];
  /** Alias for `participants` -- every participant can be named a round's suspect. */
  suspects: MysteryParticipant[];
}

export async function buildEvent(prisma: PrismaClient, overrides: BuildEventOptions = {}): Promise<BuiltEvent> {
  const {
    title = "Test Mystery",
    participants: participantInputs = [
      { name: "Pat", email: `pat-${randomUUID()}@test.dev`, characterName: "Butler" },
      { name: "Sam", email: `sam-${randomUUID()}@test.dev`, characterName: "Maid" },
    ],
  } = overrides;

  const userId = overrides.userId ?? (await createTestUser(prisma)).id;
  const event = await createEvent(prisma, { userId, title });

  const participants: MysteryParticipant[] = [];
  for (const input of participantInputs) {
    participants.push(await addParticipant(prisma, event.id, input));
  }

  return { event, userId, participants, suspects: participants };
}

/** Builds an event with one round, starts it, marks everyone attending, and opens round 1. */
export async function buildLiveEvent(prisma: PrismaClient, overrides: BuildEventOptions = {}) {
  const built = await buildEvent(prisma, overrides);
  await addRound(prisma, built.event.id);

  await startEvent(prisma, built.event.id);
  await setAttendance(
    prisma,
    built.event.id,
    built.participants.map((p) => p.id),
  );
  const { ballots } = await openRound(prisma, built.event.id, 1);

  return { ...built, ballots };
}
