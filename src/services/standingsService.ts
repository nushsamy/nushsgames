import type { PrismaClient, Prisma } from "../../generated/prisma/client.ts";
import { getBeeById } from "./beeService.ts";

export interface StandingsParticipant {
  id: number;
  name: string;
  isActive: boolean;
  isEliminated: boolean;
}

export interface Standings {
  active: StandingsParticipant[];
  eliminated: StandingsParticipant[];
  winner: StandingsParticipant | null;
}

export async function getStandings(
  prisma: PrismaClient | Prisma.TransactionClient,
  beeId: number,
): Promise<Standings> {
  const bee = await getBeeById(prisma, beeId);

  const participants = await prisma.participant.findMany({
    where: { beeId },
    orderBy: { id: "asc" },
  });

  const toStandingsParticipant = (p: (typeof participants)[number]): StandingsParticipant => ({
    id: p.id,
    name: p.name,
    isActive: p.isActive,
    isEliminated: p.isEliminated,
  });

  const active = participants.filter((p) => !p.isEliminated).map(toStandingsParticipant);
  const eliminated = participants.filter((p) => p.isEliminated).map(toStandingsParticipant);

  const winner = bee.status === "completed" && active.length === 1 ? active[0] : null;

  return { active, eliminated, winner };
}
