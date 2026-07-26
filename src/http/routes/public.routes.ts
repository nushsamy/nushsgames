import { Router } from "express";
import type { PrismaClient } from "../../../generated/prisma/client.ts";
import type { Server as SocketIOServer } from "socket.io";
import { getBeeByGamekey } from "../../services/beeService.ts";
import { addParticipant, listParticipants } from "../../services/participantService.ts";
import { getNextTurn } from "../../services/roundService.ts";
import { getStandings } from "../../services/standingsService.ts";
import { asString } from "../validate.ts";
import { emitParticipantAdded } from "../io/emit.ts";

export function createJoinRouter(prisma: PrismaClient, io: SocketIOServer): Router {
  const router = Router();

  router.post("/:gamekey", async (req, res) => {
    const bee = await getBeeByGamekey(prisma, req.params.gamekey);
    const name = asString(req.body?.name, "name");

    const participant = await addParticipant(prisma, bee.id, name);
    emitParticipantAdded(io, req.params.gamekey, { participantId: participant.id, name: participant.name });
    res.status(201).json(participant);
  });

  return router;
}

/**
 * Persisted-state-only snapshot for polling display clients. It can never include the current
 * word or last verdict -- neither is persisted anywhere (only response outcomes are); those
 * exist solely as ephemeral socket broadcasts (`response:submitted`, `word:revealed`).
 */
export function createGamekeyStateRouter(prisma: PrismaClient): Router {
  const router = Router();

  router.get("/:gamekey/state", async (req, res) => {
    const bee = await getBeeByGamekey(prisma, req.params.gamekey);
    const participants = await listParticipants(prisma, bee.id);
    const currentTurn = bee.status === "in_progress" ? await getNextTurn(prisma, bee.id) : null;
    const standings = bee.status === "completed" ? await getStandings(prisma, bee.id) : null;

    res.status(200).json({
      gamekey: bee.gamekey,
      status: bee.status,
      currentRound: bee.currentRound,
      totalRounds: bee.totalRounds,
      currentParticipant: currentTurn?.participant.name ?? null,
      participants,
      standings,
    });
  });

  return router;
}
