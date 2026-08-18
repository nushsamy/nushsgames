import type { PrismaClient, Ballot, MysteryRound, Suspect } from "../../generated/prisma/client.ts";
import { NotFoundError, InvalidEventStateError, RoundNotOpenError, RoundAlreadyOpenError, ValidationError } from "../errors/index.ts";
import { getEventById } from "./eventService.ts";
import { getRoundByNumber } from "./roundService.ts";
import { generateUniqueBallotToken } from "../domain/ballotToken.ts";

export async function openRound(
  prisma: PrismaClient,
  eventId: number,
  roundNumber: number,
): Promise<{ round: MysteryRound; ballots: Ballot[] }> {
  return prisma.$transaction(async (tx) => {
    const event = await getEventById(tx, eventId);
    if (event.status !== "in_progress") {
      throw new InvalidEventStateError(`Rounds can only be opened while event ${eventId} is "in_progress"`);
    }

    const round = await getRoundByNumber(tx, eventId, roundNumber);
    if (round.status !== "pending") {
      throw new RoundAlreadyOpenError(`Round ${roundNumber} for event ${eventId} is not "pending"`);
    }

    const alreadyOpen = await tx.mysteryRound.findFirst({ where: { eventId, status: "open" } });
    if (alreadyOpen) {
      throw new RoundAlreadyOpenError(
        `Round ${alreadyOpen.roundNumber} is already open for event ${eventId} -- close it before opening another`,
      );
    }

    const attendees = await tx.mysteryParticipant.findMany({ where: { eventId, isAttending: true } });
    if (attendees.length === 0) {
      throw new ValidationError(`No attending participants for event ${eventId} -- take attendance first`);
    }

    const ballots: Ballot[] = [];
    for (const participant of attendees) {
      const token = await generateUniqueBallotToken(tx);
      const ballot = await tx.ballot.create({
        data: { roundId: round.id, participantId: participant.id, token, status: "pending" },
      });
      ballots.push(ballot);
    }

    const updatedRound = await tx.mysteryRound.update({
      where: { id: round.id },
      data: { status: "open" },
    });
    await tx.mysteryEvent.update({ where: { id: eventId }, data: { currentRound: roundNumber } });

    return { round: updatedRound, ballots };
  });
}

export async function closeRound(
  prisma: PrismaClient,
  eventId: number,
  roundNumber: number,
): Promise<MysteryRound> {
  return prisma.$transaction(async (tx) => {
    await getEventById(tx, eventId);
    const round = await getRoundByNumber(tx, eventId, roundNumber);
    if (round.status !== "open") {
      throw new RoundNotOpenError(`Round ${roundNumber} for event ${eventId} is not "open"`);
    }

    await tx.ballot.updateMany({
      where: { roundId: round.id, status: "pending" },
      data: { status: "expired" },
    });

    return tx.mysteryRound.update({ where: { id: round.id }, data: { status: "closed" } });
  });
}

export interface SuspectTally {
  suspectId: number;
  name: string;
  count: number;
  percentage: number;
}

export interface ParticipantBallotStatus {
  ballotId: string;
  participantId: number;
  name: string;
  email: string;
  ballotStatus: "pending" | "cast" | "expired";
}

export interface RoundTally {
  totalBallots: number;
  castCount: number;
  pendingCount: number;
  expiredCount: number;
  tally: SuspectTally[];
  participants: ParticipantBallotStatus[];
}

export async function getRoundTally(prisma: PrismaClient, eventId: number, roundNumber: number): Promise<RoundTally> {
  await getEventById(prisma, eventId);
  const round = await getRoundByNumber(prisma, eventId, roundNumber);

  const [ballots, suspects] = await Promise.all([
    prisma.ballot.findMany({
      where: { roundId: round.id },
      include: { participant: true },
    }),
    prisma.suspect.findMany({ where: { id: { in: round.suspectIds as number[] } } }),
  ]);

  const castCount = ballots.filter((b) => b.status === "cast").length;
  const pendingCount = ballots.filter((b) => b.status === "pending").length;
  const expiredCount = ballots.filter((b) => b.status === "expired").length;

  const countsBySuspect = new Map<number, number>();
  for (const ballot of ballots) {
    if (ballot.status === "cast" && ballot.votedSuspectId !== null) {
      countsBySuspect.set(ballot.votedSuspectId, (countsBySuspect.get(ballot.votedSuspectId) ?? 0) + 1);
    }
  }

  const tally: SuspectTally[] = (suspects as Suspect[]).map((suspect) => {
    const count = countsBySuspect.get(suspect.id) ?? 0;
    return {
      suspectId: suspect.id,
      name: suspect.name,
      count,
      percentage: castCount > 0 ? Math.round((count / castCount) * 1000) / 10 : 0,
    };
  });

  const participants: ParticipantBallotStatus[] = ballots.map((ballot) => ({
    ballotId: ballot.id,
    participantId: ballot.participant.id,
    name: ballot.participant.name,
    email: ballot.participant.email,
    ballotStatus: ballot.status,
  }));

  return {
    totalBallots: ballots.length,
    castCount,
    pendingCount,
    expiredCount,
    tally,
    participants,
  };
}

export interface ResendableBallot {
  ballot: Ballot;
  round: MysteryRound;
}

export async function getResendableBallot(
  prisma: PrismaClient,
  eventId: number,
  ballotId: string,
): Promise<ResendableBallot> {
  const ballot = await prisma.ballot.findUnique({ where: { id: ballotId }, include: { round: true } });
  if (!ballot || ballot.round.eventId !== eventId) {
    throw new NotFoundError(`Ballot ${ballotId} not found in event ${eventId}`);
  }
  if (ballot.status !== "pending") {
    throw new ValidationError(`Ballot ${ballotId} is not "pending" -- cannot resend`);
  }
  if (ballot.round.status !== "open") {
    throw new RoundNotOpenError(`Round ${ballot.round.roundNumber} for event ${eventId} is not "open"`);
  }
  return { ballot, round: ballot.round };
}

export async function recordEmailResult(
  prisma: PrismaClient,
  ballotId: string,
  emailError: string | null,
): Promise<Ballot> {
  return prisma.ballot.update({ where: { id: ballotId }, data: { emailError } });
}
