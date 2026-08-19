import { useState } from "react";
import { Button } from "@/mystery/components/ui/button";
import { TallyChart } from "@/mystery/components/control/TallyChart";
import { getRoundTally } from "@/mystery/api/roundLifecycle";
import type { RoundTally } from "@/mystery/api/types";

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
