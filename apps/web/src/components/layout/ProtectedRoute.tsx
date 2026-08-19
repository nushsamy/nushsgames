import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const sessionChecked = useAuthStore((s) => s.sessionChecked);

  // The session bootstrap (see App.tsx / useAuthBootstrap) runs once per page load and may
  // still be in flight -- wait for it rather than redirecting on a false "not authenticated".
  if (!sessionChecked) {
    return null;
  }
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }
  return <Outlet />;
}
