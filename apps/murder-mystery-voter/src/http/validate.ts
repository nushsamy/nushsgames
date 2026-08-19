import { ValidationError } from "../errors/index.ts";
import { isValidEmail } from "../domain/email.ts";

export function asString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ValidationError(`${fieldName} must be a non-empty string`);
  }
  return value;
}

/** Like asString, but allows an empty string. */
export function asRawString(value: unknown, fieldName: string): string {
  if (typeof value !== "string") {
    throw new ValidationError(`${fieldName} must be a string`);
  }
  return value;
}

export function asEmail(value: unknown, fieldName: string): string {
  const str = asString(value, fieldName);
  if (!isValidEmail(str)) {
    throw new ValidationError(`${fieldName} must be a valid email address`);
  }
  return str;
}

export function asPositiveInt(value: unknown, fieldName: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new ValidationError(`${fieldName} must be a positive integer`);
  }
  return value;
}

export function asIntArray(value: unknown, fieldName: string): number[] {
  if (!Array.isArray(value) || !value.every((v) => typeof v === "number" && Number.isInteger(v) && v > 0)) {
    throw new ValidationError(`${fieldName} must be an array of positive integers`);
  }
  return value;
}

export function asBoolean(value: unknown, fieldName: string): boolean {
  if (typeof value !== "boolean") {
    throw new ValidationError(`${fieldName} must be a boolean`);
  }
  return value;
}

export function asOptionalBoolean(value: unknown, fieldName: string): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }
  return asBoolean(value, fieldName);
}
