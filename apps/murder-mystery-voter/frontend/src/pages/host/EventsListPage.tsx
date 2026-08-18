import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EventStatusBadge } from "@/components/events/EventStatusBadge";
import { useEventsList } from "@/hooks/useEventsList";

export function EventsListPage() {
  const navigate = useNavigate();
  const { events, loading, removeEvent } = useEventsList();
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  function controlPath(eventId: number, status: string): string {
    return status === "created" ? `/host/${eventId}/builder` : `/host/${eventId}/control`;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-[28px] font-semibold text-[oklch(0.4_0.14_340)]">Your Mysteries</h1>
        <Button onClick={() => navigate("/host/create")}>+ New Mystery</Button>
      </div>

      {loading && <p className="font-semibold text-[oklch(0.6_0.04_340)]">Loading...</p>}
      {!loading && events.length === 0 && (
        <p className="font-semibold text-[oklch(0.6_0.04_340)]">🔎 No mysteries yet. Create one to get started.</p>
      )}

      <div className="flex flex-col gap-3.5">
        {events.map((event) => (
          <Card
            key={event.id}
            className="cursor-pointer flex-row items-center justify-between px-6 py-4"
            onClick={() => navigate(controlPath(event.id, event.status))}
          >
            <div className="flex flex-col gap-1">
              <div className="font-display text-lg font-semibold text-[oklch(0.35_0.05_340)]">{event.title}</div>
              <div className="flex items-center gap-2 text-xs text-[oklch(0.6_0.04_340)]">
                <EventStatusBadge status={event.status} />
                {event.totalRounds > 0 && <span>{event.totalRounds} round(s)</span>}
              </div>
            </div>
            {event.status === "created" && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  setPendingDeleteId(event.id);
                }}
              >
                Delete
              </Button>
            )}
          </Card>
        ))}
      </div>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Delete this mystery?"
        description="This cannot be undone."
        destructive
        confirmLabel="Delete"
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => {
          if (pendingDeleteId !== null) void removeEvent(pendingDeleteId);
          setPendingDeleteId(null);
        }}
      />
    </div>
  );
}
