import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/api/types";

interface Session {
  user: User;
  accessToken: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  /** Whether the cookie-based session bootstrap (see ProtectedRoute) has run yet this page load. */
  sessionChecked: boolean;
  setSession: (session: Session) => void;
  setAccessToken: (accessToken: string) => void;
  markSessionChecked: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      sessionChecked: false,
      setSession: ({ user, accessToken }) => set({ user, accessToken, isAuthenticated: true }),
      setAccessToken: (accessToken) => set({ accessToken }),
      markSessionChecked: () => set({ sessionChecked: true }),
      logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),
    }),
    {
      name: "spelling-bee-auth",
      // sessionChecked must always start false on a fresh page load, so the bootstrap
      // re-validates against the shared session cookie instead of trusting a stale flag.
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken, isAuthenticated: state.isAuthenticated }),
    },
  ),
);
