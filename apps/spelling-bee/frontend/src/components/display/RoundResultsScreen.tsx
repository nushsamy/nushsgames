interface RoundResultsScreenProps {
  roundNumber: number;
  advancedParticipants: string[];
}

export function RoundResultsScreen({ roundNumber, advancedParticipants }: RoundResultsScreenProps) {
  return (
    <div className="text-center">
      <h1 className="text-proj-round font-bold">Round {roundNumber} Complete!</h1>
      <p className="mt-8 text-2xl text-muted-foreground">Advancing to the next round:</p>
      {advancedParticipants.length > 0 ? (
        <ul className="mt-6 space-y-2 text-4xl font-semibold">
          {advancedParticipants.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 text-3xl font-semibold text-muted-foreground">No one advanced</p>
      )}
    </div>
  );
}
