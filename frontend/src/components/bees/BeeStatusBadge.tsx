import { Badge } from "@/components/ui/badge";
import type { BeeStatus } from "@/api/types";

const LABELS: Record<BeeStatus, string> = {
  created: "Draft",
  in_progress: "In Progress",
  completed: "Completed",
};

const VARIANTS: Record<BeeStatus, "secondary" | "default" | "outline"> = {
  created: "secondary",
  in_progress: "default",
  completed: "outline",
};

export function BeeStatusBadge({ status }: { status: BeeStatus }) {
  return <Badge variant={VARIANTS[status]}>{LABELS[status]}</Badge>;
}
