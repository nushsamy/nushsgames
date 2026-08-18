import type { Request, Response, NextFunction } from "express";
import type { PrismaClient } from "../../../generated/prisma/client.ts";
import { getEventById } from "../../services/eventService.ts";
import { ValidationError } from "../../errors/index.ts";
import { ForbiddenError } from "@nushsgames/shared-auth";

function parseId(raw: string, fieldName: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError(`${fieldName} must be a positive integer`);
  }
  return id;
}

export function loadEventParam(prisma: PrismaClient) {
  return async (req: Request, _res: Response, next: NextFunction, eventIdParam: string) => {
    try {
      const eventId = parseId(eventIdParam, "eventId");
      const event = await getEventById(prisma, eventId);
      if (event.userId !== req.userId) {
        throw new ForbiddenError("You do not have access to this event");
      }
      req.event = event;
      next();
    } catch (err) {
      next(err);
    }
  };
}
