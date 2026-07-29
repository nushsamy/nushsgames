import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StandingsTable } from "@/components/control/StandingsTable";
import type { Participant } from "@/api/types";

interface WinnerScreenProps {
  winner: { id: number; name: string } | null;
  finalStandings: Participant[];
  currentRound: number;
}

export function WinnerScreen({ winner, finalStandings, currentRound }: WinnerScreenProps) {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-4xl">
            {winner ? `Winner: ${winner.name}` : "Bee complete — co-finalists"}
          </CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Final Standings</CardTitle>
        </CardHeader>
        <CardContent>
          <StandingsTable participants={finalStandings} currentRound={currentRound} />
        </CardContent>
      </Card>
    </div>
  );
}
