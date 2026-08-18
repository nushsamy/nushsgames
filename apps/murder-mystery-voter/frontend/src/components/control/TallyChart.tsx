import type { SuspectTally } from "@/api/types";

export function TallyChart({ tally }: { tally: SuspectTally[] }) {
  if (tally.length === 0) return null;
  const max = Math.max(1, ...tally.map((t) => t.count));

  return (
    <div className="flex flex-col gap-3">
      {tally.map((t) => (
        <div key={t.suspectId} className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-[oklch(0.35_0.05_340)]">{t.name}</span>
            <span className="font-semibold text-[oklch(0.6_0.04_340)]">
              {t.count} vote{t.count === 1 ? "" : "s"} ({t.percentage}%)
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-[oklch(0.93_0.02_340)]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,oklch(0.72_0.17_340),oklch(0.75_0.15_20))] transition-[width]"
              style={{ width: `${(t.count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
