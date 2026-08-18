import type { PrismaClient, Ballot, MysteryParticipant, MysteryRound, MysteryEvent } from "../../generated/prisma/client.ts";
import { resend } from "../email/resendClient.ts";
import { buildBallotEmail } from "../email/templates.ts";
import { recordEmailResult } from "./roundLifecycleService.ts";

export interface SendResult {
  ok: boolean;
  error?: string;
}

function votingUrlFor(token: string): string {
  const base = process.env.FRONTEND_URL ?? "http://localhost:5174";
  return `${base.replace(/\/$/, "")}/vote/${token}`;
}

export async function sendBallotEmail(
  ballot: Ballot,
  participant: MysteryParticipant,
  round: MysteryRound,
  event: MysteryEvent,
): Promise<SendResult> {
  if (!resend) {
    console.log(`[emailService] RESEND_API_KEY not set -- skipping email to ${participant.email}`);
    return { ok: true };
  }

  const { subject, html, text } = buildBallotEmail({
    participantName: participant.name,
    eventTitle: event.title,
    roundNumber: round.roundNumber,
    votingUrl: votingUrlFor(ballot.token),
  });

  try {
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "onboarding@resend.dev",
      to: participant.email,
      subject,
      html,
      text,
    });
    if (result.error) {
      return { ok: false, error: result.error.message };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export interface SendRoundBallotsResult {
  sent: number;
  failed: { participantId: number; error: string }[];
}

export async function sendRoundBallots(
  prisma: PrismaClient,
  eventId: number,
  roundNumber: number,
): Promise<SendRoundBallotsResult> {
  const event = await prisma.mysteryEvent.findUniqueOrThrow({ where: { id: eventId } });
  const round = await prisma.mysteryRound.findUniqueOrThrow({
    where: { eventId_roundNumber: { eventId, roundNumber } },
  });
  const ballots = await prisma.ballot.findMany({
    where: { roundId: round.id, status: "pending" },
    include: { participant: true },
  });

  const results = await Promise.allSettled(
    ballots.map(async (ballot) => {
      const result = await sendBallotEmail(ballot, ballot.participant, round, event);
      if (!result.ok) {
        await recordEmailResult(prisma, ballot.id, result.error ?? "Unknown error");
        throw { participantId: ballot.participantId, error: result.error ?? "Unknown error" };
      }
      await recordEmailResult(prisma, ballot.id, null);
    }),
  );

  const failed = results
    .filter((r): r is PromiseRejectedResult => r.status === "rejected")
    .map((r) => r.reason as { participantId: number; error: string });

  return { sent: ballots.length - failed.length, failed };
}
