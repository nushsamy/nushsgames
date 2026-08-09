import { Navigate, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

export function LandingPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/host/bees" replace />;
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[linear-gradient(160deg,oklch(0.97_0.03_340)_0%,oklch(0.96_0.035_90)_45%,oklch(0.95_0.04_250)_100%)] px-4 py-8 font-nunito">
      <div className="relative z-10 flex w-full max-w-[720px] flex-col items-center gap-7">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="animate-[buzz_2.2s_ease-in-out_infinite] text-[72px] drop-shadow-[0_6px_10px_oklch(0.7_0.12_90_/_0.35)]">
            🐝
          </div>
          <h1 className="m-0 font-fredoka text-5xl font-bold tracking-[-0.5px] text-[oklch(0.4_0.14_340)]">
            Spelling Bee
          </h1>
        </div>

        <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2">
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate("/auth/login")}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") navigate("/auth/login");
            }}
            className="flex cursor-pointer flex-col items-center gap-[18px] rounded-[28px] border-2 border-[oklch(0.9_0.05_340)] bg-[oklch(0.99_0.015_340)] px-[22px] py-7 text-center shadow-[0_10px_24px_oklch(0.7_0.08_340_/_0.25),0_2px_0_oklch(0.85_0.06_340_/_0.6)_inset] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <div className="text-[34px]">👑</div>
            <div className="flex flex-col gap-1.5">
              <div className="font-fredoka text-[21px] font-semibold text-[oklch(0.42_0.14_340)]">Host Login</div>
              <div className="text-sm leading-[1.4] font-semibold text-[oklch(0.52_0.05_340)]">
                Sign in to set up and run your own bee.
              </div>
            </div>
            <button
              type="button"
              className="h-[46px] w-full rounded-full border-none bg-[linear-gradient(135deg,oklch(0.72_0.17_340),oklch(0.75_0.15_20))] font-fredoka text-[15px] font-bold text-white shadow-[0_6px_14px_oklch(0.7_0.17_340_/_0.4)]"
            >
              Start hosting
            </button>
          </div>

          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate("/display")}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") navigate("/display");
            }}
            className="flex cursor-pointer flex-col items-center gap-[18px] rounded-[28px] border-2 border-[oklch(0.9_0.045_250)] bg-[oklch(0.99_0.015_250)] px-[22px] py-7 text-center shadow-[0_10px_24px_oklch(0.75_0.06_250_/_0.25),0_2px_0_oklch(0.88_0.05_250_/_0.6)_inset] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <div className="text-[34px]">🎮</div>
            <div className="flex flex-col gap-1.5">
              <div className="font-fredoka text-[21px] font-semibold text-[oklch(0.42_0.1_250)]">Join a Bee</div>
              <div className="text-sm leading-[1.4] font-semibold text-[oklch(0.52_0.05_250)]">
                Pop in a game key and follow along live.
              </div>
            </div>
            <button
              type="button"
              className="h-[46px] w-full rounded-full border-2 border-[oklch(0.8_0.07_250)] bg-[oklch(0.99_0.015_250)] font-fredoka text-[15px] font-bold text-[oklch(0.45_0.12_250)]"
            >
              Join the bee!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
