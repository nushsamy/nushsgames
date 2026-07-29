import { useParams } from "react-router-dom";
import { ConnectionOverlay } from "@/components/display/ConnectionOverlay";
import { ErrorScreen } from "@/components/display/ErrorScreen";
import { GameOverScreen } from "@/components/display/GameOverScreen";
import { LoadingScreen } from "@/components/display/LoadingScreen";
import { RoundResultsScreen } from "@/components/display/RoundResultsScreen";
import { TurnScreen } from "@/components/display/TurnScreen";
import { WinnerScreen } from "@/components/display/WinnerScreen";
import { FullScreenLayout } from "@/components/layout/FullScreenLayout";
import { useDisplaySocket } from "@/state/useDisplaySocket";

export function DisplayPage() {
  const { gamekey } = useParams<{ gamekey: string }>();
  const { state, retryConnection } = useDisplaySocket(gamekey ?? "");

  const { phase } = state;

  return (
    <>
      <FullScreenLayout transitionKey={phase.kind}>
        {phase.kind === "loading" && <LoadingScreen />}
        {phase.kind === "fatal" && <ErrorScreen message={phase.message} />}
        {phase.kind === "turn" && <TurnScreen phase={phase} />}
        {phase.kind === "roundEnd" && (
          <RoundResultsScreen roundNumber={phase.roundNumber} advancedParticipants={phase.advancedParticipants} />
        )}
        {phase.kind === "winner" && <WinnerScreen name={phase.winner.name} />}
        {phase.kind === "gameOverNoWinner" && <GameOverScreen />}
      </FullScreenLayout>
      <ConnectionOverlay connection={state.connection} onRetry={retryConnection} />
    </>
  );
}
