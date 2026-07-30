interface CurrentParticipantProps {
  name: string | null;
  subtitle: string;
}

export function CurrentParticipant({ name, subtitle }: CurrentParticipantProps) {
  return (
    <>
      <p className="m-0 font-fredoka text-[56px] font-bold text-[oklch(0.4_0.14_340)]">{name ?? "—"}</p>
      <p className="m-0 text-xl font-bold text-[oklch(0.55_0.05_340)]">{subtitle}</p>
    </>
  );
}
