import { Button } from "@/mystery/components/ui/button";
import { Card } from "@/mystery/components/ui/card";
import type { Round, Participant } from "@/mystery/api/types";

interface RoundListItemProps {
  round: Round;
  cast: Participant[];
  onDelete: () => Promise<void>;
}

export function RoundListItem({ round, cast, onDelete }: RoundListItemProps) {
  return (
    <Card className="px-5 py-4">
      <div className="flex items-center justify-between">
        <div className="font-display text-base font-semibold text-[oklch(0.35_0.05_340)]">
          Round {round.roundNumber}
        </div>
        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => void onDelete()}>
          Remove
        </Button>
      </div>

      <p className="text-sm font-semibold text-[oklch(0.6_0.04_340)]">
        {cast.length === 0
          ? "Add cast members first -- everyone in the cast is a suspect in every round."
          : cast.length === 1
            ? "The 1 cast member is a suspect this round."
            : `All ${cast.length} cast members are suspects this round.`}
      </p>
    </Card>
  );
}
