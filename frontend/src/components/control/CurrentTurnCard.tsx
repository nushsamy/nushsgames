import { Card, CardContent } from "@/components/ui/card";
import type { CurrentTurn } from "@/api/types";

interface CurrentTurnCardProps {
  roundNumber: number;
  currentTurn: CurrentTurn;
}

export function CurrentTurnCard({ roundNumber, currentTurn }: CurrentTurnCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
        <p className="text-lg font-medium text-muted-foreground">ROUND {roundNumber}</p>
        <p className="text-5xl font-bold">{currentTurn.participant.name}'s Turn</p>
        <div className="mt-4 rounded-md border bg-muted px-4 py-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Word (Host Only)</p>
          <p className="text-lg font-semibold">{currentTurn.word}</p>
        </div>
      </CardContent>
    </Card>
  );
}
