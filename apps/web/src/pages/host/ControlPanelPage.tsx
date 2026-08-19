import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { GamekeyBox } from "@/components/control/GamekeyBox";
import { ConnectionIndicator } from "@/components/control/ConnectionIndicator";
import { EndBeeConfirmDialog } from "@/components/control/EndBeeConfirmDialog";
import { CurrentTurnCard } from "@/components/control/CurrentTurnCard";
import { WordDefinitionCard } from "@/components/control/WordDefinitionCard";
import { SpellingInput } from "@/components/control/SpellingInput";
import { ParticipantsTabs } from "@/components/control/ParticipantsTabs";
import { StandingsTable } from "@/components/control/StandingsTable";
import { AddParticipantsModal } from "@/components/control/AddParticipantsModal";
import { WinnerScreen } from "@/components/control/WinnerScreen";
import { useControlPanelStore } from "@/store/controlPanelStore";
import { useBreadcrumbStore } from "@/store/breadcrumbStore";
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

  const setBreadcrumbLabel = useBreadcrumbStore((s) => s.setLabel);
  useEffect(() => {
    setBreadcrumbLabel(bee?.title ?? null);
    return () => setBreadcrumbLabel(null);
  }, [bee?.title, setBreadcrumbLabel]);

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
    return <p className="font-semibold text-[oklch(0.6_0.04_340)]">Loading...</p>;
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
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          {bee.gamekey && <GamekeyBox gamekey={bee.gamekey} />}
          <ConnectionIndicator status={connectionStatus} />
        </div>
        <EndBeeConfirmDialog onConfirm={() => void handleEndBee()} />
      </div>

      <p className="m-0 text-sm font-semibold text-[oklch(0.55_0.05_340)]">
        {participants.active.length} participant{participants.active.length === 1 ? "" : "s"} active &middot;{" "}
        {participants.eliminated.length} eliminated
      </p>

      {currentTurn && (
        <>
          <CurrentTurnCard roundNumber={bee.currentRound} currentTurn={currentTurn} />
          <WordDefinitionCard word={currentTurn.word} />
          <SpellingInput
            disabled={submitting}
            onEmitTyping={(value) => emit("typing:update", { currentSpelling: value })}
            onSubmit={(value) => void submitResponse(value)}
            onSkip={() => void skip(currentTurn.participant.id)}
          />
        </>
      )}

      {roundNotStarted && (
        <div className="rounded-[20px] border-2 border-[oklch(0.9_0.05_340)] bg-[oklch(0.99_0.015_340)] p-5">
          <p className="mb-3 font-fredoka font-semibold text-[oklch(0.4_0.12_340)]">
            Round {bee.currentRound} hasn't started yet.
          </p>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => setAddParticipantsOpen(true)}
              className="h-10 cursor-pointer rounded-full border-2 border-[oklch(0.85_0.06_340)] bg-white px-5 font-fredoka text-sm font-bold text-[oklch(0.45_0.14_340)]"
            >
              Add Participants
            </button>
            <button
              type="button"
              onClick={() => void handleStartRound()}
              disabled={participants.active.length === 0}
              className="h-10 cursor-pointer rounded-full border-none bg-[linear-gradient(135deg,oklch(0.72_0.17_340),oklch(0.75_0.15_20))] px-5 font-fredoka text-sm font-bold text-white shadow-[0_6px_14px_oklch(0.7_0.17_340_/_0.4)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Start Round {bee.currentRound}
            </button>
          </div>
        </div>
      )}

      {roundComplete && (
        <div className="rounded-[20px] border-2 border-[oklch(0.9_0.05_340)] bg-[oklch(0.99_0.015_340)] p-5">
          <p className="mb-3 font-fredoka font-semibold text-[oklch(0.4_0.12_340)]">
            Round {bee.currentRound} complete.
          </p>
          <button
            type="button"
            onClick={() => setAddParticipantsOpen(true)}
            className="h-10 cursor-pointer rounded-full border-none bg-[linear-gradient(135deg,oklch(0.72_0.17_340),oklch(0.75_0.15_20))] px-5 font-fredoka text-sm font-bold text-white shadow-[0_6px_14px_oklch(0.7_0.17_340_/_0.4)]"
          >
            Next Round
          </button>
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
