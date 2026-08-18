import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import type { Participant } from "@/api/types";

export function AttendanceChecklist({
  participants,
  onSave,
}: {
  participants: Participant[];
  onSave: (presentParticipantIds: number[]) => Promise<void>;
}) {
  const [present, setPresent] = useState<Set<number>>(
    new Set(participants.filter((p) => p.isAttending).map((p) => p.id)),
  );
  const [saving, setSaving] = useState(false);

  function toggle(id: number) {
    setPresent((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave([...present]);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-[oklch(0.42_0.14_340)]">Take Attendance</CardTitle>
        <CardDescription>
          Uncheck anyone who isn't here — only checked participants receive round emails, for this and every
          later round.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {participants.map((p) => (
          <label key={p.id} className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={present.has(p.id)}
              onChange={() => toggle(p.id)}
              className="size-4 accent-[oklch(0.72_0.17_340)]"
            />
            <span className="text-[oklch(0.35_0.05_340)]">{p.name}</span>
            <span className="text-xs text-[oklch(0.6_0.04_340)]">{p.email}</span>
          </label>
        ))}
      </CardContent>
      <CardFooter className="justify-end">
        <Button disabled={saving} onClick={() => void handleSave()}>
          {saving ? "Saving..." : "Save Attendance"}
        </Button>
      </CardFooter>
    </Card>
  );
}
