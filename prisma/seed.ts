import "dotenv/config";
import { prisma } from "../src/db/client.ts";
import { createBee, startBee } from "../src/services/beeService.ts";
import { addParticipant } from "../src/services/participantService.ts";
import { submitResponse, skipParticipant } from "../src/services/responseService.ts";
import { completeRoundAndProgress } from "../src/services/roundService.ts";

async function main() {
  const host = await prisma.user.create({
    data: { email: "host@example.com", passwordHash: "seed-placeholder-hash" },
  });

  // Bee 1: never started — exercises the bare "created" state.
  await createBee(prisma, {
    userId: host.id,
    title: "Fall Regional Spelling Bee",
    totalRounds: 3,
    roundWords: [
      ["necessary", "rhythm", "occasion", "separate", "definitely"],
      ["accommodate", "embarrass", "committee", "restaurant", "vacuum"],
      ["beginning", "existence", "privilege", "acquire", "conscience"],
    ],
  });

  // Bee 2: in progress, mid-round.
  const midGame = await createBee(prisma, {
    userId: host.id,
    title: "Classroom Spelling Bee",
    totalRounds: 3,
    roundWords: [
      ["apple", "banana"],
      ["cherry", "date"],
      ["eggplant", "fig"],
    ],
  });
  await startBee(prisma, midGame.id);
  const midAlice = await addParticipant(prisma, midGame.id, "Alice");
  const midBob = await addParticipant(prisma, midGame.id, "Bob");
  await addParticipant(prisma, midGame.id, "Carol");
  await submitResponse(prisma, { beeId: midGame.id, participantId: midAlice.id, userSpelling: "apple" });
  await submitResponse(prisma, { beeId: midGame.id, participantId: midBob.id, userSpelling: "bananna" });
  // Carol's turn is left open, so this bee is realistically "mid-round" for local dev poking.

  // Bee 3: fully played out to completion, with a clear winner.
  const finished = await createBee(prisma, {
    userId: host.id,
    title: "Summer Camp Spelling Bee",
    totalRounds: 2,
    roundWords: [
      ["giraffe", "hippo"],
      ["iguana", "jackal"],
    ],
  });
  await startBee(prisma, finished.id);
  const finAlice = await addParticipant(prisma, finished.id, "Dana");
  const finBob = await addParticipant(prisma, finished.id, "Evan");

  // Round 1: both spell correctly.
  await submitResponse(prisma, { beeId: finished.id, participantId: finAlice.id, userSpelling: "giraffe" });
  await submitResponse(prisma, { beeId: finished.id, participantId: finBob.id, userSpelling: "hippo" });
  await completeRoundAndProgress(prisma, finished.id);

  // Round 2: Evan is skipped (counts as incorrect) and eliminated; Dana wins.
  await submitResponse(prisma, { beeId: finished.id, participantId: finAlice.id, userSpelling: "iguana" });
  await skipParticipant(prisma, finished.id, finBob.id);
  await completeRoundAndProgress(prisma, finished.id);

  console.log("Seed complete:");
  console.log(`  - "Fall Regional Spelling Bee" (created, not started)`);
  console.log(`  - "Classroom Spelling Bee" (in_progress, round ${(await prisma.spellingBee.findUniqueOrThrow({ where: { id: midGame.id } })).currentRound})`);
  console.log(`  - "Summer Camp Spelling Bee" (completed, winner: Dana)`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
