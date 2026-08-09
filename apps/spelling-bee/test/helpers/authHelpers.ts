import { signAccessToken } from "@nushsgames/shared-auth";

export function authHeader(userId: number): { Authorization: string } {
  return { Authorization: `Bearer ${signAccessToken(userId)}` };
}
