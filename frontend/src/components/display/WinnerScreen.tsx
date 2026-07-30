interface WinnerScreenProps {
  name: string;
}

export function WinnerScreen({ name }: WinnerScreenProps) {
  return (
    <div className="flex flex-col items-center gap-3.5 text-center">
      <div className="text-[80px]">🎉</div>
      <p className="m-0 font-fredoka text-xl font-bold tracking-wide text-[oklch(0.6_0.1_60)] uppercase">Winner!</p>
      <p className="m-0 font-fredoka text-[60px] font-bold text-[oklch(0.45_0.15_20)]">👑 {name} 👑</p>
      <div className="text-[80px]">🎉</div>
    </div>
  );
}
