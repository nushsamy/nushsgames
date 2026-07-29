import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function GamekeyBox({ gamekey }: { gamekey: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(gamekey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex items-center gap-2 rounded-md border bg-muted px-3 py-2">
      <span className="text-sm text-muted-foreground">Game Key:</span>
      <span className="font-mono font-semibold">{gamekey}</span>
      <Button variant="ghost" size="icon-sm" onClick={handleCopy} aria-label="Copy game key">
        {copied ? <Check className="text-success" /> : <Copy />}
      </Button>
    </div>
  );
}
