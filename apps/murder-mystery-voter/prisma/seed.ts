import "dotenv/config";
import { prisma } from "../src/db/client.ts";
import { createEvent, startEvent } from "../src/services/eventService.ts";
import { addParticipant, setAttendance } from "../src/services/participantService.ts";
import { addRound } from "../src/services/roundService.ts";
import { openRound } from "../src/services/roundLifecycleService.ts";

async function main() {
  // Users live in the separate @nushsgames/auth service's database now — register
  // "host@example.com" there (npm run dev --workspace=apps/auth) to actually log in as this seed data's host.
  const host = { id: 1 };

  // Event 1: never started -- exercises the bare "created" state, still being built.
  const beingBuilt = await createEvent(prisma, { userId: host.id, title: "Blackwood Manor" });
  await addParticipant(prisma, beingBuilt.id, {
    name: "Alice",
    email: "alice@example.com",
    characterName: "Colonel Mustard",
    description: "The retired officer.",
  });
  await addParticipant(prisma, beingBuilt.id, {
    name: "Bob",
    email: "bob@example.com",
    characterName: "Miss Scarlet",
    description: "The socialite.",
  });
  await addParticipant(prisma, beingBuilt.id, {
    name: "Cara",
    email: "cara@example.com",
    characterName: "Professor Plum",
    description: "The academic.",
  });
  await addRound(prisma, beingBuilt.id);

  // Event 2: started, in the attendance-taking step (round 1 not opened yet).
  const takingAttendance = await createEvent(prisma, { userId: host.id, title: "The Orient Express" });
  await addParticipant(prisma, takingAttendance.id, {
    name: "Carol",
    email: "carol@example.com",
    characterName: "The Conductor",
  });
  await addParticipant(prisma, takingAttendance.id, {
    name: "Dave",
    email: "dave@example.com",
    characterName: "The Countess",
  });
  await addParticipant(prisma, takingAttendance.id, {
    name: "Erin",
    email: "erin@example.com",
    characterName: "The Steward",
  });
  await addRound(prisma, takingAttendance.id);
  await startEvent(prisma, takingAttendance.id);

  // Event 3: fully live, round 1 open with attendance already confirmed (one no-show excluded).
  // Every participant is a suspect in every round -- Henry's character stays accusable even
  // though he personally didn't show up to vote.
  const live = await createEvent(prisma, { userId: host.id, title: "The Poisoned Gala" });
  const frank = await addParticipant(prisma, live.id, {
    name: "Frank",
    email: "frank@example.com",
    characterName: "The Butler",
  });
  const grace = await addParticipant(prisma, live.id, {
    name: "Grace",
    email: "grace@example.com",
    characterName: "The Heiress",
  });
  await addParticipant(prisma, live.id, {
    name: "Henry",
    email: "henry@example.com",
    characterName: "The Gardener",
  });
  const gRound1 = await addRound(prisma, live.id);
  await addRound(prisma, live.id);
  await startEvent(prisma, live.id);
  // Henry didn't show up -- excluded from every round's ballots.
  await setAttendance(prisma, live.id, [frank.id, grace.id]);
  await openRound(prisma, live.id, gRound1.roundNumber);

  console.log("Seed complete:");
  console.log(`  - "Blackwood Manor" (created, still being built)`);
  console.log(`  - "The Orient Express" (in_progress, taking attendance)`);
  console.log(`  - "The Poisoned Gala" (in_progress, round 1 open, Henry marked absent)`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
