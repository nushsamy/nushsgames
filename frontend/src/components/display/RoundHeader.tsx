interface RoundHeaderProps {
  roundNumber: number;
  totalRounds: number;
}

export function RoundHeader({ roundNumber, totalRounds }: RoundHeaderProps) {
  return (
    <div className="text-center">
      <h1 className="text-proj-round font-bold tracking-tight">Round {roundNumber}</h1>
      {totalRounds > 0 && <p className="mt-2 text-2xl text-muted-foreground">of {totalRounds}</p>}
    </div>
  );
}
