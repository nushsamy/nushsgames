import { Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

export function AppShell() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="min-h-screen w-full bg-[linear-gradient(160deg,oklch(0.97_0.03_340)_0%,oklch(0.96_0.035_90)_45%,oklch(0.95_0.04_250)_100%)] font-nunito">
      <header className="flex items-center justify-between border-b-2 border-[oklch(0.9_0.05_340_/_0.6)] bg-[oklch(0.99_0.015_340_/_0.7)] px-8 py-4 backdrop-blur-[6px]">
        <span className="flex items-center gap-2.5 font-fredoka text-lg font-semibold text-[oklch(0.42_0.14_340)]">
          <span className="text-[22px]">🐝</span>Spelling Bee Host
        </span>
        <div className="flex items-center gap-3.5 text-sm font-semibold text-[oklch(0.52_0.05_340)]">
          {user && <span>{user.email}</span>}
          <button
            type="button"
            className="h-9 cursor-pointer rounded-full border-2 border-[oklch(0.85_0.06_340)] bg-white px-[18px] font-fredoka text-sm font-bold text-[oklch(0.45_0.14_340)]"
            onClick={() => {
              logout();
              navigate("/auth/login", { replace: true });
            }}
          >
            Log out
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-[820px] px-6 pt-9 pb-[60px]">
        <Outlet />
      </main>
    </div>
  );
}
