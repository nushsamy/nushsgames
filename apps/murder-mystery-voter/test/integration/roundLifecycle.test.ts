import { describe, it, expect, beforeEach } from "vitest";
import { testPrisma } from "../helpers/prismaTestClient.ts";
import { resetDatabase } from "../helpers/resetDb.ts";
import { buildEvent } from "../helpers/factories.ts";
import { startEvent, endEvent } from "../../src/services/eventService.ts";
import { setAttendance } from "../../src/services/participantService.ts";
import { addRound } from "../../src/services/roundService.ts";
import { openRound, closeRound, getRoundTally } from "../../src/services/roundLifecycleService.ts";
import { castVote } from "../../src/services/ballotService.ts";
import { InvalidEventStateError, RoundAlreadyOpenError, ValidationError } from "../../src/errors/index.ts";

beforeEach(async () => {
  await resetDatabase(testPrisma);
});

async function buildStartedEvent() {
  const built = await buildEvent(testPrisma);
  await addRound(testPrisma, built.event.id);
  await addRound(testPrisma, built.event.id);
  await startEvent(testPrisma, built.event.id);
  return built;
}

describe("attendance", () => {
  it("is only editable after start and before round 1 opens", async () => {
    const { event, participants } = await buildEvent(testPrisma);
    // still "created" -- too early
    await expect(setAttendance(testPrisma, event.id, participants.map((p) => p.id))).rejects.toThrow(
      InvalidEventStateError,
    );
  });

  it("locks once round 1 has opened", async () => {
    const built = await buildStartedEvent();
    await setAttendance(testPrisma, built.event.id, built.participants.map((p) => p.id));
    await openRound(testPrisma, built.event.id, 1);

    await expect(setAttendance(testPrisma, built.event.id, [])).rejects.toThrow(InvalidEventStateError);
  });

  it("excludes non-attending participants from every round's ballots", async () => {
    const built = await buildStartedEvent();
    const [present, absent] = built.participants;
    await setAttendance(testPrisma, built.event.id, [present.id]);

    const { ballots: round1Ballots } = await openRound(testPrisma, built.event.id, 1);
    expect(round1Ballots.map((b) => b.participantId)).toEqual([present.id]);
    expect(round1Ballots.some((b) => b.participantId === absent.id)).toBe(false);

    await closeRound(testPrisma, built.event.id, 1);
    const { ballots: round2Ballots } = await openRound(testPrisma, built.event.id, 2);
    expect(round2Ballots.map((b) => b.participantId)).toEqual([present.id]);
  });
});

describe("round open/close", () => {
  it("only allows one round open at a time", async () => {
    const built = await buildStartedEvent();
    await setAttendance(testPrisma, built.event.id, built.participants.map((p) => p.id));
    await openRound(testPrisma, built.event.id, 1);

    await expect(openRound(testPrisma, built.event.id, 2)).rejects.toThrow(RoundAlreadyOpenError);
  });

  it("expires still-pending ballots when a round closes", async () => {
    const built = await buildStartedEvent();
    await setAttendance(testPrisma, built.event.id, built.participants.map((p) => p.id));
    const { ballots } = await openRound(testPrisma, built.event.id, 1);

    // Only the first participant votes; the rest stay pending and should expire on close.
    await castVote(testPrisma, ballots[0].token, built.suspects[0].id);
    await closeRound(testPrisma, built.event.id, 1);

    const tally = await getRoundTally(testPrisma, built.event.id, 1);
    expect(tally.castCount).toBe(1);
    expect(tally.pendingCount).toBe(0);
    expect(tally.expiredCount).toBe(ballots.length - 1);
  });

  it("computes suspect tallies from cast ballots only", async () => {
    const built = await buildStartedEvent();
    await setAttendance(testPrisma, built.event.id, built.participants.map((p) => p.id));
    const { ballots } = await openRound(testPrisma, built.event.id, 1);

    for (const ballot of ballots) {
      await castVote(testPrisma, ballot.token, built.suspects[0].id);
    }

    const tally = await getRoundTally(testPrisma, built.event.id, 1);
    const winner = tally.tally.find((t) => t.suspectId === built.suspects[0].id)!;
    expect(winner.count).toBe(ballots.length);
    expect(winner.percentage).toBe(100);
  });

  it("includes every participant as a suspect automatically, with no assignment step", async () => {
    const built = await buildStartedEvent();
    await setAttendance(testPrisma, built.event.id, built.participants.map((p) => p.id));
    await openRound(testPrisma, built.event.id, 1);

    const tally = await getRoundTally(testPrisma, built.event.id, 1);
    expect(tally.tally.map((t) => t.suspectId).sort()).toEqual(built.participants.map((p) => p.id).sort());
  });

  it("cannot end an event while a round is still open", async () => {
    const built = await buildStartedEvent();
    await setAttendance(testPrisma, built.event.id, built.participants.map((p) => p.id));
    await openRound(testPrisma, built.event.id, 1);

    await expect(endEvent(testPrisma, built.event.id)).rejects.toThrow(InvalidEventStateError);
  });

  it("requires at least one attending participant to open a round", async () => {
    const built = await buildStartedEvent();
    await setAttendance(testPrisma, built.event.id, []);
    await expect(openRound(testPrisma, built.event.id, 1)).rejects.toThrow(ValidationError);
  });
});
