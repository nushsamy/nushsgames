interface SpellingInProgressProps {
  spelling: string;
}

export function SpellingInProgress({ spelling }: SpellingInProgressProps) {
  const letters = spelling.split("");

  return (
    <>
      <p className="m-0 mt-6 font-mono text-[52px] font-bold tracking-[12px] text-[oklch(0.42_0.12_250)]">
        {letters.length > 0 ? letters.join("-").toUpperCase() : " "}
        <span className="ml-1 inline-block animate-[proj-blink_1s_step-end_infinite]">▍</span>
      </p>
      <p className="m-0 text-base font-semibold text-[oklch(0.6_0.04_340)]">
        {letters.length} character{letters.length === 1 ? "" : "s"}
      </p>
    </>
  );
}
