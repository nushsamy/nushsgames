import { describe, it, expect, beforeEach } from "vitest";
import { testPrisma } from "../helpers/prismaTestClient.ts";
import { resetDatabase } from "../helpers/resetDb.ts";
import { buildEvent, addRoundWithSuspects, createTestUser } from "../helpers/factories.ts";
import { createEvent, startEvent, deleteEvent } from "../../src/services/eventService.ts";
import { addSuspect, deleteSuspect } from "../../src/services/suspectService.ts";
import { addParticipant, deleteParticipant } from "../../src/services/participantService.ts";
import { addRound, setRoundSuspects, deleteRound, listRounds } from "../../src/services/roundService.ts";
import { ValidationError, InvalidEventStateError, DuplicateSuspectError, DuplicateParticipantError } from "../../src/errors/index.ts";

beforeEach(async () => {
  await resetDatabase(testPrisma);
});

describe("event lifecycle", () => {
  it("cannot start without suspects, participants, or rounds", async () => {
    const user = await createTestUser(testPrisma);
    const event = await createEvent(testPrisma, { userId: user.id, title: "Empty Mystery" });
    await expect(startEvent(testPrisma, event.id)).rejects.toThrow(ValidationError);
  });

  it("cannot start when a round has no suspects assigned", async () => {
    const { event } = await buildEvent(testPrisma);
    await addRound(testPrisma, event.id); // suspectIds left empty
    await expect(startEvent(testPrisma, event.id)).rejects.toThrow(ValidationError);
  });

  it("starts once suspects, participants, and a fully-configured round exist", async () => {
    const { event, suspects } = await buildEvent(testPrisma);
    await addRoundWithSuspects(testPrisma, event.id, suspects.map((s) => s.id));

    const started = await startEvent(testPrisma, event.id);
    expect(started.status).toBe("in_progress");
  });

  it("only allows deleting events still in \"created\"", async () => {
    const { event, suspects } = await buildEvent(testPrisma);
    await addRoundWithSuspects(testPrisma, event.id, suspects.map((s) => s.id));
    await startEvent(testPrisma, event.id);

    await expect(deleteEvent(testPrisma, event.id)).rejects.toThrow(InvalidEventStateError);
  });
});

describe("suspects", () => {
  it("rejects duplicate suspect names within the same event", async () => {
    const { event } = await buildEvent(testPrisma, { suspectNames: [] });
    await addSuspect(testPrisma, event.id, { name: "Butler" });
    await expect(addSuspect(testPrisma, event.id, { name: "Butler" })).rejects.toThrow(DuplicateSuspectError);
  });

  it("refuses to delete a suspect still assigned to a round", async () => {
    const { event, suspects } = await buildEvent(testPrisma);
    await addRoundWithSuspects(testPrisma, event.id, [suspects[0].id]);

    await expect(deleteSuspect(testPrisma, event.id, suspects[0].id)).rejects.toThrow(ValidationError);
  });
});

describe("participants", () => {
  it("rejects duplicate participant emails within the same event", async () => {
    const { event } = await buildEvent(testPrisma, { participants: [] });
    await addParticipant(testPrisma, event.id, { name: "Pat", email: "pat@example.com" });
    await expect(
      addParticipant(testPrisma, event.id, { name: "Pat Again", email: "PAT@example.com" }),
    ).rejects.toThrow(DuplicateParticipantError);
  });

  it("only allows adding/removing participants while the event is \"created\"", async () => {
    const { event, suspects, participants } = await buildEvent(testPrisma);
    await addRoundWithSuspects(testPrisma, event.id, suspects.map((s) => s.id));
    await startEvent(testPrisma, event.id);

    await expect(addParticipant(testPrisma, event.id, { name: "Late", email: "late@example.com" })).rejects.toThrow(
      InvalidEventStateError,
    );
    await expect(deleteParticipant(testPrisma, event.id, participants[0].id)).rejects.toThrow(InvalidEventStateError);
  });
});

describe("rounds", () => {
  it("renumbers subsequent rounds after a deletion", async () => {
    const { event, suspects } = await buildEvent(testPrisma);
    const suspectIds = suspects.map((s) => s.id);
    await addRoundWithSuspects(testPrisma, event.id, suspectIds);
    await addRoundWithSuspects(testPrisma, event.id, suspectIds);
    await addRoundWithSuspects(testPrisma, event.id, suspectIds);

    await deleteRound(testPrisma, event.id, 2);

    const rounds = await listRounds(testPrisma, event.id);
    expect(rounds.map((r) => r.roundNumber)).toEqual([1, 2]);
  });

  it("rejects suspect ids that don't belong to the event", async () => {
    const { event } = await buildEvent(testPrisma, { suspectNames: [] });
    const round = await addRound(testPrisma, event.id);
    await expect(setRoundSuspects(testPrisma, event.id, round.roundNumber, [999999])).rejects.toThrow(ValidationError);
  });
});
