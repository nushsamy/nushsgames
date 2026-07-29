import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { testPrisma } from "../helpers/prismaTestClient.ts";
import { resetDatabase } from "../helpers/resetDb.ts";
import { buildStartedBee, buildParticipants, answerCorrectly, playOutRound, startRound } from "../helpers/factories.ts";
import { completeRoundAndProgress } from "../../src/services/roundService.ts";
import { getStandings } from "../../src/services/standingsService.ts";

beforeEach(async () => {
  await resetDatabase(testPrisma);
});

afterAll(async () => {
  await testPrisma.$disconnect();
});

describe("getStandings", () => {
  it("reports no winner while the bee is still in progress", async () => {
    const bee = await buildStartedBee(testPrisma, { roundWords: [["apple", "banana"], ["cherry", "date"]] });
    const [alice, bob] = await buildParticipants(testPrisma, bee.id, 2);
    await startRound(testPrisma, bee.id);
    await answerCorrectly(testPrisma, bee.id, alice.id);
    await answerCorrectly(testPrisma, bee.id, bob.id);

    const standings = await getStandings(testPrisma, bee.id);
    expect(standings.winner).toBeNull();
    expect(standings.active.map((p) => p.id).sort()).toEqual([alice.id, bob.id].sort());
    expect(standings.eliminated).toHaveLength(0);
  });

  it("plays a full multi-round bee down to a single winner", async () => {
    const bee = await buildStartedBee(testPrisma, {
      roundWords: [["apple", "banana", "cherry"], ["date", "eggplant"], ["fig"]],
    });
    const [alice, bob, carol] = await buildParticipants(testPrisma, bee.id, 3);
    await startRound(testPrisma, bee.id);

    // Round 1: carol is eliminated.
    await playOutRound(testPrisma, bee.id, { incorrectIds: new Set([carol.id]) });
    let progress = await completeRoundAndProgress(testPrisma, bee.id);
    expect(progress.ended).toBe(false);

    // Round 2: bob is eliminated, alice remains the sole active participant.
    await startRound(testPrisma, bee.id);
    await playOutRound(testPrisma, bee.id, { incorrectIds: new Set([bob.id]) });
    progress = await completeRoundAndProgress(testPrisma, bee.id);
    expect(progress.ended).toBe(true);
    expect(progress.bee.status).toBe("completed");

    const standings = await getStandings(testPrisma, bee.id);
    expect(standings.winner?.id).toBe(alice.id);
    expect(standings.active).toHaveLength(1);
    expect(standings.eliminated.map((p) => p.id).sort()).toEqual([bob.id, carol.id].sort());

    const findById = (id: number) => standings.eliminated.find((p) => p.id === id);
    expect(findById(carol.id)?.eliminatedRound).toBe(1);
    expect(findById(bob.id)?.eliminatedRound).toBe(2);
    expect(standings.active[0].eliminatedRound).toBeNull();
  });

  it("reports co-finalists with no winner when the last round ends with multiple active participants", async () => {
    const bee = await buildStartedBee(testPrisma, { roundWords: [["apple", "banana"]] });
    const [alice, bob] = await buildParticipants(testPrisma, bee.id, 2);
    await startRound(testPrisma, bee.id);
    await answerCorrectly(testPrisma, bee.id, alice.id);
    await answerCorrectly(testPrisma, bee.id, bob.id);
    await completeRoundAndProgress(testPrisma, bee.id);

    const standings = await getStandings(testPrisma, bee.id);
    expect(standings.winner).toBeNull();
    expect(standings.active).toHaveLength(2);
  });
});
