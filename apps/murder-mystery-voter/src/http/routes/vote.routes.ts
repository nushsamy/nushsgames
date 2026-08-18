import { Router } from "express";
import type { PrismaClient } from "../../../generated/prisma/client.ts";
import { getBallotByToken, castVote } from "../../services/ballotService.ts";
import { asPositiveInt } from "../validate.ts";

export function createVoteRouter(prisma: PrismaClient): Router {
  const router = Router();

  router.get("/:token", async (req, res) => {
    const ballot = await getBallotByToken(prisma, req.params.token);
    res.status(200).json(ballot);
  });

  router.post("/:token", async (req, res) => {
    const suspectId = asPositiveInt(req.body?.suspectId, "suspectId");
    await castVote(prisma, req.params.token, suspectId);
    res.status(200).json({ ok: true });
  });

  return router;
}
