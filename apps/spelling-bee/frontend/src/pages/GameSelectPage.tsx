import { useNavigate } from "react-router-dom";

export function GameSelectPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-fredoka text-[28px] font-semibold text-[oklch(0.4_0.14_340)]">Choose a Game to Host</h1>

      <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2">
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate("/host/bees")}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") navigate("/host/bees");
          }}
          className="flex cursor-pointer flex-col items-center gap-[18px] rounded-[28px] border-2 border-[oklch(0.9_0.05_340)] bg-[oklch(0.99_0.015_340)] px-[22px] py-7 text-center shadow-[0_10px_24px_oklch(0.7_0.08_340_/_0.25),0_2px_0_oklch(0.85_0.06_340_/_0.6)_inset] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <div className="text-[34px]">🐝</div>
          <div className="flex flex-col gap-1.5">
            <div className="font-fredoka text-[21px] font-semibold text-[oklch(0.42_0.14_340)]">
              Host a Spelling Bee
            </div>
            <div className="text-sm leading-[1.4] font-semibold text-[oklch(0.52_0.05_340)]">
              Build rounds, run live turns, and track standings.
            </div>
          </div>
          <button
            type="button"
            className="h-[46px] w-full rounded-full border-none bg-[linear-gradient(135deg,oklch(0.72_0.17_340),oklch(0.75_0.15_20))] font-fredoka text-[15px] font-bold text-white shadow-[0_6px_14px_oklch(0.7_0.17_340_/_0.4)]"
          >
            Go to My Bees
          </button>
        </div>

        <div
          aria-disabled="true"
          className="flex cursor-not-allowed flex-col items-center gap-[18px] rounded-[28px] border-2 border-[oklch(0.9_0.02_270)] bg-[oklch(0.96_0.01_270)] px-[22px] py-7 text-center opacity-60"
        >
          <div className="text-[34px]">🔪</div>
          <div className="flex flex-col gap-1.5">
            <div className="font-fredoka text-[21px] font-semibold text-[oklch(0.42_0.02_270)]">
              Host a Murder Mystery
            </div>
            <div className="text-sm leading-[1.4] font-semibold text-[oklch(0.55_0.02_270)]">Coming soon.</div>
          </div>
          <button
            type="button"
            disabled
            className="h-[46px] w-full cursor-not-allowed rounded-full border-2 border-[oklch(0.85_0.02_270)] bg-[oklch(0.92_0.01_270)] font-fredoka text-[15px] font-bold text-[oklch(0.55_0.02_270)]"
          >
            Coming Soon
          </button>
        </div>
      </div>
    </div>
  );
}
