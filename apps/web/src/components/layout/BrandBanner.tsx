import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface BrandBannerProps {
  right?: ReactNode;
  className?: string;
}

/** The "🍓 nushsgames" brand header used across the landing page and every authenticated page. */
export function BrandBanner({ right, className }: BrandBannerProps) {
  const navigate = useNavigate();

  return (
    <header
      className={cn(
        "flex items-center justify-between border-b-2 border-[oklch(0.9_0.05_340_/_0.6)] bg-[oklch(0.99_0.015_340_/_0.7)] px-8 py-4 backdrop-blur-[6px]",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => navigate("/")}
        className="flex cursor-pointer items-center gap-2.5 border-none bg-transparent p-0 font-fredoka text-lg font-semibold text-[oklch(0.42_0.14_340)]"
      >
        <span className="text-[22px]">🍓</span>nushsgames
      </button>
      {right && (
        <div className="flex items-center gap-3.5 text-sm font-semibold text-[oklch(0.52_0.05_340)]">{right}</div>
      )}
    </header>
  );
}
