import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { testPrisma } from "../helpers/prismaTestClient.ts";
import { resetDatabase } from "../helpers/resetDb.ts";
import { buildBee, buildStartedBee } from "../helpers/factories.ts";
import { addParticipant, reactivateParticipant, listParticipants } from "../../src/services/participantService.ts";
import { ValidationError, NotFoundError, InvalidBeeStateError, DuplicateParticipantError } from "../../src/errors/index.ts";

beforeEach(async () => {
  await resetDatabase(testPrisma);
});

afterAll(async () => {
  await testPrisma.$disconnect();
});

describe("addParticipant", () => {
  it("adds a participant as active and not eliminated", async () => {
    const bee = await buildStartedBee(testPrisma);
    const p = await addParticipant(testPrisma, bee.id, "Alice");
    expect(p.isActive).toBe(true);
    expect(p.isEliminated).toBe(false);
    expect(p.name).toBe("Alice");
  });

  it("rejects an empty name", async () => {
    const bee = await buildStartedBee(testPrisma);
    await expect(addParticipant(testPrisma, bee.id, "   ")).rejects.toThrow(ValidationError);
  });

  it("rejects duplicate names case-insensitively", async () => {
    const bee = await buildStartedBee(testPrisma);
    await addParticipant(testPrisma, bee.id, "Alice");
    await expect(addParticipant(testPrisma, bee.id, "alice")).rejects.toThrow(DuplicateParticipantError);
    await expect(addParticipant(testPrisma, bee.id, "  ALICE  ")).rejects.toThrow(DuplicateParticipantError);
  });

  it("allows the same name in a different bee", async () => {
    const beeA = await buildStartedBee(testPrisma);
    const beeB = await buildStartedBee(testPrisma);
    await addParticipant(testPrisma, beeA.id, "Alice");
    await expect(addParticipant(testPrisma, beeB.id, "Alice")).resolves.toBeTruthy();
  });

  it("cannot add a participant to a bee that hasn't started", async () => {
    const bee = await buildBee(testPrisma);
    await expect(addParticipant(testPrisma, bee.id, "Alice")).rejects.toThrow(InvalidBeeStateError);
  });

  it("cannot add a participant to a completed bee", async () => {
    const bee = await buildStartedBee(testPrisma);
    await testPrisma.spellingBee.update({ where: { id: bee.id }, data: { status: "completed" } });
    await expect(addParticipant(testPrisma, bee.id, "Alice")).rejects.toThrow(InvalidBeeStateError);
  });
});

describe("reactivateParticipant", () => {
  it("resets an eliminated participant back to active", async () => {
    const bee = await buildStartedBee(testPrisma);
    const p = await addParticipant(testPrisma, bee.id, "Alice");
    await testPrisma.participant.update({ where: { id: p.id }, data: { isActive: false, isEliminated: true } });

    const reactivated = await reactivateParticipant(testPrisma, p.id);
    expect(reactivated.isActive).toBe(true);
    expect(reactivated.isEliminated).toBe(false);
  });

  it("throws NotFoundError for an unknown participant", async () => {
    await expect(reactivateParticipant(testPrisma, 999999999)).rejects.toThrow(NotFoundError);
  });
});

describe("listParticipants", () => {
  it("splits participants into active and eliminated", async () => {
    const bee = await buildStartedBee(testPrisma);
    const alice = await addParticipant(testPrisma, bee.id, "Alice");
    await addParticipant(testPrisma, bee.id, "Bob");
    await testPrisma.participant.update({ where: { id: alice.id }, data: { isActive: false, isEliminated: true } });

    const { active, eliminated } = await listParticipants(testPrisma, bee.id);
    expect(active.map((p) => p.name)).toEqual(["Bob"]);
    expect(eliminated.map((p) => p.name)).toEqual(["Alice"]);
  });
});
