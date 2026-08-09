import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EditWordsModal } from "@/components/roundBuilder/EditWordsModal";
import type { BeeRound } from "@/api/types";

interface RoundListItemProps {
  round: BeeRound;
  onSaveWords: (roundNumber: number, words: string[]) => Promise<boolean>;
  onDelete: (roundNumber: number) => void;
}

export function RoundListItem({ round, onSaveWords, onDelete }: RoundListItemProps) {
  const [editOpen, setEditOpen] = useState(false);
  const preview = round.assignedWords.slice(0, 5).join(", ");
  const wordCount = round.assignedWords.length;

  return (
    <div className="flex items-center justify-between gap-4 rounded-[20px] border-2 border-[oklch(0.9_0.05_340)] bg-[oklch(0.99_0.015_340)] px-5 py-4 shadow-[0_6px_16px_oklch(0.7_0.08_340_/_0.16)]">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-fredoka text-base font-semibold text-[oklch(0.4_0.12_340)]">
            Round {round.roundNumber}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
              wordCount === 0
                ? "bg-[oklch(0.95_0.03_30_/_0.6)] text-[oklch(0.5_0.07_30)]"
                : "bg-[oklch(0.9_0.05_340_/_0.5)] text-[oklch(0.45_0.1_340)]"
            }`}
          >
            {wordCount} word{wordCount === 1 ? "" : "s"}
          </span>
        </div>
        <p className="mt-1 truncate text-[13px] font-semibold text-[oklch(0.6_0.04_340)]">
          {preview || "No words added"}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="h-9 cursor-pointer rounded-full border-2 border-[oklch(0.85_0.06_340)] bg-white px-4 font-fredoka text-[13px] font-bold text-[oklch(0.45_0.14_340)]"
        >
          Edit Words
        </button>
        <ConfirmDialog
          title={`Delete Round ${round.roundNumber}?`}
          description="Subsequent rounds will be renumbered. This cannot be undone."
          onConfirm={() => onDelete(round.roundNumber)}
          trigger={
            <button
              type="button"
              className="h-9 cursor-pointer rounded-full border-2 border-[oklch(0.85_0.1_25_/_0.6)] bg-white px-4 font-fredoka text-[13px] font-bold text-[oklch(0.6_0.15_25)]"
            >
              Delete
            </button>
          }
        />
      </div>
      <EditWordsModal
        round={round}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSave={(words) => onSaveWords(round.roundNumber, words)}
      />
    </div>
  );
}
