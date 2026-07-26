-- CreateEnum
CREATE TYPE "BeeStatus" AS ENUM ('created', 'in_progress', 'completed');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spelling_bees" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "totalRounds" INTEGER NOT NULL,
    "gamekey" TEXT,
    "status" "BeeStatus" NOT NULL DEFAULT 'created',
    "currentRound" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spelling_bees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participants" (
    "id" SERIAL NOT NULL,
    "beeId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isEliminated" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bee_rounds" (
    "id" TEXT NOT NULL,
    "beeId" INTEGER NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "assignedWords" JSONB NOT NULL,

    CONSTRAINT "bee_rounds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "spelling_bees_gamekey_key" ON "spelling_bees"("gamekey");

-- CreateIndex
CREATE INDEX "spelling_bees_userId_idx" ON "spelling_bees"("userId");

-- CreateIndex
CREATE INDEX "participants_beeId_idx" ON "participants"("beeId");

-- CreateIndex
CREATE UNIQUE INDEX "participants_beeId_name_key" ON "participants"("beeId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "bee_rounds_beeId_roundNumber_key" ON "bee_rounds"("beeId", "roundNumber");

-- AddForeignKey
ALTER TABLE "spelling_bees" ADD CONSTRAINT "spelling_bees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participants" ADD CONSTRAINT "participants_beeId_fkey" FOREIGN KEY ("beeId") REFERENCES "spelling_bees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bee_rounds" ADD CONSTRAINT "bee_rounds_beeId_fkey" FOREIGN KEY ("beeId") REFERENCES "spelling_bees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
