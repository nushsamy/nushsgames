import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BeeCard } from "@/components/bees/BeeCard";
import { useBeesList } from "@/hooks/useBeesList";

export function BeesListPage() {
  const navigate = useNavigate();
  const { bees, loading, removeBee, reopenBee } = useBeesList();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your spelling bees</h1>
        <Button onClick={() => navigate("/host/create")}>New Bee</Button>
      </div>

      {loading && <p className="text-muted-foreground">Loading...</p>}

      {!loading && bees.length === 0 && (
        <p className="text-muted-foreground">No bees yet. Create one to get started.</p>
      )}

      <div className="flex flex-col gap-3">
        {bees.map((bee) => (
          <BeeCard key={bee.id} bee={bee} onDelete={removeBee} onReopen={reopenBee} />
        ))}
      </div>
    </div>
  );
}
