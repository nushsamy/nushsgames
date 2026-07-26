import { Router } from "express";
import type { PrismaClient } from "../../../generated/prisma/client.ts";
import type { Server as SocketIOServer } from "socket.io";
import { requireAuth } from "../middleware/auth.ts";
import { loadBeeParam } from "../middleware/ownership.ts";
import { createBee, startBee, endBee, updateBee } from "../../services/beeService.ts";
import { addParticipant, listParticipants } from "../../services/participantService.ts";
import { getNextTurn, completeRoundAndProgress } from "../../services/roundService.ts";
import { getStandings } from "../../services/standingsService.ts";
import { submitResponse, skipParticipant, type SubmissionResult } from "../../services/responseService.ts";
import { asString, asRawString, asPositiveInt } from "../validate.ts";
import { ValidationError } from "../../errors/index.ts";
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
    const totalRounds = asPositiveInt(req.body?.totalRounds, "totalRounds");
    const roundWords = req.body?.roundWords;
    if (!Array.isArray(roundWords)) {
      throw new ValidationError("roundWords must be an array of per-round word lists");
    }

    const bee = await createBee(prisma, { userId: req.userId!, title, totalRounds, roundWords });
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
    const currentTurn = bee.status === "in_progress" ? await getNextTurn(prisma, bee.id) : null;
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

  router.post("/:beeId/start", async (req, res) => {
    const bee = await startBee(prisma, req.bee!.id);
    emitRoundStart(io, bee.gamekey!, { roundNumber: bee.currentRound });
    res.status(200).json(bee);
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
    } else {
      const nextTurn = await getNextTurn(prisma, beeId);
      emitRoundStart(io, gamekey, {
        roundNumber: bee.currentRound,
        participantId: nextTurn?.participant.id,
        participantName: nextTurn?.participant.name,
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
