import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import * as eventsApi from "@/mystery/api/events";
import { ApiError } from "@/api/httpClient";
import { Button } from "@/mystery/components/ui/button";
import { Input } from "@/mystery/components/ui/input";
import { Label } from "@/mystery/components/ui/label";

export function CreateEventPage() {
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
      const event = await eventsApi.createEvent(title.trim());
      navigate(`/mystery/host/${event.id}/builder`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create event");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex justify-center">
      <div className="flex w-full max-w-[420px] flex-col gap-[18px] rounded-[28px] border-2 border-[oklch(0.9_0.05_340)] bg-[oklch(0.99_0.015_340)] px-[26px] py-8 shadow-[0_10px_24px_oklch(0.7_0.08_340_/_0.25),0_2px_0_oklch(0.85_0.06_340_/_0.6)_inset]">
        <div className="flex flex-col gap-1 text-center">
          <div className="text-[34px]">🗝️</div>
          <div className="font-display text-2xl font-semibold text-[oklch(0.42_0.14_340)]">Create a New Mystery</div>
          <div className="text-sm font-semibold text-[oklch(0.52_0.05_340)]">
            Give it a title — you'll add suspects, participants, and rounds next
          </div>
        </div>

        <form className="flex flex-col gap-3.5" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Blackwood Manor"
              autoFocus
            />
          </div>
          {error && <p className="text-sm font-semibold text-destructive">{error}</p>}
          <Button type="submit" disabled={submitting} className="mt-1.5 h-11">
            {submitting ? "Creating..." : "Create Mystery"}
          </Button>
        </form>
      </div>
    </div>
  );
}
