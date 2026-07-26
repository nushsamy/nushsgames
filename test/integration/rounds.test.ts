import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { testPrisma } from "../helpers/prismaTestClient.ts";
import { resetDatabase } from "../helpers/resetDb.ts";
import { buildStartedBee, buildParticipants, answerCorrectly, answerIncorrectly } from "../helpers/factories.ts";
import { getNextTurn, isRoundComplete, getCurrentRoundWords, completeRoundAndProgress } from "../../src/services/roundService.ts";
import { RoundNotCompleteError } from "../../src/errors/index.ts";

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

    await answerIncorrectly(testPrisma, bee.id, alice.id);
    await answerCorrectly(testPrisma, bee.id, bob.id);
    await answerCorrectly(testPrisma, bee.id, carol.id);
    expect(await isRoundComplete(testPrisma, bee.id)).toBe(true);

    await completeRoundAndProgress(testPrisma, bee.id);

    // Round 2: alice was eliminated in round 1, so bob is next up.
    const turn = await getNextTurn(testPrisma, bee.id);
    expect(turn?.participant.id).toBe(bob.id);
  });
});

describe("completeRoundAndProgress", () => {
  it("throws RoundNotCompleteError if participants are still left to answer", async () => {
    const bee = await buildStartedBee(testPrisma);
    await buildParticipants(testPrisma, bee.id, 2);
    await expect(completeRoundAndProgress(testPrisma, bee.id)).rejects.toThrow(RoundNotCompleteError);
  });

  it("advances currentRound when more rounds remain and multiple participants are still active", async () => {
    const bee = await buildStartedBee(testPrisma, { roundWords: [["apple", "banana"], ["cherry", "date"]] });
    const [alice, bob] = await buildParticipants(testPrisma, bee.id, 2);
    await answerCorrectly(testPrisma, bee.id, alice.id);
    await answerCorrectly(testPrisma, bee.id, bob.id);

    const { bee: advanced, ended } = await completeRoundAndProgress(testPrisma, bee.id);
    expect(ended).toBe(false);
    expect(advanced.currentRound).toBe(2);
    expect(advanced.status).toBe("in_progress");
  });

  it("ends the bee when only one active participant remains", async () => {
    const bee = await buildStartedBee(testPrisma, { roundWords: [["apple", "banana"], ["cherry", "date"], ["eggplant", "fig"]] });
    const [alice, bob] = await buildParticipants(testPrisma, bee.id, 2);
    await answerIncorrectly(testPrisma, bee.id, alice.id);
    await answerCorrectly(testPrisma, bee.id, bob.id);

    const { bee: ended, ended: didEnd } = await completeRoundAndProgress(testPrisma, bee.id);
    expect(didEnd).toBe(true);
    expect(ended.status).toBe("completed");
  });

  it("ends the bee when the final round completes even if multiple participants remain active", async () => {
    const bee = await buildStartedBee(testPrisma, { roundWords: [["apple", "banana"]] });
    const [alice, bob] = await buildParticipants(testPrisma, bee.id, 2);
    await answerCorrectly(testPrisma, bee.id, alice.id);
    await answerCorrectly(testPrisma, bee.id, bob.id);

    const { bee: ended, ended: didEnd } = await completeRoundAndProgress(testPrisma, bee.id);
    expect(didEnd).toBe(true);
    expect(ended.status).toBe("completed");
  });
});
