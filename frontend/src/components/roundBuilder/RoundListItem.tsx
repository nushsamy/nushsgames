import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium">Round {round.roundNumber}</span>
            <Badge variant="secondary">
              {round.assignedWords.length} word{round.assignedWords.length === 1 ? "" : "s"}
            </Badge>
          </div>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {preview || "No words added"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            Edit Words
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                Delete Round
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Round {round.roundNumber}?</AlertDialogTitle>
                <AlertDialogDescription>
                  Subsequent rounds will be renumbered. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(round.roundNumber)}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
      <EditWordsModal
        round={round}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSave={(words) => onSaveWords(round.roundNumber, words)}
      />
    </Card>
  );
}
