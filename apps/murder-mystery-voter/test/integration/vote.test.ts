import { describe, it, expect, beforeEach } from "vitest";
import { testPrisma } from "../helpers/prismaTestClient.ts";
import { resetDatabase } from "../helpers/resetDb.ts";
import { buildLiveEvent } from "../helpers/factories.ts";
import { closeRound } from "../../src/services/roundLifecycleService.ts";
import { getBallotByToken, castVote } from "../../src/services/ballotService.ts";
import { BallotNotFoundError, BallotAlreadyCastError, BallotExpiredError, ValidationError } from "../../src/errors/index.ts";

beforeEach(async () => {
  await resetDatabase(testPrisma);
});

describe("getBallotByToken", () => {
  it("returns the eligible suspects for an unknown-yet-valid ballot, excluding the voter themselves", async () => {
    const { ballots, suspects, event } = await buildLiveEvent(testPrisma);
    const view = await getBallotByToken(testPrisma, ballots[0].token);

    expect(view.eventTitle).toBe(event.title);
    expect(view.roundNumber).toBe(1);
    const expectedSuspectIds = suspects.map((s) => s.id).filter((id) => id !== ballots[0].participantId);
    expect(view.suspects.map((s) => s.id).sort()).toEqual(expectedSuspectIds.sort());
    expect(view.suspects.map((s) => s.id)).not.toContain(ballots[0].participantId);
  });

  it("rejects an unknown token", async () => {
    await expect(getBallotByToken(testPrisma, "not-a-real-token")).rejects.toThrow(BallotNotFoundError);
  });
});

describe("castVote", () => {
  it("records the vote and marks the ballot cast", async () => {
    const { ballots, suspects } = await buildLiveEvent(testPrisma);
    await castVote(testPrisma, ballots[0].token, suspects[1].id);

    const updated = await testPrisma.ballot.findUniqueOrThrow({ where: { id: ballots[0].id } });
    expect(updated.status).toBe("cast");
    expect(updated.votedSuspectId).toBe(suspects[1].id);
    expect(updated.castAt).not.toBeNull();
  });

  it("rejects voting twice on the same ballot", async () => {
    const { ballots, suspects } = await buildLiveEvent(testPrisma);
    await castVote(testPrisma, ballots[0].token, suspects[1].id);

    await expect(castVote(testPrisma, ballots[0].token, suspects[1].id)).rejects.toThrow(BallotAlreadyCastError);
  });

  it("rejects a suspect not eligible for the round", async () => {
    const { ballots } = await buildLiveEvent(testPrisma);
    await expect(castVote(testPrisma, ballots[0].token, 999999)).rejects.toThrow(ValidationError);
  });

  it("rejects voting for yourself", async () => {
    const { ballots } = await buildLiveEvent(testPrisma);
    await expect(castVote(testPrisma, ballots[0].token, ballots[0].participantId)).rejects.toThrow(ValidationError);
  });

  it("rejects voting after the round has closed", async () => {
    const { event, ballots, suspects } = await buildLiveEvent(testPrisma);
    await closeRound(testPrisma, event.id, 1);

    await expect(castVote(testPrisma, ballots[0].token, suspects[1].id)).rejects.toThrow(BallotExpiredError);
  });
});
