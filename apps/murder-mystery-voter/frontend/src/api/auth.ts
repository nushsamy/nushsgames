import { api } from "@/api/httpClient";
import type { AuthResponse } from "@/api/types";

export function register(email: string, password: string): Promise<AuthResponse> {
  return api.post<AuthResponse>("/auth/register", { email, password });
}

export function login(email: string, password: string): Promise<AuthResponse> {
  return api.post<AuthResponse>("/auth/login", { email, password });
}
