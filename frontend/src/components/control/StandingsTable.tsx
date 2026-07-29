import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Participant } from "@/api/types";

interface StandingsTableProps {
  participants: Participant[];
  currentRound: number;
}

export function StandingsTable({ participants, currentRound }: StandingsTableProps) {
  const rows = participants
    .map((p) => ({ participant: p, roundReached: p.eliminatedRound ?? currentRound }))
    .sort((a, b) => {
      if (b.roundReached !== a.roundReached) return b.roundReached - a.roundReached;
      if (a.participant.isEliminated !== b.participant.isEliminated) {
        return a.participant.isEliminated ? 1 : -1;
      }
      return a.participant.name.localeCompare(b.participant.name);
    });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Participant Name</TableHead>
          <TableHead>Round Reached</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map(({ participant, roundReached }) => (
          <TableRow key={participant.id}>
            <TableCell>{participant.name}</TableCell>
            <TableCell>{roundReached}</TableCell>
            <TableCell>
              <Badge variant={participant.isEliminated ? "outline" : "default"}>
                {participant.isEliminated ? "Eliminated" : "Active"}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
