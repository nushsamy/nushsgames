import { useState } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { parseWordList } from "@/lib/wordParsing";

interface AddParticipantsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roundNumber: number;
  mode: "start" | "advance";
  /** Receives the parsed names (empty array if skipped); caller owns ordering/sequencing. */
  onSubmit: (names: string[]) => Promise<void>;
}

export function AddParticipantsModal({
  open,
  onOpenChange,
  roundNumber,
  mode,
  onSubmit,
}: AddParticipantsModalProps) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(names: string[]) {
    setSubmitting(true);
    try {
      await onSubmit(names);
    } finally {
      setSubmitting(false);
      setText("");
      onOpenChange(false);
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed top-1/2 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-[440px] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-[28px] border-2 border-[oklch(0.9_0.05_340)] bg-[oklch(0.99_0.015_340)] px-[26px] py-7 font-nunito shadow-[0_10px_24px_oklch(0.7_0.08_340_/_0.25),0_2px_0_oklch(0.85_0.06_340_/_0.6)_inset] outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
          <div className="flex flex-col gap-1">
            <DialogPrimitive.Title className="font-fredoka text-xl font-semibold text-[oklch(0.42_0.14_340)]">
              Add Participants for Round {roundNumber}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="text-sm font-semibold text-[oklch(0.52_0.05_340)]">
              One name per line (or comma-separated). Optional.
            </DialogPrimitive.Description>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder={"Alice\nBob"}
            autoFocus
            className="w-full resize-none rounded-2xl border-2 border-[oklch(0.9_0.05_340)] bg-white px-4 py-3 text-[15px] text-[oklch(0.35_0.05_340)] outline-none placeholder:text-[oklch(0.75_0.03_340)] focus:border-[oklch(0.75_0.15_340)]"
          />
          <div className="flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => void submit([])}
              disabled={submitting}
              className="h-10 cursor-pointer rounded-full border-2 border-[oklch(0.85_0.06_340)] bg-white px-5 font-fredoka text-sm font-bold text-[oklch(0.45_0.14_340)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={() => void submit(parseWordList(text))}
              disabled={submitting}
              className="h-10 cursor-pointer rounded-full border-none bg-[linear-gradient(135deg,oklch(0.72_0.17_340),oklch(0.75_0.15_20))] px-5 font-fredoka text-sm font-bold text-white shadow-[0_6px_14px_oklch(0.7_0.17_340_/_0.4)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Adding..." : mode === "start" ? "Add Participants" : "Add to Next Round"}
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
