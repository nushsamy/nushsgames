import { useAuthStore } from "@/store/authStore";
import type { ApiErrorBody } from "@/api/types";

const BEE_API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";
export const MYSTERY_API_URL = import.meta.env.VITE_MYSTERY_API_URL ?? "http://localhost:5001";
export const AUTH_URL = import.meta.env.VITE_AUTH_URL ?? "http://localhost:5002";

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
  if (!refreshPromise) {
    // No refresh token in hand here -- the session lives in an httpOnly cookie the auth
    // service set on login/register, so `credentials: "include"` is what actually carries it.
    refreshPromise = fetch(`${AUTH_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
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

/** Unconditionally requests a new access token, bypassing the local expiry check. */
export function forceRefreshAccessToken(): Promise<string | null> {
  return refreshAccessToken();
}

export interface ApiClient {
  get: <T>(path: string, opts?: RequestInit) => Promise<T>;
  post: <T>(path: string, body?: unknown) => Promise<T>;
  put: <T>(path: string, body?: unknown) => Promise<T>;
  patch: <T>(path: string, body?: unknown) => Promise<T>;
  delete: <T>(path: string) => Promise<T>;
}

/** One nushsgames account, but two separate game backends (bee-api, mystery-api) -- each api/*.ts
 * module picks the client for the backend it actually talks to; auth/refresh logic is shared. */
export function createApiClient(baseUrl: string): ApiClient {
  async function request<T>(path: string, opts: RequestInit = {}, retry = true): Promise<T> {
    const token = useAuthStore.getState().accessToken;
    const res = await fetch(`${baseUrl}/api${path}`, {
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

  return {
    get: (path, opts) => request(path, opts),
    post: (path, body) => request(path, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }),
    put: (path, body) => request(path, { method: "PUT", body: JSON.stringify(body) }),
    patch: (path, body) => request(path, { method: "PATCH", body: JSON.stringify(body) }),
    delete: (path) => request(path, { method: "DELETE" }),
  };
}

export const api = createApiClient(BEE_API_URL);
