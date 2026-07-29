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
    <div className="dark flex min-h-screen w-full items-center justify-center bg-background px-8 py-12 text-foreground">
      <div
        key={transitionKey}
        className={cn("w-full max-w-5xl transition-opacity duration-400", visible ? "opacity-100" : "opacity-0")}
      >
        {children}
      </div>
    </div>
  );
}
