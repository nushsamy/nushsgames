import type { ErrorRequestHandler } from "express";
import { HttpError } from "@nushsgames/shared-auth";
import { DomainError } from "../errors/index.ts";

const DOMAIN_ERROR_STATUS: Record<string, number> = {
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  INVALID_BEE_STATE: 409,
  DUPLICATE_PARTICIPANT: 409,
  PARTICIPANT_NOT_IN_BEE: 404,
  PARTICIPANT_NOT_ELIGIBLE: 409,
  ROUND_NOT_COMPLETE: 409,
  ROUND_IN_PROGRESS: 409,
  EMAIL_ALREADY_REGISTERED: 409,
  INVALID_CREDENTIALS: 401,
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
