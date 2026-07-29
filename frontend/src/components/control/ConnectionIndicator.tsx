import { cn } from "@/lib/utils";
import type { ConnectionStatus } from "@/socket/types";

const COLORS: Record<ConnectionStatus, string> = {
  connected: "bg-success",
  reconnecting: "bg-warning",
  disconnected: "bg-destructive",
};

const LABELS: Record<ConnectionStatus, string> = {
  connected: "Connected",
  reconnecting: "Reconnecting...",
  disconnected: "Disconnected",
};

export function ConnectionIndicator({ status }: { status: ConnectionStatus }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className={cn("size-2.5 rounded-full", COLORS[status])} />
      {LABELS[status]}
    </div>
  );
}
