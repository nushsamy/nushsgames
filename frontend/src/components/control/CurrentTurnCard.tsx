import type { CurrentTurn } from "@/api/types";

interface CurrentTurnCardProps {
  roundNumber: number;
  currentTurn: CurrentTurn;
}

export function CurrentTurnCard({ roundNumber, currentTurn }: CurrentTurnCardProps) {
  return (
    <div className="flex flex-col items-center gap-2.5 rounded-[26px] border-2 border-[oklch(0.9_0.05_340)] bg-[oklch(0.99_0.015_340)] px-5 py-8 text-center shadow-[0_10px_24px_oklch(0.7_0.08_340_/_0.2)]">
      <p className="m-0 font-fredoka text-sm font-semibold tracking-wide text-[oklch(0.55_0.08_250)] uppercase">
        Round {roundNumber}
      </p>
      <p className="m-0 font-fredoka text-[34px] font-bold text-[oklch(0.4_0.14_340)]">
        {currentTurn.participant.name}'s Turn
      </p>
      <div className="mt-2 rounded-2xl border-2 border-[oklch(0.88_0.06_60)] bg-[oklch(0.95_0.04_60)] px-5 py-2.5">
        <p className="m-0 text-[11px] font-bold tracking-wide text-[oklch(0.55_0.06_60)] uppercase">
          Word (Host Only)
        </p>
        <p className="m-0 mt-0.5 text-[17px] font-bold text-[oklch(0.4_0.08_60)]">{currentTurn.word}</p>
      </div>
    </div>
  );
}
