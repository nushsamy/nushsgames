import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { GamekeyBox } from "@/components/control/GamekeyBox";
import { ConnectionIndicator } from "@/components/control/ConnectionIndicator";
import { EndBeeConfirmDialog } from "@/components/control/EndBeeConfirmDialog";
import { CurrentTurnCard } from "@/components/control/CurrentTurnCard";
import { SpellingInput } from "@/components/control/SpellingInput";
import { ParticipantsTabs } from "@/components/control/ParticipantsTabs";
import { StandingsTable } from "@/components/control/StandingsTable";
import { AddParticipantsModal } from "@/components/control/AddParticipantsModal";
import { WinnerScreen } from "@/components/control/WinnerScreen";
import { Button } from "@/components/ui/button";
import { useControlPanelStore } from "@/store/controlPanelStore";
import { useGameSocket } from "@/socket/useGameSocket";
import { useBeeStatusGuard } from "@/hooks/useBeeStatusGuard";

export function ControlPanelPage() {
  const { beeId } = useParams<{ beeId: string }>();
  const id = Number(beeId);
  const [addParticipantsOpen, setAddParticipantsOpen] = useState(false);

  const {
    bee,
    currentTurn,
    participants,
    submitting,
    loading,
    notFound,
    winner,
    finalStandings,
    loadInitial,
    refresh,
    submitResponse,
    skip,
    addParticipant,
    startRound,
    goToNextRound,
    endBee,
    applyBeeCompleted,
  } = useControlPanelStore();

  useBeeStatusGuard(bee, notFound, loading, "control");

  useEffect(() => {
    void loadInitial(id);
  }, [id, loadInitial]);

  const { connectionStatus, emit } = useGameSocket(bee?.gamekey ?? null, {
    "round:start": () => void refresh(),
    "participant:added": () => void refresh(),
    "response:submitted": () => void refresh(),
    "participant:eliminated": () => void refresh(),
    "round:end": () => void refresh(),
    "bee:completed": applyBeeCompleted,
    "join:error": ({ message }) => toast.error(message),
  });

  if (loading || !bee) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  const roundNotStarted = !bee.roundStarted;
  const roundComplete = bee.roundStarted && currentTurn === null;

  async function addParticipants(names: string[]): Promise<void> {
    for (const name of names) {
      const result = await addParticipant(name);
      if (!result.ok) {
        toast.error(`${name}: ${result.error}`);
      }
    }
  }

  async function handleStartRound() {
    const result = await startRound();
    if (!result.ok) {
      toast.error(result.error);
    }
  }

  /**
   * Participants for the next round can only be added once roundStarted flips back to
   * false, so the round must be advanced first and the new names added afterward.
   */
  async function handleAdvanceThenAdd(names: string[]) {
    const result = await goToNextRound();
    if (result.ended) {
      if (names.length > 0) {
        toast.error("The bee has ended; new participants were not added.");
      }
      return;
    }
    toast.success("Advanced to next round");
    await addParticipants(names);
  }

  async function handleEndBee() {
    await endBee();
  }

  if (bee.status === "completed") {
    const standings = finalStandings ?? [...participants.active, ...participants.eliminated];
    const resolvedWinner = winner ?? (participants.active.length === 1 ? participants.active[0] : null);
    return <WinnerScreen winner={resolvedWinner} finalStandings={standings} currentRound={bee.currentRound} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {bee.gamekey && <GamekeyBox gamekey={bee.gamekey} />}
          <ConnectionIndicator status={connectionStatus} />
        </div>
        <EndBeeConfirmDialog onConfirm={() => void handleEndBee()} />
      </div>

      <p className="text-sm text-muted-foreground">
        {participants.active.length} participant{participants.active.length === 1 ? "" : "s"} active &middot;{" "}
        {participants.eliminated.length} eliminated
      </p>

      {currentTurn && (
        <>
          <CurrentTurnCard roundNumber={bee.currentRound} currentTurn={currentTurn} />
          <SpellingInput
            disabled={submitting}
            onEmitTyping={(value) => emit("typing:update", { currentSpelling: value })}
            onSubmit={(value) => void submitResponse(value)}
            onSkip={() => void skip(currentTurn.participant.id)}
          />
        </>
      )}

      {roundNotStarted && (
        <div className="rounded-md border p-4">
          <p className="mb-3 font-medium">Round {bee.currentRound} hasn't started yet.</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setAddParticipantsOpen(true)}>
              Add Participants
            </Button>
            <Button onClick={() => void handleStartRound()} disabled={participants.active.length === 0}>
              Start Round {bee.currentRound}
            </Button>
          </div>
        </div>
      )}

      {roundComplete && (
        <div className="rounded-md border p-4">
          <p className="mb-3 font-medium">Round {bee.currentRound} complete.</p>
          <Button onClick={() => setAddParticipantsOpen(true)}>Next Round</Button>
        </div>
      )}

      <ParticipantsTabs
        active={participants.active}
        eliminated={participants.eliminated}
        currentParticipantId={currentTurn?.participant.id}
      />

      <StandingsTable
        participants={[...participants.active, ...participants.eliminated]}
        currentRound={bee.currentRound}
      />

      <AddParticipantsModal
        open={addParticipantsOpen}
        onOpenChange={setAddParticipantsOpen}
        roundNumber={roundNotStarted ? bee.currentRound : bee.currentRound + 1}
        mode={roundNotStarted ? "start" : "advance"}
        onSubmit={roundNotStarted ? addParticipants : handleAdvanceThenAdd}
      />
    </div>
  );
}
