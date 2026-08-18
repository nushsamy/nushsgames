-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('created', 'in_progress', 'completed');

-- CreateEnum
CREATE TYPE "RoundStatus" AS ENUM ('pending', 'open', 'closed');

-- CreateEnum
CREATE TYPE "BallotStatus" AS ENUM ('pending', 'cast', 'expired');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mystery_events" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'created',
    "totalRounds" INTEGER NOT NULL DEFAULT 0,
    "currentRound" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mystery_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suspects" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "suspects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mystery_participants" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "isAttending" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "mystery_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mystery_rounds" (
    "id" TEXT NOT NULL,
    "eventId" INTEGER NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "suspectIds" JSONB NOT NULL,
    "status" "RoundStatus" NOT NULL DEFAULT 'pending',

    CONSTRAINT "mystery_rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ballots" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "participantId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "status" "BallotStatus" NOT NULL DEFAULT 'pending',
    "votedSuspectId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "castAt" TIMESTAMP(3),
    "emailError" TEXT,

    CONSTRAINT "ballots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "mystery_events_userId_idx" ON "mystery_events"("userId");

-- CreateIndex
CREATE INDEX "suspects_eventId_idx" ON "suspects"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "suspects_eventId_name_key" ON "suspects"("eventId", "name");

-- CreateIndex
CREATE INDEX "mystery_participants_eventId_idx" ON "mystery_participants"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "mystery_participants_eventId_email_key" ON "mystery_participants"("eventId", "email");

-- CreateIndex
CREATE INDEX "mystery_rounds_eventId_idx" ON "mystery_rounds"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "mystery_rounds_eventId_roundNumber_key" ON "mystery_rounds"("eventId", "roundNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ballots_token_key" ON "ballots"("token");

-- CreateIndex
CREATE INDEX "ballots_roundId_idx" ON "ballots"("roundId");

-- CreateIndex
CREATE UNIQUE INDEX "ballots_roundId_participantId_key" ON "ballots"("roundId", "participantId");

-- AddForeignKey
ALTER TABLE "mystery_events" ADD CONSTRAINT "mystery_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suspects" ADD CONSTRAINT "suspects_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "mystery_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mystery_participants" ADD CONSTRAINT "mystery_participants_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "mystery_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mystery_rounds" ADD CONSTRAINT "mystery_rounds_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "mystery_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ballots" ADD CONSTRAINT "ballots_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "mystery_rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ballots" ADD CONSTRAINT "ballots_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "mystery_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ballots" ADD CONSTRAINT "ballots_votedSuspectId_fkey" FOREIGN KEY ("votedSuspectId") REFERENCES "suspects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
