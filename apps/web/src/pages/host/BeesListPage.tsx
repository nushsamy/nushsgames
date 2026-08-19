import { useNavigate } from "react-router-dom";
import { BeeCard } from "@/components/bees/BeeCard";
import { useBeesList } from "@/hooks/useBeesList";

export function BeesListPage() {
  const navigate = useNavigate();
  const { bees, loading, removeBee, reopenBee } = useBeesList();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-fredoka text-[28px] font-semibold text-[oklch(0.4_0.14_340)]">Your Spelling Bees</h1>
        <button
          type="button"
          className="h-11 cursor-pointer rounded-full border-none bg-[linear-gradient(135deg,oklch(0.72_0.17_340),oklch(0.75_0.15_20))] px-[22px] font-fredoka text-[15px] font-bold text-white shadow-[0_6px_14px_oklch(0.7_0.17_340_/_0.4)]"
          onClick={() => navigate("/host/create")}
        >
          + New Bee
        </button>
      </div>

      {loading && <p className="font-semibold text-[oklch(0.6_0.04_340)]">Loading...</p>}

      {!loading && bees.length === 0 && (
        <p className="font-semibold text-[oklch(0.6_0.04_340)]">🐝 No bees yet. Create one to get started.</p>
      )}

      <div className="flex flex-col gap-3.5">
        {bees.map((bee) => (
          <BeeCard key={bee.id} bee={bee} onDelete={removeBee} onReopen={reopenBee} />
        ))}
      </div>
    </div>
  );
}
