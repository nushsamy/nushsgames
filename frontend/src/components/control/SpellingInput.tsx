import { useState, type KeyboardEvent } from "react";

interface SpellingInputProps {
  disabled: boolean;
  onEmitTyping: (value: string) => void;
  onSubmit: (value: string) => void;
  onSkip: () => void;
}

export function SpellingInput({ disabled, onEmitTyping, onSubmit, onSkip }: SpellingInputProps) {
  const [value, setValue] = useState("");

  function handleChange(next: string) {
    setValue(next);
    onEmitTyping(next);
  }

  function handleSubmit() {
    onSubmit(value);
    setValue("");
  }

  function handleClear() {
    setValue("");
    onEmitTyping("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      handleSubmit();
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2.5">
        <input
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Type spelling..."
          autoFocus
          className="h-[46px] flex-1 rounded-2xl border-2 border-[oklch(0.9_0.05_340)] bg-white px-4 font-nunito text-base text-[oklch(0.35_0.05_340)] outline-none placeholder:text-[oklch(0.75_0.03_340)] focus:border-[oklch(0.75_0.15_340)] disabled:opacity-60"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={disabled}
          className="h-[46px] cursor-pointer rounded-full border-none bg-[linear-gradient(135deg,oklch(0.72_0.17_340),oklch(0.75_0.15_20))] px-[22px] font-fredoka text-sm font-bold text-white shadow-[0_6px_14px_oklch(0.7_0.17_340_/_0.4)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Submit
        </button>
        <button
          type="button"
          onClick={onSkip}
          disabled={disabled}
          className="h-[46px] cursor-pointer rounded-full border-2 border-[oklch(0.85_0.06_340)] bg-white px-[18px] font-fredoka text-sm font-bold text-[oklch(0.45_0.14_340)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Skip
        </button>
      </div>
      <button
        type="button"
        onClick={handleClear}
        disabled={disabled}
        className="cursor-pointer self-start border-none bg-transparent text-[13px] font-semibold text-[oklch(0.6_0.04_340)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        Clear
      </button>
    </div>
  );
}
