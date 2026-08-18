import { Router } from "express";
import type { PrismaClient } from "../../../generated/prisma/client.ts";
import { requireAuth } from "@nushsgames/shared-auth";
import { loadEventParam } from "../middleware/ownership.ts";
import { createEvent, updateEvent, startEvent, endEvent, deleteEvent } from "../../services/eventService.ts";
import { addSuspect, listSuspects, updateSuspect, deleteSuspect } from "../../services/suspectService.ts";
import {
  addParticipant,
  listParticipants,
  deleteParticipant,
  setAttendance,
} from "../../services/participantService.ts";
import { addRound, setRoundSuspects, listRounds, deleteRound } from "../../services/roundService.ts";
import { openRound, closeRound, getRoundTally, getResendableBallot } from "../../services/roundLifecycleService.ts";
import { sendRoundBallots, sendBallotEmail } from "../../services/emailService.ts";
import { asString, asEmail, asPositiveInt, asPositiveIntArray, asIntArray } from "../validate.ts";

export function createEventsRouter(prisma: PrismaClient): Router {
  const router = Router();
  router.use(requireAuth);
  router.param("eventId", loadEventParam(prisma));

  router.post("/", async (req, res) => {
    const title = asString(req.body?.title, "title");
    const event = await createEvent(prisma, { userId: req.userId!, title });
    res.status(201).json(event);
  });

  router.get("/", async (req, res) => {
    const events = await prisma.mysteryEvent.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json(events);
  });

  router.get("/:eventId", async (req, res) => {
    res.status(200).json(req.event);
  });

  router.patch("/:eventId", async (req, res) => {
    const updates: { title?: string } = {};
    if (req.body?.title !== undefined) {
      updates.title = asString(req.body.title, "title");
    }
    const event = await updateEvent(prisma, req.event!.id, updates);
    res.status(200).json(event);
  });

  router.delete("/:eventId", async (req, res) => {
    await deleteEvent(prisma, req.event!.id);
    res.status(204).send();
  });

  router.post("/:eventId/start", async (req, res) => {
    const event = await startEvent(prisma, req.event!.id);
    res.status(200).json(event);
  });

  router.post("/:eventId/end", async (req, res) => {
    const event = await endEvent(prisma, req.event!.id);
    res.status(200).json(event);
  });

  // --- Suspects ---

  router.get("/:eventId/suspects", async (req, res) => {
    const suspects = await listSuspects(prisma, req.event!.id);
    res.status(200).json(suspects);
  });

  router.post("/:eventId/suspects", async (req, res) => {
    const name = asString(req.body?.name, "name");
    const description = req.body?.description !== undefined ? asString(req.body.description, "description") : undefined;
    const suspect = await addSuspect(prisma, req.event!.id, { name, description });
    res.status(201).json(suspect);
  });

  router.patch("/:eventId/suspects/:suspectId", async (req, res) => {
    const suspectId = asPositiveInt(Number(req.params.suspectId), "suspectId");
    const updates: { name?: string; description?: string } = {};
    if (req.body?.name !== undefined) updates.name = asString(req.body.name, "name");
    if (req.body?.description !== undefined) updates.description = asString(req.body.description, "description");
    const suspect = await updateSuspect(prisma, req.event!.id, suspectId, updates);
    res.status(200).json(suspect);
  });

  router.delete("/:eventId/suspects/:suspectId", async (req, res) => {
    const suspectId = asPositiveInt(Number(req.params.suspectId), "suspectId");
    await deleteSuspect(prisma, req.event!.id, suspectId);
    res.status(204).send();
  });

  // --- Participants ---

  router.get("/:eventId/participants", async (req, res) => {
    const participants = await listParticipants(prisma, req.event!.id);
    res.status(200).json(participants);
  });

  router.post("/:eventId/participants", async (req, res) => {
    const name = asString(req.body?.name, "name");
    const email = asEmail(req.body?.email, "email");
    const participant = await addParticipant(prisma, req.event!.id, { name, email });
    res.status(201).json(participant);
  });

  router.delete("/:eventId/participants/:participantId", async (req, res) => {
    const participantId = asPositiveInt(Number(req.params.participantId), "participantId");
    await deleteParticipant(prisma, req.event!.id, participantId);
    res.status(204).send();
  });

  router.put("/:eventId/attendance", async (req, res) => {
    const presentParticipantIds = asIntArray(req.body?.presentParticipantIds, "presentParticipantIds");
    const participants = await setAttendance(prisma, req.event!.id, presentParticipantIds);
    res.status(200).json(participants);
  });

  // --- Rounds ---

  router.get("/:eventId/rounds", async (req, res) => {
    const rounds = await listRounds(prisma, req.event!.id);
    res.status(200).json(rounds);
  });

  router.post("/:eventId/rounds", async (req, res) => {
    const round = await addRound(prisma, req.event!.id);
    res.status(201).json(round);
  });

  router.put("/:eventId/rounds/:roundNumber/suspects", async (req, res) => {
    const roundNumber = asPositiveInt(Number(req.params.roundNumber), "roundNumber");
    const suspectIds = asPositiveIntArray(req.body?.suspectIds, "suspectIds");
    const round = await setRoundSuspects(prisma, req.event!.id, roundNumber, suspectIds);
    res.status(200).json(round);
  });

  router.delete("/:eventId/rounds/:roundNumber", async (req, res) => {
    const roundNumber = asPositiveInt(Number(req.params.roundNumber), "roundNumber");
    const event = await deleteRound(prisma, req.event!.id, roundNumber);
    res.status(200).json(event);
  });

  router.post("/:eventId/rounds/:roundNumber/open", async (req, res) => {
    const roundNumber = asPositiveInt(Number(req.params.roundNumber), "roundNumber");
    const { round } = await openRound(prisma, req.event!.id, roundNumber);
    const emailResult = await sendRoundBallots(prisma, req.event!.id, roundNumber);
    res.status(200).json({ round, email: emailResult });
  });

  router.post("/:eventId/rounds/:roundNumber/close", async (req, res) => {
    const roundNumber = asPositiveInt(Number(req.params.roundNumber), "roundNumber");
    const round = await closeRound(prisma, req.event!.id, roundNumber);
    res.status(200).json(round);
  });

  router.get("/:eventId/rounds/:roundNumber/tally", async (req, res) => {
    const roundNumber = asPositiveInt(Number(req.params.roundNumber), "roundNumber");
    const tally = await getRoundTally(prisma, req.event!.id, roundNumber);
    res.status(200).json(tally);
  });

  // --- Ballots ---

  router.post("/:eventId/ballots/:ballotId/resend", async (req, res) => {
    const { ballot, round } = await getResendableBallot(prisma, req.event!.id, req.params.ballotId);
    const participant = await prisma.mysteryParticipant.findUniqueOrThrow({ where: { id: ballot.participantId } });
    const event = req.event!;
    const result = await sendBallotEmail(ballot, participant, round, event);
    await prisma.ballot.update({ where: { id: ballot.id }, data: { emailError: result.ok ? null : result.error } });
    res.status(200).json({ ok: result.ok, error: result.error ?? null });
  });

  return router;
}
