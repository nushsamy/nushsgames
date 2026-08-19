import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import * as beesApi from "@/api/bees";
import { ApiError } from "@/api/httpClient";

export function CreateBeePage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setSubmitting(true);
    try {
      const bee = await beesApi.createBee(title.trim());
      navigate(`/host/${bee.id}/builder`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create bee");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex justify-center">
      <div className="flex w-full max-w-[420px] flex-col gap-[18px] rounded-[28px] border-2 border-[oklch(0.9_0.05_340)] bg-[oklch(0.99_0.015_340)] px-[26px] py-8 shadow-[0_10px_24px_oklch(0.7_0.08_340_/_0.25),0_2px_0_oklch(0.85_0.06_340_/_0.6)_inset]">
        <div className="flex flex-col gap-1 text-center">
          <div className="text-[34px]">🎀</div>
          <div className="font-fredoka text-2xl font-semibold text-[oklch(0.42_0.14_340)]">Create a New Bee</div>
          <div className="text-sm font-semibold text-[oklch(0.52_0.05_340)]">
            Give it a title — you'll add rounds and words next
          </div>
        </div>

        <form className="flex flex-col gap-3.5" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="title" className="text-[13px] font-bold text-[oklch(0.42_0.1_340)]">
              Title
            </label>
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Regional Spelling Bee 2026"
              autoFocus
              className="h-11 rounded-2xl border-2 border-[oklch(0.9_0.05_340)] bg-white px-4 text-[15px] text-[oklch(0.35_0.05_340)] outline-none placeholder:text-[oklch(0.75_0.03_340)] focus:border-[oklch(0.75_0.15_340)]"
            />
          </div>
          {error && <p className="text-sm font-semibold text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="mt-1.5 h-[46px] w-full rounded-full border-none bg-[linear-gradient(135deg,oklch(0.72_0.17_340),oklch(0.75_0.15_20))] font-fredoka text-[15px] font-bold text-white shadow-[0_6px_14px_oklch(0.7_0.17_340_/_0.4)] disabled:opacity-60"
          >
            {submitting ? "Creating..." : "Create Bee"}
          </button>
        </form>
      </div>
    </div>
  );
}
