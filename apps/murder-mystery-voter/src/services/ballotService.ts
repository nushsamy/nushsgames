import type { PrismaClient, Suspect } from "../../generated/prisma/client.ts";
import {
  BallotNotFoundError,
  BallotAlreadyCastError,
  BallotExpiredError,
  RoundNotOpenError,
  ValidationError,
} from "../errors/index.ts";

export interface BallotView {
  participantName: string;
  eventTitle: string;
  roundNumber: number;
  suspects: Suspect[];
}

async function loadBallotByToken(prisma: PrismaClient, token: string) {
  const ballot = await prisma.ballot.findUnique({
    where: { token },
    include: { participant: true, round: { include: { event: true } } },
  });
  if (!ballot) {
    throw new BallotNotFoundError("This voting link is not valid");
  }
  return ballot;
}

function assertVotable(ballot: Awaited<ReturnType<typeof loadBallotByToken>>): void {
  if (ballot.status === "cast") {
    throw new BallotAlreadyCastError("You've already voted in this round");
  }
  if (ballot.status === "expired" || ballot.round.status === "closed") {
    throw new BallotExpiredError("Voting for this round has closed");
  }
  if (ballot.round.status === "pending") {
    throw new RoundNotOpenError("Voting hasn't opened for this round yet");
  }
}

export async function getBallotByToken(prisma: PrismaClient, token: string): Promise<BallotView> {
  const ballot = await loadBallotByToken(prisma, token);
  assertVotable(ballot);

  const suspects = await prisma.suspect.findMany({
    where: { id: { in: ballot.round.suspectIds as number[] } },
    orderBy: { id: "asc" },
  });

  return {
    participantName: ballot.participant.name,
    eventTitle: ballot.round.event.title,
    roundNumber: ballot.round.roundNumber,
    suspects,
  };
}

export async function castVote(prisma: PrismaClient, token: string, suspectId: number): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const ballot = await tx.ballot.findUnique({
      where: { token },
      include: { round: true },
    });
    if (!ballot) {
      throw new BallotNotFoundError("This voting link is not valid");
    }
    if (ballot.status === "cast") {
      throw new BallotAlreadyCastError("You've already voted in this round");
    }
    if (ballot.status === "expired" || ballot.round.status === "closed") {
      throw new BallotExpiredError("Voting for this round has closed");
    }
    if (ballot.round.status === "pending") {
      throw new RoundNotOpenError("Voting hasn't opened for this round yet");
    }

    const eligibleSuspectIds = ballot.round.suspectIds as number[];
    if (!eligibleSuspectIds.includes(suspectId)) {
      throw new ValidationError("suspectId is not eligible for this round");
    }

    await tx.ballot.update({
      where: { id: ballot.id },
      data: { status: "cast", votedSuspectId: suspectId, castAt: new Date() },
    });
  });
}
