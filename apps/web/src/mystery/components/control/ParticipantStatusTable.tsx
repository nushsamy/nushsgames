import { Button } from "@/mystery/components/ui/button";
import { Badge } from "@/mystery/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/mystery/components/ui/table";
import type { ParticipantBallotStatus } from "@/mystery/api/types";

const STATUS_VARIANT: Record<ParticipantBallotStatus["ballotStatus"], "success" | "secondary" | "outline"> = {
  cast: "success",
  pending: "secondary",
  expired: "outline",
};

export function ParticipantStatusTable({
  participants,
  onResend,
}: {
  participants: ParticipantBallotStatus[];
  onResend: (ballotId: string) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Participant</TableHead>
          <TableHead>Status</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {participants.map((p) => (
          <TableRow key={p.participantId}>
            <TableCell className="font-semibold text-[oklch(0.35_0.05_340)]">{p.name}</TableCell>
            <TableCell>
              <Badge variant={STATUS_VARIANT[p.ballotStatus]}>{p.ballotStatus}</Badge>
            </TableCell>
            <TableCell className="text-right">
              {p.ballotStatus === "pending" && (
                <Button variant="ghost" size="sm" onClick={() => onResend(p.ballotId)}>
                  Resend email
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
