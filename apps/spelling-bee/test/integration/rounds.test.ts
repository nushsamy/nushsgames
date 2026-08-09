import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { testPrisma } from "../helpers/prismaTestClient.ts";
import { resetDatabase } from "../helpers/resetDb.ts";
import { buildStartedBee, buildParticipants, answerCorrectly, answerIncorrectly, startRound } from "../helpers/factories.ts";
import { getNextTurn, isRoundComplete, getCurrentRoundWords, completeRoundAndProgress } from "../../src/services/roundService.ts";
import { RoundNotCompleteError, ValidationError, InvalidBeeStateError, RoundInProgressError } from "../../src/errors/index.ts";

beforeEach(async () => {
  await resetDatabase(testPrisma);
});

afterAll(async () => {
  await testPrisma.$disconnect();
});

describe("getNextTurn / isRoundComplete", () => {
  it("returns participants in id order with the round's first words", async () => {
    const bee = await buildStartedBee(testPrisma, { roundWords: [["apple", "banana"]] });
    const [alice, bob] = await buildParticipants(testPrisma, bee.id, 2);
    await startRound(testPrisma, bee.id);

    const words = await getCurrentRoundWords(testPrisma, bee.id);
    expect(words).toEqual(["apple", "banana"]);

    const turn1 = await getNextTurn(testPrisma, bee.id);
    expect(turn1?.participant.id).toBe(alice.id);
    expect(turn1?.word).toBe("apple");

    await answerCorrectly(testPrisma, bee.id, alice.id);

    const turn2 = await getNextTurn(testPrisma, bee.id);
    expect(turn2?.participant.id).toBe(bob.id);
    expect(turn2?.word).toBe("banana");

    expect(await isRoundComplete(testPrisma, bee.id)).toBe(false);
    await answerCorrectly(testPrisma, bee.id, bob.id);
    expect(await isRoundComplete(testPrisma, bee.id)).toBe(true);
    expect(await getNextTurn(testPrisma, bee.id)).toBeNull();
  });

  it("cycles words via modulo when there are more turns than words in the round", async () => {
    const bee = await buildStartedBee(testPrisma, { roundWords: [["apple", "banana"]] });
    const [alice, bob, carol] = await buildParticipants(testPrisma, bee.id, 3);
    await startRound(testPrisma, bee.id);

    expect((await getNextTurn(testPrisma, bee.id))?.word).toBe("apple");
    await answerCorrectly(testPrisma, bee.id, alice.id);
    expect((await getNextTurn(testPrisma, bee.id))?.word).toBe("banana");
    await answerCorrectly(testPrisma, bee.id, bob.id);
    expect((await getNextTurn(testPrisma, bee.id))?.word).toBe("apple");
    await answerCorrectly(testPrisma, bee.id, carol.id);
  });

  it("skips eliminated participants when computing the next turn", async () => {
    const bee = await buildStartedBee(testPrisma, { roundWords: [["apple", "banana", "cherry"], ["date"]] });
    const [alice, bob, carol] = await buildParticipants(testPrisma, bee.id, 3);
    await startRound(testPrisma, bee.id);

    await answerIncorrectly(testPrisma, bee.id, alice.id);
    await answerCorrectly(testPrisma, bee.id, bob.id);
    await answerCorrectly(testPrisma, bee.id, carol.id);
    expect(await isRoundComplete(testPrisma, bee.id)).toBe(true);

    await completeRoundAndProgress(testPrisma, bee.id);

    // Round 2: alice was eliminated in round 1, so bob is next up.
    const turn = await getNextTurn(testPrisma, bee.id);
    expect(turn?.participant.id).toBe(bob.id);

    const reloadedAlice = await testPrisma.participant.findUniqueOrThrow({ where: { id: alice.id } });
    expect(reloadedAlice.eliminatedRound).toBe(1);
  });
});

