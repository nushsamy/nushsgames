import { CurrentParticipant } from "@/components/display/CurrentParticipant";
import { RoundHeader } from "@/components/display/RoundHeader";
import { SpellingInProgress } from "@/components/display/SpellingInProgress";
import { VerdictBadge } from "@/components/display/VerdictBadge";
import type { Phase } from "@/state/displayTypes";

type TurnPhase = Extract<Phase, { kind: "turn" }>;

function subtitleFor(phase: TurnPhase): string {
  if (!phase.participantName) return "Get ready…";
  return phase.turnStage === "typing" ? `${phase.participantName} is spelling…` : `${phase.participantName} is up next`;
}

export function TurnScreen({ phase }: { phase: TurnPhase }) {
  return (
    <div className="flex flex-col items-center">
      <RoundHeader roundNumber={phase.roundNumber} totalRounds={phase.totalRounds} />
      {phase.turnStage === "verdict" && phase.verdict ? (
        <VerdictBadge verdict={phase.verdict} />
      ) : (
        <>
          <CurrentParticipant name={phase.participantName} subtitle={subtitleFor(phase)} />
          <SpellingInProgress spelling={phase.spelling} />
        </>
      )}
    </div>
  );
}
