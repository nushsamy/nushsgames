import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BeeStatusBadge } from "@/components/bees/BeeStatusBadge";
import { DeleteBeeDialog } from "@/components/bees/DeleteBeeDialog";
import type { SpellingBee } from "@/api/types";

interface BeeCardProps {
  bee: SpellingBee;
  onDelete: (beeId: number) => void;
  onReopen: (beeId: number) => Promise<boolean>;
}

export function BeeCard({ bee, onDelete, onReopen }: BeeCardProps) {
  const navigate = useNavigate();

  const actionLabel = bee.status === "created" ? "Edit" : bee.status === "in_progress" ? "Control" : "View Results";
  const actionPath = bee.status === "created" ? `/host/${bee.id}/builder` : `/host/${bee.id}/control`;

  async function handleReopen() {
    const ok = await onReopen(bee.id);
    if (ok) navigate(`/host/${bee.id}/builder`);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>{bee.title}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {new Date(bee.createdAt).toLocaleDateString()} &middot; {bee.totalRounds} round
            {bee.totalRounds === 1 ? "" : "s"}
          </p>
        </div>
        <BeeStatusBadge status={bee.status} />
      </CardHeader>
      <CardContent className="flex items-center gap-2">
        <Button size="sm" onClick={() => navigate(actionPath)}>
          {actionLabel}
        </Button>
        {bee.status === "completed" && (
          <Button size="sm" variant="secondary" onClick={() => void handleReopen()}>
            Start Again
          </Button>
        )}
        {bee.status === "created" && <DeleteBeeDialog title={bee.title} onConfirm={() => onDelete(bee.id)} />}
      </CardContent>
    </Card>
  );
}
