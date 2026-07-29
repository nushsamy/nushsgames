import { cn } from "@/lib/utils";
import type { Verdict } from "@/state/displayTypes";

interface VerdictBadgeProps {
  verdict: Verdict;
}

export function VerdictBadge({ verdict }: VerdictBadgeProps) {
  return (
    <div className="mt-10 flex flex-col items-center gap-6">
      <span
        className={cn(
          "animate-pulse rounded-full px-10 py-4 text-proj-verdict font-extrabold uppercase tracking-wide",
          verdict.isCorrect ? "bg-success text-success-foreground" : "bg-destructive text-white",
        )}
      >
        {verdict.isCorrect ? "✓ Correct" : "✗ Incorrect"}
      </span>
      <p className="font-mono text-4xl tracking-widest">{verdict.word.toUpperCase()}</p>
      <p className="text-xl text-muted-foreground">
        {verdict.isCorrect
          ? `${verdict.participantName} advances to the next round!`
          : `${verdict.participantName} is eliminated`}
      </p>
    </div>
  );
}
