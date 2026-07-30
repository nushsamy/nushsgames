import type { BeeStatus } from "@/api/types";

const LABELS: Record<BeeStatus, string> = {
  created: "Draft",
  in_progress: "In Progress",
  completed: "Completed",
};

const COLORS: Record<BeeStatus, string> = {
  created: "bg-[oklch(0.92_0.03_340_/_0.7)] text-[oklch(0.5_0.05_340)]",
  in_progress: "bg-[oklch(0.9_0.1_145_/_0.5)] text-[oklch(0.4_0.1_145)]",
  completed: "bg-[oklch(0.92_0.05_60_/_0.6)] text-[oklch(0.5_0.08_60)]",
};

export function BeeStatusBadge({ status }: { status: BeeStatus }) {
  return (
    <span className={`rounded-full px-3 py-[3px] text-xs font-bold ${COLORS[status]}`}>{LABELS[status]}</span>
  );
}
