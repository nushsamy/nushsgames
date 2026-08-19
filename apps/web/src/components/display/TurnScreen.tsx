import { CurrentParticipant } from "@/components/display/CurrentParticipant";
import { RoundHeader } from "@/components/display/RoundHeader";
import { SpellingInProgress } from "@/components/display/SpellingInProgress";
import { VerdictBadge } from "@/components/display/VerdictBadge";
import type { Phase } from "@/state/displayTypes";

type TurnPhase = Extract<Phase, { kind: "turn" }>;

function subtitleFor(phase: TurnPhase): string {
  if (!phase.participantName) return "Get ready…";
  return phase.turnStage === "typing" ? `${phase.participantName} is spelling…` : `${phase.participantName}'s turn`;
}

export function TurnScreen({ phase }: { phase: TurnPhase }) {
  if (phase.turnStage === "verdict" && phase.verdict) {
    return (
      <div className="flex flex-col items-center gap-5 text-center">
        <RoundHeader roundNumber={phase.roundNumber} totalRounds={phase.totalRounds} />
        <VerdictBadge verdict={phase.verdict} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <RoundHeader roundNumber={phase.roundNumber} totalRounds={phase.totalRounds} />
      <div className="animate-[proj-bob_2s_ease-in-out_infinite] text-[64px]" aria-hidden="true">
        🐝
      </div>
      <CurrentParticipant name={phase.participantName} subtitle={subtitleFor(phase)} />
      <SpellingInProgress spelling={phase.spelling} />
    </div>
  );
}
