import { describe, it, expect, beforeEach } from "vitest";
import { testPrisma } from "../helpers/prismaTestClient.ts";
import { resetDatabase } from "../helpers/resetDb.ts";
import { buildEvent, createTestUser } from "../helpers/factories.ts";
import { createEvent, startEvent, deleteEvent } from "../../src/services/eventService.ts";
import { addParticipant, deleteParticipant } from "../../src/services/participantService.ts";
import { addRound, deleteRound, listRounds } from "../../src/services/roundService.ts";
import { ValidationError, InvalidEventStateError, DuplicateSuspectError, DuplicateParticipantError } from "../../src/errors/index.ts";

beforeEach(async () => {
  await resetDatabase(testPrisma);
});

describe("event lifecycle", () => {
  it("cannot start without participants or rounds", async () => {
    const user = await createTestUser(testPrisma);
    const event = await createEvent(testPrisma, { userId: user.id, title: "Empty Mystery" });
    await expect(startEvent(testPrisma, event.id)).rejects.toThrow(ValidationError);
  });

  it("starts once participants and a round exist -- every participant is a suspect automatically", async () => {
    const { event } = await buildEvent(testPrisma);
    await addRound(testPrisma, event.id);

    const started = await startEvent(testPrisma, event.id);
    expect(started.status).toBe("in_progress");
  });

  it("only allows deleting events still in \"created\"", async () => {
    const { event } = await buildEvent(testPrisma);
    await addRound(testPrisma, event.id);
    await startEvent(testPrisma, event.id);

    await expect(deleteEvent(testPrisma, event.id)).rejects.toThrow(InvalidEventStateError);
  });
});

describe("participants (as suspects)", () => {
  it("rejects duplicate character names within the same event", async () => {
    const { event } = await buildEvent(testPrisma, { participants: [] });
    await addParticipant(testPrisma, event.id, { name: "Pat", email: "pat@example.com", characterName: "Butler" });
    await expect(
      addParticipant(testPrisma, event.id, { name: "Sam", email: "sam@example.com", characterName: "Butler" }),
    ).rejects.toThrow(DuplicateSuspectError);
  });
});

describe("participants", () => {
  it("rejects duplicate participant emails within the same event", async () => {
    const { event } = await buildEvent(testPrisma, { participants: [] });
    await addParticipant(testPrisma, event.id, { name: "Pat", email: "pat@example.com", characterName: "Butler" });
    await expect(
      addParticipant(testPrisma, event.id, { name: "Pat Again", email: "PAT@example.com", characterName: "Maid" }),
    ).rejects.toThrow(DuplicateParticipantError);
  });

  it("only allows adding/removing participants while the event is \"created\"", async () => {
    const { event, participants } = await buildEvent(testPrisma);
    await addRound(testPrisma, event.id);
    await startEvent(testPrisma, event.id);

    await expect(
      addParticipant(testPrisma, event.id, { name: "Late", email: "late@example.com", characterName: "Latecomer" }),
    ).rejects.toThrow(InvalidEventStateError);
    await expect(deleteParticipant(testPrisma, event.id, participants[0].id)).rejects.toThrow(InvalidEventStateError);
  });
});

describe("rounds", () => {
  it("renumbers subsequent rounds after a deletion", async () => {
    const { event } = await buildEvent(testPrisma);
    await addRound(testPrisma, event.id);
    await addRound(testPrisma, event.id);
    await addRound(testPrisma, event.id);

    await deleteRound(testPrisma, event.id, 2);

    const rounds = await listRounds(testPrisma, event.id);
    expect(rounds.map((r) => r.roundNumber)).toEqual([1, 2]);
  });
});
