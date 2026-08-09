import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface DeleteBeeDialogProps {
  title: string;
  onConfirm: () => void;
  trigger: React.ReactNode;
}

export function DeleteBeeDialog({ title, onConfirm, trigger }: DeleteBeeDialogProps) {
  return (
    <ConfirmDialog
      title={`Delete "${title}"?`}
      description="This permanently deletes the bee and all of its rounds. This cannot be undone."
      onConfirm={onConfirm}
      trigger={trigger}
    />
  );
}
