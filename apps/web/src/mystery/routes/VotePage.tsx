import { useEffect, useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import { ApiError } from "@/api/httpClient";
import * as voteApi from "@/mystery/api/vote";
import { Button } from "@/mystery/components/ui/button";
import type { BallotView } from "@/mystery/api/types";

type Phase =
  | { state: "loading" }
  | { state: "error"; code: string; message: string }
  | { state: "ready"; ballot: BallotView }
  | { state: "submitted" };

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[linear-gradient(160deg,oklch(0.97_0.03_340)_0%,oklch(0.96_0.035_90)_45%,oklch(0.95_0.04_250)_100%)] px-4 font-body">
      <div className="flex w-full max-w-[420px] flex-col items-center gap-5 rounded-[28px] border-2 border-[oklch(0.9_0.05_340)] bg-[oklch(0.99_0.015_340)] px-[26px] py-9 text-center shadow-[0_10px_24px_oklch(0.7_0.08_340_/_0.25),0_2px_0_oklch(0.85_0.06_340_/_0.6)_inset]">
        {children}
      </div>
    </div>
  );
}

const FRIENDLY_MESSAGE: Record<string, string> = {
  BALLOT_NOT_FOUND: "This link isn't valid.",
  BALLOT_ALREADY_CAST: "You've already voted in this round — thanks!",
  BALLOT_EXPIRED: "Voting for this round has closed.",
  ROUND_NOT_OPEN: "Voting hasn't opened for this round yet.",
};

export function VotePage() {
  const { token } = useParams<{ token: string }>();
  const [phase, setPhase] = useState<Phase>({ state: "loading" });
  const [selected, setSelected] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    voteApi
      .getBallotByToken(token)
      .then((ballot) => setPhase({ state: "ready", ballot }))
      .catch((err) => {
        if (err instanceof ApiError) {
          setPhase({ state: "error", code: err.code, message: FRIENDLY_MESSAGE[err.code] ?? err.message });
        } else {
          setPhase({ state: "error", code: "UNKNOWN", message: "Something went wrong." });
        }
      });
  }, [token]);

  async function handleSubmit() {
    if (!token || selected === null) return;
    setSubmitting(true);
    try {
      await voteApi.castVote(token, selected);
      setPhase({ state: "submitted" });
    } catch (err) {
      if (err instanceof ApiError) {
        setPhase({ state: "error", code: err.code, message: FRIENDLY_MESSAGE[err.code] ?? err.message });
      } else {
        setPhase({ state: "error", code: "UNKNOWN", message: "Something went wrong." });
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (phase.state === "loading") {
    return (
      <Shell>
        <div className="text-[40px]">🔎</div>
        <p className="font-semibold text-[oklch(0.52_0.05_340)]">Loading your ballot...</p>
      </Shell>
    );
  }

  if (phase.state === "error") {
    return (
      <Shell>
        <div className="text-[40px]">🕯️</div>
        <p className="font-display text-lg font-semibold text-[oklch(0.42_0.14_340)]">{phase.message}</p>
      </Shell>
    );
  }

  if (phase.state === "submitted") {
    return (
      <Shell>
        <div className="text-[40px]">🗳️</div>
        <p className="font-display text-lg font-semibold text-[oklch(0.42_0.14_340)]">Vote recorded!</p>
        <p className="text-sm font-semibold text-[oklch(0.52_0.05_340)]">Thanks for playing along.</p>
      </Shell>
    );
  }

  const { ballot } = phase;

  return (
    <Shell>
      <div className="text-[40px]">🔪</div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-[oklch(0.52_0.05_340)]">Hi {ballot.participantName},</p>
        <p className="font-display text-xl font-semibold text-[oklch(0.42_0.14_340)]">
          {ballot.eventTitle} — Round {ballot.roundNumber}
        </p>
        <p className="text-sm font-semibold text-[oklch(0.52_0.05_340)]">Who do you accuse?</p>
      </div>

      <div className="flex w-full flex-col gap-2 text-left">
        {ballot.suspects.map((suspect) => (
          <label
            key={suspect.id}
            className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-[oklch(0.9_0.05_340)] px-4 py-3 has-[:checked]:border-[oklch(0.72_0.17_340)]"
          >
            <input
              type="radio"
              name="suspect"
              checked={selected === suspect.id}
              onChange={() => setSelected(suspect.id)}
              className="size-4 accent-[oklch(0.72_0.17_340)]"
            />
            <span>
              <span className="font-semibold text-[oklch(0.35_0.05_340)]">{suspect.characterName}</span>
              {suspect.description && (
                <span className="block text-xs text-[oklch(0.6_0.04_340)]">{suspect.description}</span>
              )}
            </span>
          </label>
        ))}
      </div>

      <Button className="w-full" disabled={selected === null || submitting} onClick={() => void handleSubmit()}>
        {submitting ? "Submitting..." : "Cast Vote"}
      </Button>
    </Shell>
  );
}
