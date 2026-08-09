import { Router } from "express";
import type { PrismaClient } from "../../../generated/prisma/client.ts";
import type { Server as SocketIOServer } from "socket.io";
import { requireAuth } from "@nushsgames/shared-auth";
import { loadBeeParam } from "../middleware/ownership.ts";
import { createBee, startBee, endBee, reopenBee, updateBee, deleteBee } from "../../services/beeService.ts";
import { addParticipant, listParticipants } from "../../services/participantService.ts";
import {
  getNextTurn,
  startRound,
  completeRoundAndProgress,
  addRound,
  setRoundWords,
  listRounds,
  deleteRound,
} from "../../services/roundService.ts";
import { getStandings } from "../../services/standingsService.ts";
import { submitResponse, skipParticipant, type SubmissionResult } from "../../services/responseService.ts";
import { asString, asRawString, asPositiveInt, asStringArray } from "../validate.ts";
import {
  emitRoundStart,
  emitRoundEnd,
  emitBeeCompleted,
  emitParticipantAdded,
  emitResponseSubmitted,
  emitParticipantEliminated,
} from "../io/emit.ts";

function broadcastSubmissionResult(io: SocketIOServer, gamekey: string, result: SubmissionResult): void {
  emitResponseSubmitted(io, gamekey, {
    participantId: result.participant.id,
    participantName: result.participant.name,
    word: result.word,
    userSpelling: result.userSpelling,
    isCorrect: result.spelledCorrectly,
  });
  if (result.participant.isEliminated) {
    emitParticipantEliminated(io, gamekey, {
      participantId: result.participant.id,
      participantName: result.participant.name,
    });
  }
}

export function createBeesRouter(prisma: PrismaClient, io: SocketIOServer): Router {
  const router = Router();
  router.use(requireAuth);
  router.param("beeId", loadBeeParam(prisma));

  router.post("/", async (req, res) => {
    const title = asString(req.body?.title, "title");

    const bee = await createBee(prisma, { userId: req.userId!, title });
    res.status(201).json(bee);
  });

  router.get("/", async (req, res) => {
    const bees = await prisma.spellingBee.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json(bees);
  });

  router.get("/:beeId", async (req, res) => {
    const bee = req.bee!;
    const currentTurn = bee.status === "in_progress" && bee.roundStarted ? await getNextTurn(prisma, bee.id) : null;
    res.status(200).json({ bee, currentTurn });
  });

  router.patch("/:beeId", async (req, res) => {
    const updates: { title?: string } = {};
    if (req.body?.title !== undefined) {
      updates.title = asString(req.body.title, "title");
    }
    const bee = await updateBee(prisma, req.bee!.id, updates);
    res.status(200).json(bee);
  });

  router.delete("/:beeId", async (req, res) => {
    await deleteBee(prisma, req.bee!.id);
    res.status(204).send();
  });

  router.get("/:beeId/rounds", async (req, res) => {
    const rounds = await listRounds(prisma, req.bee!.id);
    res.status(200).json(rounds);
  });

  router.post("/:beeId/rounds", async (req, res) => {
    const round = await addRound(prisma, req.bee!.id);
    res.status(201).json(round);
  });

  router.put("/:beeId/rounds/:roundNumber/words", async (req, res) => {
    const roundNumber = asPositiveInt(Number(req.params.roundNumber), "roundNumber");
    const words = asStringArray(req.body?.words, "words");

    const round = await setRoundWords(prisma, req.bee!.id, roundNumber, words);
    res.status(200).json(round);
  });

  router.delete("/:beeId/rounds/:roundNumber", async (req, res) => {
    const roundNumber = asPositiveInt(Number(req.params.roundNumber), "roundNumber");
    const bee = await deleteRound(prisma, req.bee!.id, roundNumber);
    res.status(200).json(bee);
  });

  router.post("/:beeId/start", async (req, res) => {
    const bee = await startBee(prisma, req.bee!.id);
    res.status(200).json(bee);
  });

  router.post("/:beeId/start-round", async (req, res) => {
    const { bee, nextTurn } = await startRound(prisma, req.bee!.id);
    emitRoundStart(io, bee.gamekey!, {
      roundNumber: bee.currentRound,
      participantId: nextTurn.participant.id,
      participantName: nextTurn.participant.name,
      nextParticipantId: nextTurn.upNext?.id,
      nextParticipantName: nextTurn.upNext?.name,
    });
    res.status(200).json({ bee, currentTurn: nextTurn });
  });

  router.post("/:beeId/end", async (req, res) => {
    const bee = await endBee(prisma, req.bee!.id);
    const standings = await getStandings(prisma, bee.id);
    emitBeeCompleted(io, bee.gamekey!, {
      winner: standings.winner,
      finalStandings: [...standings.active, ...standings.eliminated],
    });
    res.status(200).json(bee);
  });

  router.post("/:beeId/reopen", async (req, res) => {
    const bee = await reopenBee(prisma, req.bee!.id);
    res.status(200).json(bee);
  });

  router.post("/:beeId/next-round", async (req, res) => {
    const beeId = req.bee!.id;
    const { bee, ended } = await completeRoundAndProgress(prisma, beeId);
    const gamekey = bee.gamekey!;

    const standings = await getStandings(prisma, beeId);
    emitRoundEnd(io, gamekey, { advancedParticipants: standings.active.map((p) => p.name) });

    if (ended) {
      emitBeeCompleted(io, gamekey, {
        winner: standings.winner,
        finalStandings: [...standings.active, ...standings.eliminated],
      });
    }

    res.status(200).json({ bee, ended });
  });

  router.post("/:beeId/participants", async (req, res) => {
    const name = asString(req.body?.name, "name");
    const bee = req.bee!;
    const participant = await addParticipant(prisma, bee.id, name);
    if (bee.gamekey) {
      emitParticipantAdded(io, bee.gamekey, { participantId: participant.id, name: participant.name });
    }
    res.status(201).json(participant);
  });

  router.get("/:beeId/participants", async (req, res) => {
    const participants = await listParticipants(prisma, req.bee!.id);
    res.status(200).json(participants);
  });

  router.post("/:beeId/responses", async (req, res) => {
    const bee = req.bee!;
    const participantId = asPositiveInt(req.body?.participantId, "participantId");
    const userSpelling = asRawString(req.body?.userSpelling, "userSpelling");

    const result = await submitResponse(prisma, { beeId: bee.id, participantId, userSpelling });
    broadcastSubmissionResult(io, bee.gamekey!, result);
    res.status(200).json(result);
  });

  router.post("/:beeId/skip", async (req, res) => {
    const bee = req.bee!;
    const participantId = asPositiveInt(req.body?.participantId, "participantId");

    const result = await skipParticipant(prisma, bee.id, participantId);
    broadcastSubmissionResult(io, bee.gamekey!, result);
    res.status(200).json(result);
  });

  return router;
}
