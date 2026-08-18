import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Round, Suspect } from "@/api/types";

interface RoundListItemProps {
  round: Round;
  suspects: Suspect[];
  onSave: (suspectIds: number[]) => Promise<void>;
  onDelete: () => Promise<void>;
}

export function RoundListItem({ round, suspects, onSave, onDelete }: RoundListItemProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set(round.suspectIds));
  const [saving, setSaving] = useState(false);
  const dirty =
    selected.size !== round.suspectIds.length || round.suspectIds.some((id) => !selected.has(id));

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function save() {
    setSaving(true);
    try {
      await onSave([...selected]);
    } finally {
      setSaving(false);
    }
  }

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

      {suspects.length === 0 ? (
        <p className="text-sm font-semibold text-[oklch(0.6_0.04_340)]">Add suspects first, then choose who's eligible this round.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {suspects.map((suspect) => (
            <label key={suspect.id} className="flex cursor-pointer items-center gap-2 text-sm text-[oklch(0.35_0.05_340)]">
              <input
                type="checkbox"
                checked={selected.has(suspect.id)}
                onChange={() => toggle(suspect.id)}
                className="size-4 accent-[oklch(0.72_0.17_340)]"
              />
              {suspect.name}
            </label>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        {round.suspectIds.length === 0 && (
          <span className="text-xs font-semibold text-destructive">No suspects assigned yet</span>
        )}
        <Button size="sm" disabled={!dirty || saving || selected.size === 0} onClick={() => void save()}>
          {saving ? "Saving..." : "Save suspects"}
        </Button>
      </div>
    </Card>
  );
}
