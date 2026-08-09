import { signAccessToken } from "../../src/http/jwt.ts";

export function authHeader(userId: number): { Authorization: string } {
  return { Authorization: `Bearer ${signAccessToken(userId)}` };
}
