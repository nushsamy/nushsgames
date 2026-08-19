import { ApiError, AUTH_URL } from "@/api/httpClient";
import type { AuthResponse, ApiErrorBody, User } from "@/api/types";

async function authRequest<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${AUTH_URL}/api${path}`, {
    method: "POST",
    // Every auth-service call carries the httpOnly session cookie cross-origin -- without
    // this, the browser neither sends it nor stores the Set-Cookie the server responds with.
    credentials: "include",
    ...opts,
    headers: { "Content-Type": "application/json", ...opts.headers },
  });

  if (!res.ok) {
    const errBody: ApiErrorBody | null = await res.json().catch(() => null);
    throw new ApiError(res.status, errBody);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json();
}

export function register(email: string, password: string): Promise<AuthResponse> {
  return authRequest<AuthResponse>("/auth/register", { body: JSON.stringify({ email, password }) });
}

export function login(email: string, password: string): Promise<AuthResponse> {
  return authRequest<AuthResponse>("/auth/login", { body: JSON.stringify({ email, password }) });
}

/** Exchanges the session cookie (possibly set by logging into the *other* nushsgames app) for a fresh access token. */
export function refreshSession(): Promise<{ accessToken: string }> {
  return authRequest<{ accessToken: string }>("/auth/refresh");
}

export function logout(): Promise<void> {
  return authRequest<void>("/auth/logout");
}

export async function getMe(accessToken: string): Promise<{ user: User }> {
  const res = await fetch(`${AUTH_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const errBody: ApiErrorBody | null = await res.json().catch(() => null);
    throw new ApiError(res.status, errBody);
  }
  return res.json();
}
