import "dotenv/config";
import { prisma } from "../src/db/client.ts";
import { createEvent, startEvent } from "../src/services/eventService.ts";
import { addSuspect } from "../src/services/suspectService.ts";
import { addParticipant, setAttendance } from "../src/services/participantService.ts";
import { addRound, setRoundSuspects } from "../src/services/roundService.ts";
import { openRound } from "../src/services/roundLifecycleService.ts";

async function main() {
  const host = await prisma.user.create({
    data: { email: "host@example.com", passwordHash: "seed-placeholder-hash" },
  });

  // Event 1: never started -- exercises the bare "created" state, still being built.
  const beingBuilt = await createEvent(prisma, { userId: host.id, title: "Blackwood Manor" });
  const s1 = await addSuspect(prisma, beingBuilt.id, { name: "Colonel Mustard", description: "The retired officer." });
  const s2 = await addSuspect(prisma, beingBuilt.id, { name: "Miss Scarlet", description: "The socialite." });
  const s3 = await addSuspect(prisma, beingBuilt.id, { name: "Professor Plum", description: "The academic." });
  await addParticipant(prisma, beingBuilt.id, { name: "Alice", email: "alice@example.com" });
  await addParticipant(prisma, beingBuilt.id, { name: "Bob", email: "bob@example.com" });
  const round1 = await addRound(prisma, beingBuilt.id);
  await setRoundSuspects(prisma, beingBuilt.id, round1.roundNumber, [s1.id, s2.id, s3.id]);

  // Event 2: started, in the attendance-taking step (round 1 not opened yet).
  const takingAttendance = await createEvent(prisma, { userId: host.id, title: "The Orient Express" });
  const t1 = await addSuspect(prisma, takingAttendance.id, { name: "The Conductor" });
  const t2 = await addSuspect(prisma, takingAttendance.id, { name: "The Countess" });
  await addParticipant(prisma, takingAttendance.id, { name: "Carol", email: "carol@example.com" });
  await addParticipant(prisma, takingAttendance.id, { name: "Dave", email: "dave@example.com" });
  await addParticipant(prisma, takingAttendance.id, { name: "Erin", email: "erin@example.com" });
  const tRound = await addRound(prisma, takingAttendance.id);
  await setRoundSuspects(prisma, takingAttendance.id, tRound.roundNumber, [t1.id, t2.id]);
  await startEvent(prisma, takingAttendance.id);

  // Event 3: fully live, round 1 open with attendance already confirmed (one no-show excluded).
  const live = await createEvent(prisma, { userId: host.id, title: "The Poisoned Gala" });
  const g1 = await addSuspect(prisma, live.id, { name: "The Butler" });
  const g2 = await addSuspect(prisma, live.id, { name: "The Heiress" });
  const g3 = await addSuspect(prisma, live.id, { name: "The Gardener" });
  const gFrank = await addParticipant(prisma, live.id, { name: "Frank", email: "frank@example.com" });
  const gGrace = await addParticipant(prisma, live.id, { name: "Grace", email: "grace@example.com" });
  const gHenry = await addParticipant(prisma, live.id, { name: "Henry", email: "henry@example.com" });
  const gRound1 = await addRound(prisma, live.id);
  await setRoundSuspects(prisma, live.id, gRound1.roundNumber, [g1.id, g2.id, g3.id]);
  const gRound2 = await addRound(prisma, live.id);
  await setRoundSuspects(prisma, live.id, gRound2.roundNumber, [g1.id, g3.id]);
  await startEvent(prisma, live.id);
  // Henry didn't show up -- excluded from every round's ballots.
  await setAttendance(prisma, live.id, [gFrank.id, gGrace.id]);
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
