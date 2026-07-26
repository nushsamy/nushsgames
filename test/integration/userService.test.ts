import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { testPrisma } from "../helpers/prismaTestClient.ts";
import { resetDatabase } from "../helpers/resetDb.ts";
import { registerUser, authenticateUser } from "../../src/services/userService.ts";
import { ValidationError, EmailAlreadyRegisteredError, InvalidCredentialsError } from "../../src/errors/index.ts";

beforeEach(async () => {
  await resetDatabase(testPrisma);
});

afterAll(async () => {
  await testPrisma.$disconnect();
});

describe("registerUser", () => {
  it("creates a user with a hashed password, not the plaintext", async () => {
    const user = await registerUser(testPrisma, { email: "Host@Example.com", password: "hunter22" });
    expect(user.email).toBe("host@example.com");
    expect(user.passwordHash).not.toBe("hunter22");
  });

  it("rejects an invalid email", async () => {
    await expect(
      registerUser(testPrisma, { email: "not-an-email", password: "hunter22" }),
    ).rejects.toThrow(ValidationError);
  });

  it("rejects a password shorter than 8 characters", async () => {
    await expect(
      registerUser(testPrisma, { email: "host@example.com", password: "short" }),
    ).rejects.toThrow(ValidationError);
  });

  it("rejects a duplicate email (case-insensitive)", async () => {
    await registerUser(testPrisma, { email: "host@example.com", password: "hunter22" });
    await expect(
      registerUser(testPrisma, { email: "HOST@example.com", password: "hunter22" }),
    ).rejects.toThrow(EmailAlreadyRegisteredError);
  });
});

describe("authenticateUser", () => {
  it("returns the user on correct credentials", async () => {
    await registerUser(testPrisma, { email: "host@example.com", password: "hunter22" });
    const user = await authenticateUser(testPrisma, "host@example.com", "hunter22");
    expect(user.email).toBe("host@example.com");
  });

  it("rejects an unknown email with InvalidCredentialsError", async () => {
    await expect(
      authenticateUser(testPrisma, "nobody@example.com", "hunter22"),
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it("rejects a wrong password with the same InvalidCredentialsError (no user-enumeration leak)", async () => {
    await registerUser(testPrisma, { email: "host@example.com", password: "hunter22" });

    let unknownEmailMessage: string | undefined;
    let wrongPasswordMessage: string | undefined;
    try {
      await authenticateUser(testPrisma, "nobody@example.com", "hunter22");
    } catch (err) {
      unknownEmailMessage = (err as Error).message;
    }
    try {
      await authenticateUser(testPrisma, "host@example.com", "wrong-password");
    } catch (err) {
      wrongPasswordMessage = (err as Error).message;
    }

    expect(unknownEmailMessage).toBeDefined();
    expect(wrongPasswordMessage).toBe(unknownEmailMessage);
  });
});
