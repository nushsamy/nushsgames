import { cn } from "@/lib/utils";
import type { ConnectionStatus } from "@/socket/types";

const DOT_COLORS: Record<ConnectionStatus, string> = {
  connected: "bg-[oklch(0.65_0.15_145)]",
  reconnecting: "bg-[oklch(0.7_0.15_85)]",
  disconnected: "bg-[oklch(0.6_0.15_25)]",
};

const TEXT_COLORS: Record<ConnectionStatus, string> = {
  connected: "text-[oklch(0.5_0.12_145)]",
  reconnecting: "text-[oklch(0.55_0.12_85)]",
  disconnected: "text-[oklch(0.6_0.15_25)]",
};

const LABELS: Record<ConnectionStatus, string> = {
  connected: "Connected",
  reconnecting: "Reconnecting...",
  disconnected: "Disconnected",
};

export function ConnectionIndicator({ status }: { status: ConnectionStatus }) {
  return (
    <div className={cn("flex items-center gap-1.5 text-[13px] font-bold", TEXT_COLORS[status])}>
      <span className={cn("size-2 rounded-full", DOT_COLORS[status])} />
      {LABELS[status]}
    </div>
  );
}
