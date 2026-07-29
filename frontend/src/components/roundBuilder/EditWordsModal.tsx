import { useEffect, useState } from "react";
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Round {round.roundNumber} - Add/Edit Words</DialogTitle>
          <DialogDescription>Paste or type words, one per line (or comma-separated).</DialogDescription>
        </DialogHeader>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          placeholder="apple&#10;banana&#10;cherry"
          autoFocus
        />
        <p className="text-sm text-muted-foreground">{words.length} word{words.length === 1 ? "" : "s"}</p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={words.length === 0 || saving}>
            {saving ? "Saving..." : "Save Words"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
