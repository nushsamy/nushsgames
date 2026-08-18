import { useNavigate } from "react-router-dom";
import { BrandBanner } from "@/components/layout/BrandBanner";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";

export function LandingPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <div className="flex min-h-screen w-full flex-col bg-[linear-gradient(160deg,oklch(0.97_0.03_340)_0%,oklch(0.96_0.035_90)_45%,oklch(0.95_0.04_250)_100%)] font-body">
      <BrandBanner />
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-10 text-center">
        <div className="text-[56px]">🕵️</div>
        <h1 className="font-display text-3xl font-bold text-[oklch(0.42_0.14_340)]">Murder Mystery Voter</h1>
        <p className="max-w-md text-[oklch(0.52_0.05_340)]">
          Build your case, invite your guests, and let them accuse a suspect round by round — right from their inbox.
        </p>
        <Button size="lg" onClick={() => navigate(isAuthenticated ? "/host/events" : "/auth/login")}>
          {isAuthenticated ? "Go to my events" : "Host a mystery"}
        </Button>
      </div>
    </div>
  );
}
