import { useNavigate, useParams } from "react-router-dom";
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
    return <p className="font-semibold text-[oklch(0.6_0.04_340)]">Loading...</p>;
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
    <div className="flex flex-col gap-[22px]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-fredoka text-[26px] font-semibold text-[oklch(0.4_0.14_340)]">{bee.title}</h1>
          <p className="mt-1 text-sm font-semibold text-[oklch(0.55_0.05_340)]">Total Rounds: {bee.totalRounds}</p>
        </div>
        <div className="flex shrink-0 gap-2.5">
          <DeleteBeeDialog
            title={bee.title}
            onConfirm={handleDeleteBee}
            trigger={
              <button
                type="button"
                className="h-[42px] cursor-pointer rounded-full border-2 border-[oklch(0.85_0.1_25_/_0.6)] bg-white px-5 font-fredoka text-sm font-bold text-[oklch(0.6_0.15_25)]"
              >
                Delete Bee
              </button>
            }
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <button
                  type="button"
                  onClick={() => void handleStart()}
                  disabled={!canStart}
                  className="h-[42px] cursor-pointer rounded-full border-none bg-[linear-gradient(135deg,oklch(0.72_0.17_340),oklch(0.75_0.15_20))] px-[22px] font-fredoka text-sm font-bold text-white shadow-[0_6px_14px_oklch(0.7_0.17_340_/_0.4)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Start Bee
                </button>
              </span>
            </TooltipTrigger>
            {!canStart && <TooltipContent>Add at least one round with words to start</TooltipContent>}
          </Tooltip>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {rounds.length === 0 && (
          <p className="font-semibold text-[oklch(0.6_0.04_340)]">No rounds added yet. Add one to get started!</p>
        )}
        {rounds.map((round) => (
          <RoundListItem key={round.id} round={round} onSaveWords={saveRoundWords} onDelete={removeRound} />
        ))}
      </div>

      <button
        type="button"
        onClick={() => void addRound()}
        className="h-[42px] cursor-pointer self-start rounded-full border-2 border-dashed border-[oklch(0.8_0.06_340)] bg-white px-[22px] font-fredoka text-sm font-bold text-[oklch(0.45_0.14_340)]"
      >
        + Add Round
      </button>
    </div>
  );
}
