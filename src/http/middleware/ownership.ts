import type { Request, Response, NextFunction } from "express";
import type { PrismaClient } from "../../../generated/prisma/client.ts";
import { getBeeById } from "../../services/beeService.ts";
import { getParticipantById } from "../../services/participantService.ts";
import { ValidationError } from "../../errors/index.ts";
import { ForbiddenError } from "../errors.ts";

function parseId(raw: string, fieldName: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError(`${fieldName} must be a positive integer`);
  }
  return id;
}

export function loadBeeParam(prisma: PrismaClient) {
  return async (req: Request, _res: Response, next: NextFunction, beeIdParam: string) => {
    try {
      const beeId = parseId(beeIdParam, "beeId");
      const bee = await getBeeById(prisma, beeId);
      if (bee.userId !== req.userId) {
        throw new ForbiddenError("You do not have access to this bee");
      }
      req.bee = bee;
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function loadParticipantParam(prisma: PrismaClient) {
  return async (req: Request, _res: Response, next: NextFunction, participantIdParam: string) => {
    try {
      const participantId = parseId(participantIdParam, "participantId");
      const participant = await getParticipantById(prisma, participantId);
      const bee = await getBeeById(prisma, participant.beeId);
      if (bee.userId !== req.userId) {
        throw new ForbiddenError("You do not have access to this participant");
      }
      req.bee = bee;
      req.participant = participant;
      next();
    } catch (err) {
      next(err);
    }
  };
}
