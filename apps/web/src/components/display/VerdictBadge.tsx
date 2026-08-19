import { cn } from "@/lib/utils";
import type { Verdict } from "@/state/displayTypes";

interface VerdictBadgeProps {
  verdict: Verdict;
}

export function VerdictBadge({ verdict }: VerdictBadgeProps) {
  return (
    <div className="flex flex-col items-center gap-5">
      <span
        className={cn(
          "animate-[proj-pop-in_0.3s_ease-out] rounded-full px-14 py-6 text-[40px] font-bold uppercase tracking-wide",
          verdict.isCorrect
            ? "bg-[oklch(0.85_0.13_145)] text-[oklch(0.28_0.08_145)] shadow-[0_10px_26px_oklch(0.7_0.1_145_/_0.4)]"
            : "bg-[oklch(0.85_0.1_25)] text-[oklch(0.32_0.12_25)] shadow-[0_10px_26px_oklch(0.7_0.12_25_/_0.4)]",
        )}
      >
        {verdict.isCorrect ? "✓ Correct" : "✗ Incorrect"}
      </span>
      {verdict.isCorrect ? (
        <p className="m-0 font-mono text-[34px] font-bold tracking-[6px] text-[oklch(0.42_0.1_340)]">{verdict.word.toUpperCase()}</p>
      ) : (
        <div className="flex animate-[proj-pop-in_0.3s_ease-out] flex-col items-center gap-3">
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm font-semibold uppercase tracking-wide text-[oklch(0.5_0.05_340)]">Your spelling</span>
            <p className="m-0 font-mono text-[34px] font-bold tracking-[6px] text-[oklch(0.32_0.12_25)]">{verdict.userSpelling.toUpperCase()}</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm font-semibold uppercase tracking-wide text-[oklch(0.5_0.05_340)]">✓ Correct spelling</span>
            <p className="m-0 font-mono text-[34px] font-bold tracking-[6px] text-[oklch(0.28_0.08_145)]">{verdict.word.toUpperCase()}</p>
          </div>
        </div>
      )}
      <p className="m-0 text-[19px] font-semibold text-[oklch(0.5_0.05_340)]">
        {verdict.isCorrect
          ? `${verdict.participantName} advances to the next round!`
          : `${verdict.participantName} is eliminated`}
      </p>
    </div>
  );
}
