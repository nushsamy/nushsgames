import type { ConnectionState } from "@/state/displayTypes";

interface ConnectionOverlayProps {
  connection: ConnectionState;
  onRetry: () => void;
}

export function ConnectionOverlay({ connection, onRetry }: ConnectionOverlayProps) {
  if (connection === "open" || connection === "connecting") return null;

  if (connection === "lost") {
    return (
      <div className="dark fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background/95 text-foreground">
        <h2 className="text-4xl font-bold">Connection Lost</h2>
        <p className="text-lg text-muted-foreground">We haven't been able to reach the server for a while.</p>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md bg-primary px-6 py-3 text-lg font-semibold text-primary-foreground"
        >
          Reconnect
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 top-0 z-50 bg-warning/90 py-3 text-center text-lg font-semibold text-warning-foreground">
      Reconnecting…
    </div>
  );
}
