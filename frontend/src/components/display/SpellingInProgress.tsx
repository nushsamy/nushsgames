interface SpellingInProgressProps {
  spelling: string;
}

export function SpellingInProgress({ spelling }: SpellingInProgressProps) {
  const letters = spelling.split("");

  return (
    <div className="mt-12 text-center">
      <p className="font-mono text-proj-spelling tracking-widest">
        {letters.length > 0 ? letters.join("-").toUpperCase() : " "}
        <span className="ml-1 inline-block animate-[proj-blink_1s_step-end_infinite]">▍</span>
      </p>
      <p className="mt-4 text-lg text-muted-foreground">
        {letters.length} character{letters.length === 1 ? "" : "s"}
      </p>
    </div>
  );
}
