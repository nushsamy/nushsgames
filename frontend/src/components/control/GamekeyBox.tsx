import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function GamekeyBox({ gamekey }: { gamekey: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(gamekey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex items-center gap-2 rounded-full border-2 border-[oklch(0.88_0.05_340)] bg-[oklch(0.95_0.03_340)] px-4 py-2">
      <span className="text-[13px] font-semibold text-[oklch(0.55_0.05_340)]">Game Key:</span>
      <span className="font-fredoka font-bold tracking-wide text-[oklch(0.4_0.12_340)]">{gamekey}</span>
      <button
        type="button"
        onClick={() => void handleCopy()}
        aria-label="Copy game key"
        className="flex size-6 cursor-pointer items-center justify-center rounded-full border-none bg-transparent text-[oklch(0.55_0.05_340)]"
      >
        {copied ? <Check className="size-4 text-[oklch(0.5_0.12_145)]" /> : <Copy className="size-4" />}
      </button>
    </div>
  );
}
