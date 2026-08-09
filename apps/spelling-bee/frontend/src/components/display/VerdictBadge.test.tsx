import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { VerdictBadge } from "@/components/display/VerdictBadge";

describe("VerdictBadge", () => {
  it("shows the correct verdict and advancement message", () => {
    render(
      <VerdictBadge
        verdict={{ participantName: "Alice", word: "apple", userSpelling: "apple", isCorrect: true }}
      />,
    );
    expect(screen.getByText("✓ Correct")).toBeInTheDocument();
    expect(screen.getByText("APPLE")).toBeInTheDocument();
    expect(screen.getByText("Alice advances to the next round!")).toBeInTheDocument();
  });

  it("shows the incorrect verdict and elimination message", () => {
    render(
      <VerdictBadge
        verdict={{ participantName: "Bob", word: "banana", userSpelling: "bananna", isCorrect: false }}
      />,
    );
    expect(screen.getByText("✗ Incorrect")).toBeInTheDocument();
    expect(screen.getByText("Bob is eliminated")).toBeInTheDocument();
    expect(screen.getByText("Your spelling")).toBeInTheDocument();
    expect(screen.getByText("BANANNA")).toBeInTheDocument();
    expect(screen.getByText("✓ Correct spelling")).toBeInTheDocument();
    expect(screen.getByText("BANANA")).toBeInTheDocument();
  });
});
