import { useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    <div className="flex items-center gap-2">
      <Input
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Type spelling..."
        autoFocus
        className="text-lg"
      />
      <Button onClick={handleSubmit} disabled={disabled}>
        Submit
      </Button>
      <Button variant="outline" onClick={onSkip} disabled={disabled}>
        Skip
      </Button>
      <Button variant="ghost" onClick={handleClear} disabled={disabled}>
        Clear
      </Button>
    </div>
  );
}
