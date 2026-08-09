import type { SpellingBee, Participant } from "../../generated/prisma/client.ts";

declare global {
  namespace Express {
    interface Request {
      userId?: number;
      bee?: SpellingBee;
      participant?: Participant;
    }
  }
}

export {};
