import { useNavigate } from "react-router-dom";
import { BeeStatusBadge } from "@/components/bees/BeeStatusBadge";
import { DeleteBeeDialog } from "@/components/bees/DeleteBeeDialog";
import type { SpellingBee } from "@/api/types";

interface BeeCardProps {
  bee: SpellingBee;
  onDelete: (beeId: number) => void;
  onReopen: (beeId: number) => Promise<boolean>;
}

const PILL_BASE = "h-[38px] shrink-0 cursor-pointer rounded-full border-none px-5 font-fredoka text-sm font-bold";
const PILL_GRADIENT =
  "bg-[linear-gradient(135deg,oklch(0.72_0.17_340),oklch(0.75_0.15_20))] text-white";
const PILL_OUTLINE_PINK = "border-2 border-[oklch(0.85_0.06_340)] bg-white text-[oklch(0.45_0.14_340)]";
const PILL_OUTLINE_RED = "border-2 border-[oklch(0.85_0.1_25_/_0.6)] bg-white text-[oklch(0.6_0.15_25)]";
const PILL_SOLID_BLUE = "bg-[oklch(0.72_0.14_250)] text-white";

export function BeeCard({ bee, onDelete, onReopen }: BeeCardProps) {
  const navigate = useNavigate();

  const actionLabel = bee.status === "created" ? "Edit" : bee.status === "in_progress" ? "Control" : "View Results";
  const actionPath = bee.status === "created" ? `/host/${bee.id}/builder` : `/host/${bee.id}/control`;

  async function handleReopen() {
    const ok = await onReopen(bee.id);
    if (ok) navigate(`/host/${bee.id}/builder`);
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-[22px] border-2 border-[oklch(0.9_0.05_340)] bg-[oklch(0.99_0.015_340)] px-[22px] py-[18px] shadow-[0_6px_16px_oklch(0.7_0.08_340_/_0.18)]">
      <div>
        <div className="flex items-center gap-2.5">
          <span className="font-fredoka text-[17px] font-semibold text-[oklch(0.4_0.12_340)]">{bee.title}</span>
          <BeeStatusBadge status={bee.status} />
        </div>
        <p className="mt-1 text-[13px] font-semibold text-[oklch(0.6_0.04_340)]">
          {new Date(bee.createdAt).toLocaleDateString()} &middot; {bee.totalRounds} round
          {bee.totalRounds === 1 ? "" : "s"}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          className={`${PILL_BASE} ${bee.status === "in_progress" ? PILL_SOLID_BLUE : PILL_GRADIENT}`}
          onClick={() => navigate(actionPath)}
        >
          {actionLabel}
        </button>
        {bee.status === "completed" && (
          <button type="button" className={`${PILL_BASE} ${PILL_OUTLINE_PINK}`} onClick={() => void handleReopen()}>
            Start Again
          </button>
        )}
        {bee.status === "created" && (
          <DeleteBeeDialog
            title={bee.title}
            onConfirm={() => onDelete(bee.id)}
            trigger={
              <button type="button" className={`${PILL_BASE} ${PILL_OUTLINE_RED}`}>
                Delete
              </button>
            }
          />
        )}
      </div>
    </div>
  );
}
