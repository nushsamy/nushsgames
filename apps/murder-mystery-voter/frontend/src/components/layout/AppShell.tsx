import { Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { BrandBanner } from "@/components/layout/BrandBanner";

export function AppShell() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="min-h-screen w-full bg-[linear-gradient(160deg,oklch(0.97_0.03_340)_0%,oklch(0.96_0.035_90)_45%,oklch(0.95_0.04_250)_100%)] font-body">
      <BrandBanner
        right={
          <>
            {user && <span>{user.email}</span>}
            <button
              type="button"
              className="h-9 cursor-pointer rounded-full border-2 border-[oklch(0.85_0.06_340)] bg-white px-[18px] font-display text-sm font-bold text-[oklch(0.45_0.14_340)]"
              onClick={() => {
                logout();
                navigate("/auth/login", { replace: true });
              }}
            >
              Log out
            </button>
          </>
        }
      />
      <main className="mx-auto max-w-[860px] px-6 pt-8 pb-[60px]">
        <Outlet />
      </main>
    </div>
  );
}
