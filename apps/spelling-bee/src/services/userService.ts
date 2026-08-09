import { Prisma } from "../../generated/prisma/client.ts";
import type { PrismaClient, User } from "../../generated/prisma/client.ts";
import { ValidationError, EmailAlreadyRegisteredError, InvalidCredentialsError } from "../errors/index.ts";
import { hashPassword, verifyPassword } from "../http/password.ts";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface RegisterUserInput {
  email: string;
  password: string;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function registerUser(prisma: PrismaClient, input: RegisterUserInput): Promise<User> {
  const email = normalizeEmail(input.email);
  if (!EMAIL_PATTERN.test(email)) {
    throw new ValidationError("A valid email address is required");
  }
  if (input.password.length < 8) {
    throw new ValidationError("Password must be at least 8 characters long");
  }

  const passwordHash = await hashPassword(input.password);

  try {
    return await prisma.user.create({ data: { email, passwordHash } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new EmailAlreadyRegisteredError(`An account with email "${email}" already exists`);
    }
    throw err;
  }
}

export async function authenticateUser(prisma: PrismaClient, email: string, password: string): Promise<User> {
  const user = await prisma.user.findUnique({ where: { email: normalizeEmail(email) } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new InvalidCredentialsError("Invalid email or password");
  }
  return user;
}
