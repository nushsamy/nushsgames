import { ValidationError } from "../errors/index.ts";

export function asStringArray(value: unknown, fieldName: string): string[] {
  if (!Array.isArray(value) || !value.every((v) => typeof v === "string")) {
    throw new ValidationError(`${fieldName} must be an array of strings`);
  }
  return value;
}
