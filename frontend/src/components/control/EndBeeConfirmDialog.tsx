import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function EndBeeConfirmDialog({ onConfirm }: { onConfirm: () => void }) {
  return (
    <ConfirmDialog
      title="End this bee now?"
      description="This ends the bee immediately and shows final standings. This cannot be undone."
      confirmLabel="End Bee"
      onConfirm={onConfirm}
      trigger={
        <button
          type="button"
          className="h-[38px] cursor-pointer rounded-full border-2 border-[oklch(0.85_0.1_25_/_0.6)] bg-white px-5 font-fredoka text-sm font-bold text-[oklch(0.6_0.15_25)]"
        >
          End Bee
        </button>
      }
    />
  );
}
