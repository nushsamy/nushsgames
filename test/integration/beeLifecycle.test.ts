import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { testPrisma } from "../helpers/prismaTestClient.ts";
import { resetDatabase } from "../helpers/resetDb.ts";
import { buildBee, buildStartedBee, createTestUser, DEFAULT_ROUND_WORDS } from "../helpers/factories.ts";
import { createBee, startBee, endBee, getBeeById } from "../../src/services/beeService.ts";
import { ValidationError, NotFoundError, InvalidBeeStateError } from "../../src/errors/index.ts";

beforeEach(async () => {
  await resetDatabase(testPrisma);
});

afterAll(async () => {
  await testPrisma.$disconnect();
});

describe("createBee", () => {
  it("creates a bee in the created status with no gamekey, and its rounds up front", async () => {
    const bee = await buildBee(testPrisma, { totalRounds: 2, roundWords: DEFAULT_ROUND_WORDS });
    expect(bee.status).toBe("created");
    expect(bee.gamekey).toBeNull();
    expect(bee.currentRound).toBe(0);

    const rounds = await testPrisma.beeRound.findMany({ where: { beeId: bee.id }, orderBy: { roundNumber: "asc" } });
    expect(rounds).toHaveLength(2);
    expect(rounds[0].assignedWords).toEqual(DEFAULT_ROUND_WORDS[0]);
    expect(rounds[1].assignedWords).toEqual(DEFAULT_ROUND_WORDS[1]);
  });

  it("rejects an empty title", async () => {
    const user = await createTestUser(testPrisma);
    await expect(
      createBee(testPrisma, {
        userId: user.id,
        title: "   ",
        totalRounds: 1,
        roundWords: [["a"]],
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("rejects a roundWords list that doesn't match totalRounds", async () => {
    const user = await createTestUser(testPrisma);
    await expect(
      createBee(testPrisma, {
        userId: user.id,
        title: "Too Few Rounds",
        totalRounds: 3,
        roundWords: [["a"], ["b"]],
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("rejects a round with no words", async () => {
    const user = await createTestUser(testPrisma);
    await expect(
      createBee(testPrisma, {
        userId: user.id,
        title: "Empty Round",
        totalRounds: 2,
        roundWords: [["a"], []],
      }),
    ).rejects.toThrow(ValidationError);
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
