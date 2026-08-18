import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TallyChart } from "@/components/control/TallyChart";
import { getRoundTally } from "@/api/roundLifecycle";
import type { RoundTally } from "@/api/types";

export function ClosedRoundResults({ eventId, roundNumber }: { eventId: number; roundNumber: number }) {
  const [tally, setTally] = useState<RoundTally | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setTally(await getRoundTally(eventId, roundNumber));
    } finally {
      setLoading(false);
    }
  }

  if (!tally) {
    return (
      <Button variant="ghost" size="sm" disabled={loading} onClick={() => void load()}>
        {loading ? "Loading..." : "View results"}
      </Button>
    );
  }

  return <TallyChart tally={tally.tally} />;
}
