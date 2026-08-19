import { ValidationError } from "../errors/index.ts";

export function asString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ValidationError(`${fieldName} must be a non-empty string`);
  }
  return value;
}
