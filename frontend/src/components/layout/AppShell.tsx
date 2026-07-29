import { Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";

export function AppShell() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <span className="font-semibold">Spelling Bee Host</span>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {user && <span>{user.email}</span>}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              logout();
              navigate("/auth/login", { replace: true });
            }}
          >
            Log out
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-6">
        <Outlet />
      </main>
    </div>
  );
}
