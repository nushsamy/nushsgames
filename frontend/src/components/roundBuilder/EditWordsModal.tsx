import { useEffect, useState } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { parseWordList } from "@/lib/wordParsing";
import type { BeeRound } from "@/api/types";

interface EditWordsModalProps {
  round: BeeRound;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (words: string[]) => Promise<boolean>;
}

export function EditWordsModal({ round, open, onOpenChange, onSave }: EditWordsModalProps) {
  const [text, setText] = useState(round.assignedWords.join("\n"));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setText(round.assignedWords.join("\n"));
    }
  }, [open, round.assignedWords]);

  const words = parseWordList(text);

  async function handleSave() {
    if (words.length === 0) return;
    setSaving(true);
    const ok = await onSave(words);
    setSaving(false);
    if (ok) onOpenChange(false);
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed top-1/2 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-[440px] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-[28px] border-2 border-[oklch(0.9_0.05_340)] bg-[oklch(0.99_0.015_340)] px-[26px] py-7 font-nunito shadow-[0_10px_24px_oklch(0.7_0.08_340_/_0.25),0_2px_0_oklch(0.85_0.06_340_/_0.6)_inset] outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
          <div className="flex flex-col gap-1">
            <DialogPrimitive.Title className="font-fredoka text-xl font-semibold text-[oklch(0.42_0.14_340)]">
              Round {round.roundNumber} - Add/Edit Words
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="text-sm font-semibold text-[oklch(0.52_0.05_340)]">
              Paste or type words, one per line (or comma-separated).
            </DialogPrimitive.Description>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            placeholder={"apple\nbanana\ncherry"}
            autoFocus
            className="w-full resize-none rounded-2xl border-2 border-[oklch(0.9_0.05_340)] bg-white px-4 py-3 text-[15px] text-[oklch(0.35_0.05_340)] outline-none placeholder:text-[oklch(0.75_0.03_340)] focus:border-[oklch(0.75_0.15_340)]"
          />
          <p className="text-sm font-semibold text-[oklch(0.55_0.05_340)]">
            {words.length} word{words.length === 1 ? "" : "s"}
          </p>
          <div className="flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-10 cursor-pointer rounded-full border-2 border-[oklch(0.85_0.06_340)] bg-white px-5 font-fredoka text-sm font-bold text-[oklch(0.45_0.14_340)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={words.length === 0 || saving}
              className="h-10 cursor-pointer rounded-full border-none bg-[linear-gradient(135deg,oklch(0.72_0.17_340),oklch(0.75_0.15_20))] px-5 font-fredoka text-sm font-bold text-white shadow-[0_6px_14px_oklch(0.7_0.17_340_/_0.4)] disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Words"}
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
