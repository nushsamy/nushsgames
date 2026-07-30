interface RoundHeaderProps {
  roundNumber: number;
  totalRounds: number;
}

export function RoundHeader({ roundNumber, totalRounds }: RoundHeaderProps) {
  return (
    <p className="m-0 font-fredoka text-xl font-bold tracking-wide text-[oklch(0.55_0.08_250)] uppercase">
      Round {roundNumber}
      {totalRounds > 0 && (
        <span className="ml-1 text-base font-bold tracking-normal text-[oklch(0.6_0.04_340)] normal-case">
          of {totalRounds}
        </span>
      )}
    </p>
  );
}
