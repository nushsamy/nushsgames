import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FullScreenLayoutProps {
  children: ReactNode;
  transitionKey: string;
}

export function FullScreenLayout({ children, transitionKey }: FullScreenLayoutProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, [transitionKey]);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[linear-gradient(160deg,oklch(0.97_0.03_340)_0%,oklch(0.96_0.035_90)_45%,oklch(0.95_0.04_250)_100%)] px-8 py-12 font-nunito">
      <div
        key={transitionKey}
        className={cn(
          "w-full max-w-3xl transition-opacity duration-400",
          visible ? "opacity-100" : "opacity-0",
        )}
      >
        {children}
      </div>
    </div>
  );
}
