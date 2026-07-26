import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { testPrisma } from "../helpers/prismaTestClient.ts";
import { resetDatabase } from "../helpers/resetDb.ts";
import { buildBee, buildStartedBee, createTestUser, DEFAULT_ROUND_WORDS } from "../helpers/factories.ts";
import { createBee, startBee, endBee, getBeeById } from "../../src/services/beeService.ts";
import { addRound, setRoundWords } from "../../src/services/roundService.ts";
import { ValidationError, NotFoundError, InvalidBeeStateError } from "../../src/errors/index.ts";

beforeEach(async () => {
  await resetDatabase(testPrisma);
});

afterAll(async () => {
  await testPrisma.$disconnect();
});

describe("createBee", () => {
  it("creates a bee in the created status with no gamekey and no rounds", async () => {
    const user = await createTestUser(testPrisma);
    const bee = await createBee(testPrisma, { userId: user.id, title: "Fresh Bee" });
    expect(bee.status).toBe("created");
    expect(bee.gamekey).toBeNull();
    expect(bee.currentRound).toBe(0);
    expect(bee.totalRounds).toBe(0);

    const rounds = await testPrisma.beeRound.findMany({ where: { beeId: bee.id } });
    expect(rounds).toHaveLength(0);
  });

  it("rejects an empty title", async () => {
    const user = await createTestUser(testPrisma);
    await expect(
      createBee(testPrisma, { userId: user.id, title: "   " }),
    ).rejects.toThrow(ValidationError);
  });
});

describe("addRound / setRoundWords", () => {
  it("adds sequential rounds and bumps totalRounds, with the round starting out wordless", async () => {
    const user = await createTestUser(testPrisma);
    const bee = await createBee(testPrisma, { userId: user.id, title: "Building" });

    const round1 = await addRound(testPrisma, bee.id);
    expect(round1.roundNumber).toBe(1);
    expect(round1.assignedWords).toEqual([]);

    const round2 = await addRound(testPrisma, bee.id);
    expect(round2.roundNumber).toBe(2);

    const reloaded = await getBeeById(testPrisma, bee.id);
    expect(reloaded.totalRounds).toBe(2);
  });

  it("sets a round's word list, overwriting whatever was there before", async () => {
    const bee = await buildBee(testPrisma, { roundWords: [] });
    const round = await addRound(testPrisma, bee.id);

    await setRoundWords(testPrisma, bee.id, round.roundNumber, ["a"]);
    await setRoundWords(testPrisma, bee.id, round.roundNumber, DEFAULT_ROUND_WORDS[0]);

    const reloaded = await testPrisma.beeRound.findUniqueOrThrow({ where: { id: round.id } });
    expect(reloaded.assignedWords).toEqual(DEFAULT_ROUND_WORDS[0]);
  });

  it("rejects an empty words array", async () => {
    const bee = await buildBee(testPrisma, { roundWords: [] });
    const round = await addRound(testPrisma, bee.id);
    await expect(setRoundWords(testPrisma, bee.id, round.roundNumber, [])).rejects.toThrow(ValidationError);
  });
});

describe("startBee", () => {
  it("generates a gamekey and moves to in_progress", async () => {
    const bee = await buildBee(testPrisma);
    const started = await startBee(testPrisma, bee.id);

    expect(started.status).toBe("in_progress");
    expect(started.currentRound).toBe(1);
    expect(started.gamekey).toMatch(/^BEE-/);
  });

  it("cannot be started twice", async () => {
    const bee = await buildStartedBee(testPrisma);
    await expect(startBee(testPrisma, bee.id)).rejects.toThrow(InvalidBeeStateError);
  });

  it("throws NotFoundError for an unknown bee", async () => {
    await expect(startBee(testPrisma, 999999999)).rejects.toThrow(NotFoundError);
  });

  it("rejects starting a bee with no rounds", async () => {
    const bee = await buildBee(testPrisma, { roundWords: [] });
    await expect(startBee(testPrisma, bee.id)).rejects.toThrow(ValidationError);
  });

  it("rejects starting a bee where a round has no words", async () => {
    const bee = await buildBee(testPrisma, { roundWords: [] });
    await addRound(testPrisma, bee.id);
    await expect(startBee(testPrisma, bee.id)).rejects.toThrow(ValidationError);
  });
});

describe("endBee", () => {
  it("moves an in_progress bee to completed", async () => {
    const bee = await buildStartedBee(testPrisma);
    const ended = await endBee(testPrisma, bee.id);
    expect(ended.status).toBe("completed");
  });

  it("keeps the gamekey resolvable after completion", async () => {
    const bee = await buildStartedBee(testPrisma);
    await endBee(testPrisma, bee.id);
    const reloaded = await getBeeById(testPrisma, bee.id);
    expect(reloaded.gamekey).toBe(bee.gamekey);
    expect(reloaded.status).toBe("completed");
  });

  it("cannot end a bee that hasn't started", async () => {
    const bee = await buildBee(testPrisma);
    await expect(endBee(testPrisma, bee.id)).rejects.toThrow(InvalidBeeStateError);
  });

  it("cannot end a bee twice", async () => {
    const bee = await buildStartedBee(testPrisma);
    await endBee(testPrisma, bee.id);
    await expect(endBee(testPrisma, bee.id)).rejects.toThrow(InvalidBeeStateError);
  });
});
