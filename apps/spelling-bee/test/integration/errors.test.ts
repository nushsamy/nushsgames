import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { testPrisma } from "../helpers/prismaTestClient.ts";
import { resetDatabase } from "../helpers/resetDb.ts";
import { buildBee, buildStartedBee, buildParticipants, startRound } from "../helpers/factories.ts";
import { submitResponse } from "../../src/services/responseService.ts";
import { completeRoundAndProgress } from "../../src/services/roundService.ts";
import { InvalidBeeStateError } from "../../src/errors/index.ts";

beforeEach(async () => {
  await resetDatabase(testPrisma);
});

afterAll(async () => {
  await testPrisma.$disconnect();
});

describe("operating on a bee in the wrong state", () => {
  it("cannot submit a response to a bee that has not started", async () => {
    const bee = await buildBee(testPrisma, { roundWords: [["apple"]] });
    await expect(
      submitResponse(testPrisma, {
        beeId: bee.id,
        participantId: 999999999,
        userSpelling: "apple",
      }),
    ).rejects.toThrow(InvalidBeeStateError);
  });

  it("cannot submit a response to a completed bee", async () => {
    const bee = await buildStartedBee(testPrisma, { roundWords: [["apple"]] });
    const [alice] = await buildParticipants(testPrisma, bee.id, 1);
    await startRound(testPrisma, bee.id);
    await submitResponse(testPrisma, { beeId: bee.id, participantId: alice.id, userSpelling: "apple" });
    await completeRoundAndProgress(testPrisma, bee.id); // only 1 participant -> ends immediately

    await expect(
      submitResponse(testPrisma, { beeId: bee.id, participantId: alice.id, userSpelling: "apple" }),
    ).rejects.toThrow(InvalidBeeStateError);
  });

  it("cannot complete a round for a bee that has not started", async () => {
    const bee = await buildBee(testPrisma, { roundWords: [["apple"]] });
    await expect(completeRoundAndProgress(testPrisma, bee.id)).rejects.toThrow(InvalidBeeStateError);
  });
});
