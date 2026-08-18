import { useAuthStore } from "@/store/authStore";
import type { ApiErrorBody } from "@/api/types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5001";

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(status: number, body: ApiErrorBody | null) {
    super(body?.error?.message ?? "Request failed");
    this.name = "ApiError";
    this.status = status;
    this.code = body?.error?.code ?? "UNKNOWN_ERROR";
  }
}

function decodeJwtExpiry(token: string): number | null {
  try {
    const [, payload] = token.split(".");
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof decoded.exp === "number" ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) return null;

  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (res) => {
        if (!res.ok) return null;
        const body = await res.json();
        useAuthStore.getState().setAccessToken(body.accessToken);
        return body.accessToken as string;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

/** Proactively refreshes the access token if it's missing, expired, or near-expiry (within 30s). */
export async function ensureFreshAccessToken(): Promise<string | null> {
  const token = useAuthStore.getState().accessToken;
  if (!token) return null;

  const expiry = decodeJwtExpiry(token);
  if (expiry !== null && expiry - Date.now() > 30_000) {
    return token;
  }
  return refreshAccessToken();
}

async function request<T>(path: string, opts: RequestInit = {}, retry = true): Promise<T> {
  const token = useAuthStore.getState().accessToken;
  const res = await fetch(`${API_URL}/api${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
  });

  if (res.status === 401 && retry) {
    const body: ApiErrorBody | null = await res
      .clone()
      .json()
      .catch(() => null);
    if (body?.error?.code === "UNAUTHORIZED") {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return request<T>(path, opts, false);
      }
      useAuthStore.getState().logout();
    }
  }

  if (!res.ok) {
    const body: ApiErrorBody | null = await res.json().catch(() => null);
    throw new ApiError(res.status, body);
  }

  if (res.status === 204) {
    return undefined as T;
  }
  return res.json();
}

export const api = {
  get: <T>(path: string, opts?: RequestInit) => request<T>(path, opts),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
