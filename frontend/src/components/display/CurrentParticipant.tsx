interface CurrentParticipantProps {
  name: string | null;
  subtitle: string;
}

export function CurrentParticipant({ name, subtitle }: CurrentParticipantProps) {
  return (
    <div className="mt-10 text-center">
      <p className="text-proj-name font-extrabold">{name ?? "—"}</p>
      <p className="mt-3 text-2xl text-muted-foreground">{subtitle}</p>
    </div>
  );
}
