import { Badge } from "@/components/ui/badge";
import type { EventStatus } from "@/api/types";

const LABELS: Record<EventStatus, string> = {
  created: "Building",
  in_progress: "Live",
  completed: "Completed",
};

const VARIANTS: Record<EventStatus, "secondary" | "success" | "outline"> = {
  created: "secondary",
  in_progress: "success",
  completed: "outline",
};

export function EventStatusBadge({ status }: { status: EventStatus }) {
  return <Badge variant={VARIANTS[status]}>{LABELS[status]}</Badge>;
}
