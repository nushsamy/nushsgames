import { Router } from "express";
import type { PrismaClient } from "../../../generated/prisma/client.ts";
import { requireAuth } from "@nushsgames/shared-auth";
import { loadParticipantParam } from "../middleware/ownership.ts";
import { updateParticipantStatus } from "../../services/participantService.ts";
import { asOptionalBoolean } from "../validate.ts";

export function createParticipantsRouter(prisma: PrismaClient): Router {
  const router = Router();
  router.use(requireAuth);
  router.param("participantId", loadParticipantParam(prisma));

  router.patch("/:participantId", async (req, res) => {
    const isActive = asOptionalBoolean(req.body?.isActive, "isActive");
    const isEliminated = asOptionalBoolean(req.body?.isEliminated, "isEliminated");

    const participant = await updateParticipantStatus(prisma, req.participant!.id, {
      isActive,
      isEliminated,
    });
    res.status(200).json(participant);
  });

  return router;
}
