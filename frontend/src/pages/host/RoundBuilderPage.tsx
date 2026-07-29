import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { RoundListItem } from "@/components/roundBuilder/RoundListItem";
import { DeleteBeeDialog } from "@/components/bees/DeleteBeeDialog";
import { useRoundBuilder } from "@/hooks/useRoundBuilder";
import { useBeeStatusGuard } from "@/hooks/useBeeStatusGuard";

export function RoundBuilderPage() {
  const { beeId } = useParams<{ beeId: string }>();
  const navigate = useNavigate();
  const id = Number(beeId);
  const { bee, rounds, loading, notFound, canStart, addRound, saveRoundWords, removeRound, start, removeBee } =
    useRoundBuilder(id);

  useBeeStatusGuard(bee, notFound, loading, "builder");

  if (loading || !bee) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  async function handleStart() {
    const updated = await start();
    if (updated) {
      navigate(`/host/${id}/control`);
    }
  }

  async function handleDeleteBee() {
    const ok = await removeBee();
    if (ok) navigate("/host/bees");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{bee.title}</h1>
          <p className="text-muted-foreground">Total Rounds: {bee.totalRounds}</p>
        </div>
        <div className="flex items-center gap-2">
          <DeleteBeeDialog
            title={bee.title}
            onConfirm={handleDeleteBee}
            trigger={
              <Button variant="destructive" size="sm">
                Delete Bee
              </Button>
            }
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button onClick={handleStart} disabled={!canStart}>
                  Start Bee
                </Button>
              </span>
            </TooltipTrigger>
            {!canStart && <TooltipContent>Add at least one round with words to start</TooltipContent>}
          </Tooltip>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {rounds.length === 0 && (
          <p className="text-muted-foreground">No rounds added yet. Add one to get started!</p>
        )}
        {rounds.map((round) => (
          <RoundListItem key={round.id} round={round} onSaveWords={saveRoundWords} onDelete={removeRound} />
        ))}
      </div>

      <Button variant="outline" onClick={() => void addRound()} className="self-start">
        + Add Round
      </Button>
    </div>
  );
}
