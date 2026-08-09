import { Link, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useBreadcrumbStore } from "@/store/breadcrumbStore";
import { BrandBanner } from "@/components/layout/BrandBanner";

interface Crumb {
  label: string;
  path?: string;
}

function useBreadcrumbs(): Crumb[] {
  const { pathname } = useLocation();
  const { beeId } = useParams<{ beeId?: string }>();
  const dynamicLabel = useBreadcrumbStore((s) => s.label);

  if (pathname === "/games") {
    return [{ label: "Games" }];
  }
  if (pathname === "/host/bees") {
    return [{ label: "Games", path: "/games" }, { label: "My Bees" }];
  }
  if (pathname === "/host/create") {
    return [{ label: "Games", path: "/games" }, { label: "My Bees", path: "/host/bees" }, { label: "New Bee" }];
  }
  if (pathname.endsWith("/builder") && beeId) {
    return [
      { label: "Games", path: "/games" },
      { label: "My Bees", path: "/host/bees" },
      { label: dynamicLabel ?? "Bee" },
    ];
  }
  if (pathname.endsWith("/control") && beeId) {
    return [
      { label: "Games", path: "/games" },
      { label: "My Bees", path: "/host/bees" },
      { label: dynamicLabel ?? "Bee", path: `/host/${beeId}/builder` },
      { label: "Control" },
    ];
  }
  return [];
}

function Breadcrumbs() {
  const crumbs = useBreadcrumbs();
  if (crumbs.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="mx-auto max-w-[820px] px-6 pt-5 text-sm font-semibold">
      {crumbs.map((crumb, i) => (
        <span key={i}>
          {i > 0 && <span className="mx-1.5 text-[oklch(0.8_0.03_340)]">/</span>}
          {crumb.path ? (
            <Link to={crumb.path} className="text-[oklch(0.55_0.12_340)] hover:underline">
              {crumb.label}
            </Link>
          ) : (
            <span className="text-[oklch(0.4_0.12_340)]">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function AppShell() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="min-h-screen w-full bg-[linear-gradient(160deg,oklch(0.97_0.03_340)_0%,oklch(0.96_0.035_90)_45%,oklch(0.95_0.04_250)_100%)] font-nunito">
      <BrandBanner
        right={
          <>
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
          </>
        }
      />
      <Breadcrumbs />
      <main className="mx-auto max-w-[820px] px-6 pt-4 pb-[60px]">
        <Outlet />
      </main>
    </div>
  );
}
