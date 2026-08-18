import type { MysteryEvent } from "../../generated/prisma/client.ts";

declare global {
  namespace Express {
    interface Request {
      userId?: number;
      event?: MysteryEvent;
    }
  }
}

export {};
