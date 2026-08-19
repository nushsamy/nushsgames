import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { refreshSession, getMe } from "@/api/auth";

/**
 * Runs once per page load, regardless of which route you land on first. Without this, only
 * routes that explicitly check would ever notice a session cookie set by logging into the
 * *other* nushsgames app -- e.g. landing directly on /auth/login would just show the form,
 * since that page never had a reason to ask the auth service about an existing session.
 */
export function useAuthBootstrap(): void {
  const sessionChecked = useAuthStore((s) => s.sessionChecked);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setSession = useAuthStore((s) => s.setSession);
  const markSessionChecked = useAuthStore((s) => s.markSessionChecked);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (sessionChecked) return;

    // Already have a locally-persisted session -- no need to ask the auth service, but every
    // page gated on `sessionChecked` (ProtectedRoute, LoginPage, RegisterPage) is waiting on
    // this flag either way, so it must still be marked, or those pages stay blank forever.
    if (isAuthenticated) {
      markSessionChecked();
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const { accessToken } = await refreshSession();
        const { user } = await getMe(accessToken);
        if (!cancelled) setSession({ user, accessToken });
      } catch {
        if (!cancelled) logout();
      } finally {
        if (!cancelled) markSessionChecked();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionChecked, isAuthenticated, setSession, markSessionChecked, logout]);
}
