import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import * as authApi from "@/api/auth";
import { ApiError } from "@/api/httpClient";
import { useAuthStore } from "@/store/authStore";
import { BrandBanner } from "@/components/layout/BrandBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginPage() {
  const navigate = useNavigate();
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
      navigate("/host/events", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-[linear-gradient(160deg,oklch(0.97_0.03_340)_0%,oklch(0.96_0.035_90)_45%,oklch(0.95_0.04_250)_100%)] font-body">
      <BrandBanner />
      <div className="flex flex-1 items-center justify-center px-4 py-6">
        <div className="flex w-full max-w-[380px] flex-col items-center gap-5">
          <div className="text-[48px]">🔎</div>

          <div className="flex w-full flex-col gap-[18px] rounded-[28px] border-2 border-[oklch(0.9_0.05_340)] bg-[oklch(0.99_0.015_340)] px-[26px] py-8 shadow-[0_10px_24px_oklch(0.7_0.08_340_/_0.25),0_2px_0_oklch(0.85_0.06_340_/_0.6)_inset]">
            <div className="flex flex-col gap-1 text-center">
              <div className="font-display text-2xl font-semibold text-[oklch(0.42_0.14_340)]">Login</div>
              <div className="text-sm font-semibold text-[oklch(0.52_0.05_340)]">Sign in to host your own mysteries</div>
            </div>

            <form className="flex flex-col gap-3.5" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              {error && <p className="text-sm font-semibold text-destructive">{error}</p>}
              <Button type="submit" disabled={submitting} className="mt-1.5 h-11">
                {submitting ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <p className="m-0 text-center text-sm font-semibold text-[oklch(0.52_0.05_340)]">
              No account?{" "}
              <Link to="/auth/register" className="font-bold text-[oklch(0.55_0.16_340)] underline hover:text-[oklch(0.45_0.18_340)]">
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
