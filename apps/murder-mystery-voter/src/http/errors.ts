import type { ErrorRequestHandler } from "express";
import { HttpError } from "@nushsgames/shared-auth";
import { DomainError } from "../errors/index.ts";

const DOMAIN_ERROR_STATUS: Record<string, number> = {
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  INVALID_EVENT_STATE: 409,
  DUPLICATE_SUSPECT: 409,
  DUPLICATE_PARTICIPANT: 409,
  ROUND_NOT_OPEN: 409,
  ROUND_ALREADY_OPEN: 409,
  BALLOT_NOT_FOUND: 404,
  BALLOT_ALREADY_CAST: 409,
  BALLOT_EXPIRED: 410,
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message } });
    return;
  }

  if (err instanceof DomainError) {
    const status = DOMAIN_ERROR_STATUS[err.code] ?? 500;
    res.status(status).json({ error: { code: err.code, message: err.message } });
    return;
  }

  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({ error: { code: "INVALID_JSON", message: "Malformed JSON body" } });
    return;
  }

  console.error(err);
  res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } });
};
