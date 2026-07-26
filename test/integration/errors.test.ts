import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { testPrisma } from "../helpers/prismaTestClient.ts";
import { resetDatabase } from "../helpers/resetDb.ts";
import { buildStartedBee, buildParticipants, createTestUser } from "../helpers/factories.ts";
import { createBee } from "../../src/services/beeService.ts";
import { submitResponse } from "../../src/services/responseService.ts";
import { completeRoundAndProgress } from "../../src/services/roundService.ts";
import { ValidationError, InvalidBeeStateError } from "../../src/errors/index.ts";

beforeEach(async () => {
  await resetDatabase(testPrisma);
});

afterAll(async () => {
  await testPrisma.$disconnect();
});

describe("createBee validation", () => {
  it("rejects zero or negative totalRounds", async () => {
    const user = await createTestUser(testPrisma);
    await expect(
      createBee(testPrisma, { userId: user.id, title: "X", totalRounds: 0, roundWords: [] }),
    ).rejects.toThrow(ValidationError);
    await expect(
      createBee(testPrisma, { userId: user.id, title: "X", totalRounds: -1, roundWords: [] }),
    ).rejects.toThrow(ValidationError);
  });

  it("rejects a roundWords count that doesn't match totalRounds", async () => {
    const user = await createTestUser(testPrisma);
    await expect(
      createBee(testPrisma, { userId: user.id, title: "X", totalRounds: 2, roundWords: [["a"]] }),
    ).rejects.toThrow(ValidationError);
  });

  it("rejects a non-integer round count", async () => {
    const user = await createTestUser(testPrisma);
    await expect(
      createBee(testPrisma, { userId: user.id, title: "X", totalRounds: 1.5, roundWords: [["a"]] }),
    ).rejects.toThrow(ValidationError);
  });
});

describe("operating on a bee in the wrong state", () => {
  it("cannot submit a response to a bee that has not started", async () => {
    const user = await createTestUser(testPrisma);
    const bee = await createBee(testPrisma, {
      userId: user.id,
      title: "Not started",
      totalRounds: 1,
      roundWords: [["apple"]],
    });
    await expect(
      submitResponse(testPrisma, {
        beeId: bee.id,
        participantId: 999999999,
        userSpelling: "apple",
      }),
    ).rejects.toThrow(InvalidBeeStateError);
  });

  it("cannot submit a response to a completed bee", async () => {
    const bee = await buildStartedBee(testPrisma, { totalRounds: 1, roundWords: [["apple"]] });
    const [alice] = await buildParticipants(testPrisma, bee.id, 1);
    await submitResponse(testPrisma, { beeId: bee.id, participantId: alice.id, userSpelling: "apple" });
    await completeRoundAndProgress(testPrisma, bee.id); // only 1 participant -> ends immediately

    await expect(
      submitResponse(testPrisma, { beeId: bee.id, participantId: alice.id, userSpelling: "apple" }),
    ).rejects.toThrow(InvalidBeeStateError);
  });

  it("cannot complete a round for a bee that has not started", async () => {
    const user = await createTestUser(testPrisma);
    const bee = await createBee(testPrisma, {
      userId: user.id,
      title: "Not started",
      totalRounds: 1,
      roundWords: [["apple"]],
    });
    await expect(completeRoundAndProgress(testPrisma, bee.id)).rejects.toThrow(InvalidBeeStateError);
  });
});
