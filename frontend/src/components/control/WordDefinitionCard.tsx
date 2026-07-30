import { BookOpen } from "lucide-react";
import { useWordDefinition } from "@/hooks/useWordDefinition";

export function WordDefinitionCard({ word }: { word: string }) {
  const { status, partOfSpeech, definition } = useWordDefinition(word);

  return (
    <div className="rounded-[20px] border-2 border-[oklch(0.9_0.05_340)] bg-[oklch(0.99_0.015_340)] p-5">
      <div className="mb-2.5 flex items-center gap-2">
        <BookOpen className="size-4 text-[oklch(0.55_0.08_250)]" />
        <p className="m-0 font-fredoka text-sm font-bold text-[oklch(0.45_0.12_340)]">Definition</p>
      </div>

      {status === "loading" && (
        <p className="m-0 text-sm font-semibold text-[oklch(0.6_0.04_340)]">Looking up definition&hellip;</p>
      )}

      {status === "success" && (
        <div className="flex flex-col gap-1.5">
          {partOfSpeech && (
            <span className="inline-block w-fit rounded-2xl border-2 border-[oklch(0.88_0.06_60)] bg-[oklch(0.95_0.04_60)] px-3 py-0.5 text-[11px] font-bold tracking-wide text-[oklch(0.55_0.06_60)] uppercase">
              {partOfSpeech}
            </span>
          )}
          <p className="m-0 font-nunito text-[15px] text-[oklch(0.35_0.05_340)]">{definition}</p>
        </div>
      )}

      {status === "not-found" && (
        <p className="m-0 text-sm font-semibold text-[oklch(0.6_0.04_340)]">
          No dictionary definition found for this word.
        </p>
      )}

      {status === "error" && (
        <p className="m-0 text-sm font-semibold text-[oklch(0.6_0.04_340)]">
          Couldn't load a definition right now.
        </p>
      )}
    </div>
  );
}
