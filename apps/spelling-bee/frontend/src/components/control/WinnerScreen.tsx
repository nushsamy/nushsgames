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
      <div className="flex flex-col items-center gap-3 rounded-[26px] border-2 border-[oklch(0.9_0.05_340)] bg-[oklch(0.99_0.015_340)] py-9 text-center shadow-[0_10px_24px_oklch(0.7_0.08_340_/_0.2)]">
        <div className="text-[56px]">🎉</div>
        {winner ? (
          <>
            <p className="m-0 font-fredoka text-lg font-bold tracking-wide text-[oklch(0.6_0.1_60)] uppercase">
              Winner!
            </p>
            <p className="m-0 font-fredoka text-[40px] font-bold text-[oklch(0.45_0.15_20)]">👑 {winner.name} 👑</p>
          </>
        ) : (
          <p className="m-0 font-fredoka text-[28px] font-bold text-[oklch(0.4_0.14_340)]">
            Bee complete — co-finalists
          </p>
        )}
      </div>
      <div className="flex flex-col gap-3 rounded-[26px] border-2 border-[oklch(0.9_0.05_340)] bg-[oklch(0.99_0.015_340)] p-5">
        <p className="m-0 font-fredoka text-lg font-semibold text-[oklch(0.4_0.12_340)]">Final Standings</p>
        <StandingsTable participants={finalStandings} currentRound={currentRound} />
      </div>
    </div>
  );
}
