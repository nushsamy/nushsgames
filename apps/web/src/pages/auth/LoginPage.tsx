import { useState, type FormEvent } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import * as authApi from "@/api/auth";
import { ApiError } from "@/api/httpClient";
import { useAuthStore } from "@/store/authStore";
import { BrandBanner } from "@/components/layout/BrandBanner";

export function LoginPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const sessionChecked = useAuthStore((s) => s.sessionChecked);
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Email and password are required");
      return;
    }
    setSubmitting(true);
    try {
      const session = await authApi.login(email.trim(), password);
      setSession(session);
      navigate("/games", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  // Wait for the session bootstrap before committing to the login form -- it may still be
  // in flight (e.g. a valid session cookie just needs to be exchanged for a fresh token).
  if (!sessionChecked) {
    return null;
  }
  if (isAuthenticated) {
    return <Navigate to="/games" replace />;
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-[linear-gradient(160deg,oklch(0.97_0.03_340)_0%,oklch(0.96_0.035_90)_45%,oklch(0.95_0.04_250)_100%)] font-nunito">
      <BrandBanner />
      <div className="flex flex-1 items-center justify-center px-4 py-6">
        <div className="flex w-full max-w-[380px] flex-col items-center gap-5">
          <div className="animate-[buzz_2.2s_ease-in-out_infinite] text-[56px] drop-shadow-[0_6px_10px_oklch(0.7_0.12_90_/_0.35)]">
            👑
          </div>

          <div className="flex w-full flex-col gap-[18px] rounded-[28px] border-2 border-[oklch(0.9_0.05_340)] bg-[oklch(0.99_0.015_340)] px-[26px] py-8 shadow-[0_10px_24px_oklch(0.7_0.08_340_/_0.25),0_2px_0_oklch(0.85_0.06_340_/_0.6)_inset]">
            <div className="flex flex-col gap-1 text-center">
              <div className="font-fredoka text-2xl font-semibold text-[oklch(0.42_0.14_340)]">Login</div>
              <div className="text-sm font-semibold text-[oklch(0.52_0.05_340)]">Sign in to run your own games</div>
            </div>

            <form className="flex flex-col gap-3.5" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-[13px] font-bold text-[oklch(0.42_0.1_340)]">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="h-11 rounded-2xl border-2 border-[oklch(0.9_0.05_340)] bg-white px-4 text-[15px] text-[oklch(0.35_0.05_340)] outline-none placeholder:text-[oklch(0.75_0.03_340)] focus:border-[oklch(0.75_0.15_340)]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-[13px] font-bold text-[oklch(0.42_0.1_340)]">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="h-11 rounded-2xl border-2 border-[oklch(0.9_0.05_340)] bg-white px-4 text-[15px] text-[oklch(0.35_0.05_340)] outline-none placeholder:text-[oklch(0.75_0.03_340)] focus:border-[oklch(0.75_0.15_340)]"
                />
              </div>
              {error && <p className="text-sm font-semibold text-destructive">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="mt-1.5 h-[46px] w-full rounded-full border-none bg-[linear-gradient(135deg,oklch(0.72_0.17_340),oklch(0.75_0.15_20))] font-fredoka text-[15px] font-bold text-white shadow-[0_6px_14px_oklch(0.7_0.17_340_/_0.4)] disabled:opacity-60"
              >
                {submitting ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <p className="m-0 text-center text-sm font-semibold text-[oklch(0.52_0.05_340)]">
              No account?{" "}
              <Link
                to="/auth/register"
                className="font-bold text-[oklch(0.55_0.16_340)] underline hover:text-[oklch(0.45_0.18_340)]"
              >
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