describe("completeRoundAndProgress", () => {
  it("throws RoundNotCompleteError if participants are still left to answer", async () => {
    const bee = await buildStartedBee(testPrisma);
    await buildParticipants(testPrisma, bee.id, 2);
    await startRound(testPrisma, bee.id);
    await expect(completeRoundAndProgress(testPrisma, bee.id)).rejects.toThrow(RoundNotCompleteError);
  });

  it("advances currentRound when more rounds remain and multiple participants are still active", async () => {
    const bee = await buildStartedBee(testPrisma, { roundWords: [["apple", "banana"], ["cherry", "date"]] });
    const [alice, bob] = await buildParticipants(testPrisma, bee.id, 2);
    await startRound(testPrisma, bee.id);
    await answerCorrectly(testPrisma, bee.id, alice.id);
    await answerCorrectly(testPrisma, bee.id, bob.id);

    const { bee: advanced, ended } = await completeRoundAndProgress(testPrisma, bee.id);
    expect(ended).toBe(false);
    expect(advanced.currentRound).toBe(2);
    expect(advanced.status).toBe("in_progress");
    expect(advanced.roundStarted).toBe(false);
  });

  it("ends the bee when only one active participant remains", async () => {
    const bee = await buildStartedBee(testPrisma, { roundWords: [["apple", "banana"], ["cherry", "date"], ["eggplant", "fig"]] });
    const [alice, bob] = await buildParticipants(testPrisma, bee.id, 2);
    await startRound(testPrisma, bee.id);
    await answerIncorrectly(testPrisma, bee.id, alice.id);
    await answerCorrectly(testPrisma, bee.id, bob.id);

    const { bee: ended, ended: didEnd } = await completeRoundAndProgress(testPrisma, bee.id);
    expect(didEnd).toBe(true);
    expect(ended.status).toBe("completed");
  });

  it("ends the bee when the final round completes even if multiple participants remain active", async () => {
    const bee = await buildStartedBee(testPrisma, { roundWords: [["apple", "banana"]] });
    const [alice, bob] = await buildParticipants(testPrisma, bee.id, 2);
    await startRound(testPrisma, bee.id);
    await answerCorrectly(testPrisma, bee.id, alice.id);
    await answerCorrectly(testPrisma, bee.id, bob.id);

    const { bee: ended, ended: didEnd } = await completeRoundAndProgress(testPrisma, bee.id);
    expect(didEnd).toBe(true);
    expect(ended.status).toBe("completed");
  });
});

describe("startRound", () => {
  it("throws ValidationError if no participants have been added", async () => {
    const bee = await buildStartedBee(testPrisma);
    await expect(startRound(testPrisma, bee.id)).rejects.toThrow(ValidationError);
  });

  it("throws InvalidBeeStateError if the round has already started", async () => {
    const bee = await buildStartedBee(testPrisma);
    await buildParticipants(testPrisma, bee.id, 1);
    await startRound(testPrisma, bee.id);
    await expect(startRound(testPrisma, bee.id)).rejects.toThrow(InvalidBeeStateError);
  });

  it("marks the bee's round as started and returns the first turn", async () => {
    const bee = await buildStartedBee(testPrisma, { roundWords: [["apple"]] });
    const [alice] = await buildParticipants(testPrisma, bee.id, 1);

    const { bee: started, nextTurn } = await startRound(testPrisma, bee.id);
    expect(started.roundStarted).toBe(true);
    expect(nextTurn.participant.id).toBe(alice.id);
  });

  it("blocks submitResponse before the round has been explicitly started", async () => {
    const bee = await buildStartedBee(testPrisma);
    const [alice] = await buildParticipants(testPrisma, bee.id, 1);
    await expect(answerCorrectly(testPrisma, bee.id, alice.id)).rejects.toThrow(InvalidBeeStateError);
  });

  it("blocks adding participants once the round has started", async () => {
    const bee = await buildStartedBee(testPrisma);
    await buildParticipants(testPrisma, bee.id, 1);
    await startRound(testPrisma, bee.id);
    await expect(buildParticipants(testPrisma, bee.id, 1, "Late")).rejects.toThrow(RoundInProgressError);
  });
});
