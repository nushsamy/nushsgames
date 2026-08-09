import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { testPrisma } from "../helpers/prismaTestClient.ts";
import { resetDatabase } from "../helpers/resetDb.ts";
import { buildStartedBee, buildParticipants, startRound } from "../helpers/factories.ts";
import { submitResponse, skipParticipant } from "../../src/services/responseService.ts";
import { getNextTurn } from "../../src/services/roundService.ts";
import {
  NotFoundError,
  ParticipantNotInBeeError,
  ParticipantNotEligibleError,
} from "../../src/errors/index.ts";

beforeEach(async () => {
  await resetDatabase(testPrisma);
});

afterAll(async () => {
  await testPrisma.$disconnect();
});

describe("submitResponse", () => {
  it("reports a correct response and keeps the participant active", async () => {
    const bee = await buildStartedBee(testPrisma, { roundWords: [["apple"]] });
    const [alice] = await buildParticipants(testPrisma, bee.id, 1);
    await startRound(testPrisma, bee.id);

    const response = await submitResponse(testPrisma, { beeId: bee.id, participantId: alice.id, userSpelling: "Apple" });
    expect(response.spelledCorrectly).toBe(true);
    expect(response.word).toBe("apple");

    const reloaded = await testPrisma.participant.findUniqueOrThrow({ where: { id: alice.id } });
    expect(reloaded.isActive).toBe(false);
    expect(reloaded.isEliminated).toBe(false);
    expect(reloaded.eliminatedRound).toBeNull();
  });

  it("is case-insensitive", async () => {
    const bee = await buildStartedBee(testPrisma, { roundWords: [["Necessary"]] });
    const [alice] = await buildParticipants(testPrisma, bee.id, 1);
    await startRound(testPrisma, bee.id);
    const response = await submitResponse(testPrisma, { beeId: bee.id, participantId: alice.id, userSpelling: "NECESSARY" });
    expect(response.spelledCorrectly).toBe(true);
  });

  it("eliminates the participant on an incorrect response", async () => {
    const bee = await buildStartedBee(testPrisma, { roundWords: [["apple"]] });
    const [alice] = await buildParticipants(testPrisma, bee.id, 1);
    await startRound(testPrisma, bee.id);

    const response = await submitResponse(testPrisma, { beeId: bee.id, participantId: alice.id, userSpelling: "appel" });
    expect(response.spelledCorrectly).toBe(false);

    const reloaded = await testPrisma.participant.findUniqueOrThrow({ where: { id: alice.id } });
    expect(reloaded.isActive).toBe(false);
    expect(reloaded.isEliminated).toBe(true);
    expect(reloaded.eliminatedRound).toBe(1);
  });

  it("rejects a second response from the same participant in the same round", async () => {
    const bee = await buildStartedBee(testPrisma, { roundWords: [["apple", "banana"], ["cherry", "date"]] });
    const [alice, bob] = await buildParticipants(testPrisma, bee.id, 2);
    await startRound(testPrisma, bee.id);
    await submitResponse(testPrisma, { beeId: bee.id, participantId: alice.id, userSpelling: "apple" });
    await expect(
      submitResponse(testPrisma, { beeId: bee.id, participantId: alice.id, userSpelling: "apple" }),
    ).rejects.toThrow(ParticipantNotEligibleError);
    // it should still be bob's turn, unaffected
    expect((await getNextTurn(testPrisma, bee.id))?.participant.id).toBe(bob.id);
  });

  it("rejects a response from an eliminated participant", async () => {
    const bee = await buildStartedBee(testPrisma, { roundWords: [["apple", "banana", "cherry"], ["date"]] });
    const [alice, bob, carol] = await buildParticipants(testPrisma, bee.id, 3);
    await startRound(testPrisma, bee.id);
    await submitResponse(testPrisma, { beeId: bee.id, participantId: alice.id, userSpelling: "wrong" });
    await submitResponse(testPrisma, { beeId: bee.id, participantId: bob.id, userSpelling: "banana" });
    await submitResponse(testPrisma, { beeId: bee.id, participantId: carol.id, userSpelling: "cherry" });

    await expect(
      submitResponse(testPrisma, { beeId: bee.id, participantId: alice.id, userSpelling: "apple" }),
    ).rejects.toThrow(ParticipantNotEligibleError);
  });

  it("rejects a response out of turn order", async () => {
    const bee = await buildStartedBee(testPrisma, { roundWords: [["apple", "banana"]] });
    const [, bob] = await buildParticipants(testPrisma, bee.id, 2);
    await startRound(testPrisma, bee.id);
    await expect(
      submitResponse(testPrisma, { beeId: bee.id, participantId: bob.id, userSpelling: "banana" }),
    ).rejects.toThrow(ParticipantNotEligibleError);
  });

  it("throws NotFoundError for an unknown participant", async () => {
    const bee = await buildStartedBee(testPrisma);
    await buildParticipants(testPrisma, bee.id, 1);
    await startRound(testPrisma, bee.id);
    await expect(
      submitResponse(testPrisma, {
        beeId: bee.id,
        participantId: 999999999,
        userSpelling: "apple",
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("throws ParticipantNotInBeeError for a participant from a different bee", async () => {
    const beeA = await buildStartedBee(testPrisma);
    const beeB = await buildStartedBee(testPrisma);
    const [alice] = await buildParticipants(testPrisma, beeA.id, 1);
    await startRound(testPrisma, beeA.id);
    await buildParticipants(testPrisma, beeB.id, 1);
    await startRound(testPrisma, beeB.id);
    await expect(
      submitResponse(testPrisma, { beeId: beeB.id, participantId: alice.id, userSpelling: "apple" }),
    ).rejects.toThrow(ParticipantNotInBeeError);
  });
});

describe("skipParticipant", () => {
  it("reports an empty-spelling response and eliminates the participant", async () => {
    const bee = await buildStartedBee(testPrisma, { roundWords: [["apple"]] });
    const [alice] = await buildParticipants(testPrisma, bee.id, 1);
    await startRound(testPrisma, bee.id);

    const response = await skipParticipant(testPrisma, bee.id, alice.id);
    expect(response.userSpelling).toBe("");
    expect(response.spelledCorrectly).toBe(false);

    const reloaded = await testPrisma.participant.findUniqueOrThrow({ where: { id: alice.id } });
    expect(reloaded.isActive).toBe(false);
    expect(reloaded.isEliminated).toBe(true);
    expect(reloaded.eliminatedRound).toBe(1);
  });
});
