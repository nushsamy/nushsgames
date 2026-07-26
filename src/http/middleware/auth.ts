import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../jwt.ts";
import { UnauthorizedError } from "../errors.ts";

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing or malformed Authorization header");
  }

  const token = header.slice("Bearer ".length);
  const payload = verifyAccessToken(token);
  req.userId = Number(payload.sub);
  next();
}
