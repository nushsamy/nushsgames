import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/mystery/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/mystery/components/ui/card";
import { Badge } from "@/mystery/components/ui/badge";
import { ConfirmDialog } from "@/mystery/components/ui/confirm-dialog";
import { AttendanceChecklist } from "@/mystery/components/control/AttendanceChecklist";
import { TallyChart } from "@/mystery/components/control/TallyChart";
import { ParticipantStatusTable } from "@/mystery/components/control/ParticipantStatusTable";
import { ClosedRoundResults } from "@/mystery/components/control/ClosedRoundResults";
import { useControlPanel } from "@/mystery/hooks/useControlPanel";
import { useBreadcrumbStore } from "@/store/breadcrumbStore";
import type { RoundStatus } from "@/mystery/api/types";

const ROUND_BADGE: Record<RoundStatus, "secondary" | "success" | "outline"> = {
  pending: "secondary",
  open: "success",
  closed: "outline",
};

export function ControlPanelPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const id = Number(eventId);
  const panel = useControlPanel(id);
  const [confirmEnd, setConfirmEnd] = useState(false);

  const setBreadcrumbLabel = useBreadcrumbStore((s) => s.setLabel);
  useEffect(() => {
    setBreadcrumbLabel(panel.event?.title ?? null);
    return () => setBreadcrumbLabel(null);
  }, [panel.event?.title, setBreadcrumbLabel]);

  if (panel.loading || !panel.event) {
    return <p className="font-semibold text-[oklch(0.6_0.04_340)]">Loading...</p>;
  }

  const { event } = panel;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-[28px] font-semibold text-[oklch(0.4_0.14_340)]">{event.title}</h1>
          <p className="text-sm font-semibold text-[oklch(0.52_0.05_340)]">
            {event.status === "completed" ? "This mystery has concluded." : `Round ${event.currentRound} of ${event.totalRounds}`}
          </p>
        </div>
        {event.status === "in_progress" && !panel.openRound && (
          <Button variant="destructive" onClick={() => setConfirmEnd(true)}>
            End Mystery
          </Button>
        )}
      </div>

      {panel.takingAttendance && (
        <AttendanceChecklist participants={panel.participants} onSave={panel.saveAttendance} />
      )}

      {event.status !== "completed" && (
        <div className="flex flex-col gap-3">
          {panel.rounds.map((round) => (
            <Card key={round.id}>
              <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
                <div className="flex items-center gap-2">
                  <CardTitle className="font-display text-[oklch(0.35_0.05_340)]">Round {round.roundNumber}</CardTitle>
                  <Badge variant={ROUND_BADGE[round.status]}>{round.status}</Badge>
                </div>
                {round.status === "pending" && (
                  <Button
                    size="sm"
                    disabled={!!panel.openRound}
                    onClick={() => void panel.openRoundAction(round.roundNumber)}
                  >
                    Open Round
                  </Button>
                )}
                {round.status === "open" && (
                  <Button size="sm" variant="outline" onClick={() => void panel.closeRoundAction(round.roundNumber)}>
                    Close Round
                  </Button>
                )}
              </CardHeader>

              {round.status === "open" && panel.tally && (
                <CardContent className="flex flex-col gap-5">
                  <TallyChart tally={panel.tally.tally} />
                  <ParticipantStatusTable
                    participants={panel.tally.participants}
                    onResend={(ballotId) => void panel.resendBallot(ballotId)}
                  />
                </CardContent>
              )}
              {round.status === "closed" && (
                <CardContent>
                  <ClosedRoundResults eventId={id} roundNumber={round.roundNumber} />
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirmEnd}
        title="End this mystery?"
        description="No more rounds can be opened once it's ended."
        confirmLabel="End Mystery"
        destructive
        onCancel={() => setConfirmEnd(false)}
        onConfirm={() => {
          void panel.endEvent();
          setConfirmEnd(false);
        }}
      />
    </div>
  );
}
