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
    <div className="overflow-hidden rounded-[20px] border-2 border-[oklch(0.9_0.05_340)] bg-[oklch(0.99_0.015_340)] p-2">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="text-left font-bold text-[oklch(0.55_0.05_340)]">
            <th className="px-3.5 py-2.5 font-fredoka font-bold">Participant</th>
            <th className="px-3.5 py-2.5 font-fredoka font-bold">Round Reached</th>
            <th className="px-3.5 py-2.5 font-fredoka font-bold">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ participant, roundReached }) => (
            <tr key={participant.id} className="border-t border-[oklch(0.92_0.03_340)]">
              <td className="px-3.5 py-2.5 font-semibold text-[oklch(0.4_0.06_340)]">{participant.name}</td>
              <td className="px-3.5 py-2.5 text-[oklch(0.5_0.04_340)]">{roundReached}</td>
              <td className="px-3.5 py-2.5">
                <span
                  className={`rounded-full px-3 py-[3px] text-xs font-bold ${
                    participant.isEliminated
                      ? "bg-[oklch(0.93_0.03_340)] text-[oklch(0.55_0.05_340)]"
                      : "bg-[oklch(0.9_0.1_145_/_0.5)] text-[oklch(0.4_0.1_145)]"
                  }`}
                >
                  {participant.isEliminated ? "Eliminated" : "Active"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
