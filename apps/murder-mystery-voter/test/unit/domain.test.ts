import { describe, it, expect } from "vitest";
import { generateBallotToken } from "../../src/domain/ballotToken.ts";
import { isValidEmail, normalizeEmail } from "../../src/domain/email.ts";
import { buildBallotEmail } from "../../src/email/templates.ts";

describe("generateBallotToken", () => {
  it("produces distinct, URL-safe tokens", () => {
    const a = generateBallotToken();
    const b = generateBallotToken();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(a.length).toBeGreaterThan(30);
  });
});

describe("email domain helpers", () => {
  it("normalizes case and whitespace", () => {
    expect(normalizeEmail("  Alice@Example.COM  ")).toBe("alice@example.com");
  });

  it("validates well-formed addresses", () => {
    expect(isValidEmail("alice@example.com")).toBe(true);
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("missing@tld")).toBe(false);
  });
});

describe("buildBallotEmail", () => {
  it("includes the voting url and escapes HTML in names", () => {
    const email = buildBallotEmail({
      participantName: "<script>alert(1)</script>",
      eventTitle: "The Manor",
      roundNumber: 2,
      votingUrl: "https://example.com/vote/abc123",
    });

    expect(email.subject).toContain("Round 2");
    expect(email.text).toContain("https://example.com/vote/abc123");
    expect(email.html).not.toContain("<script>alert(1)</script>");
    expect(email.html).toContain("&lt;script&gt;");
  });
});
