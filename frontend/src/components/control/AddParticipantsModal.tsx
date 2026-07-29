import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Participants for Round {roundNumber}</DialogTitle>
          <DialogDescription>One name per line (or comma-separated). Optional.</DialogDescription>
        </DialogHeader>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          placeholder="Alice&#10;Bob"
          autoFocus
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => void submit([])} disabled={submitting}>
            Skip
          </Button>
          <Button onClick={() => void submit(parseWordList(text))} disabled={submitting}>
            {submitting ? "Adding..." : mode === "start" ? "Add Participants" : "Add to Next Round"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
