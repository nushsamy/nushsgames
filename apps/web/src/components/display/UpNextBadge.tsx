interface UpNextBadgeProps {
  name: string;
}

export function UpNextBadge({ name }: UpNextBadgeProps) {
  return (
    <div className="fixed top-6 left-6 z-40 rounded-xl bg-white/70 px-4 py-2 text-left shadow-sm backdrop-blur">
      <p className="m-0 text-xs font-bold tracking-wide text-[oklch(0.55_0.05_340)] uppercase">Up Next</p>
      <p className="m-0 font-fredoka text-lg font-bold text-[oklch(0.4_0.14_340)]">{name}</p>
    </div>
  );
}
