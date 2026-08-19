-- Suspects and participants merge into one entity: every participant can now be named a
-- "candidate" for a round (see MysteryParticipant.characterName/description), so there's no
-- longer a way to carry forward existing suspect/participant pairings automatically -- wipe
-- event data (dev/seed only) rather than leave orphaned or half-populated rows.
TRUNCATE TABLE "mystery_events" RESTART IDENTITY CASCADE;

-- DropForeignKey
ALTER TABLE "ballots" DROP CONSTRAINT "ballots_votedSuspectId_fkey";

-- DropForeignKey
ALTER TABLE "suspects" DROP CONSTRAINT "suspects_eventId_fkey";

-- AlterTable
ALTER TABLE "mystery_participants" ADD COLUMN     "characterName" TEXT NOT NULL,
ADD COLUMN     "description" TEXT;

-- DropTable
DROP TABLE "suspects";

-- CreateIndex
CREATE UNIQUE INDEX "mystery_participants_eventId_characterName_key" ON "mystery_participants"("eventId", "characterName");

-- AddForeignKey
ALTER TABLE "ballots" ADD CONSTRAINT "ballots_votedSuspectId_fkey" FOREIGN KEY ("votedSuspectId") REFERENCES "mystery_participants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
