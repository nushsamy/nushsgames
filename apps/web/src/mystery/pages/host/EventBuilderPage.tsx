import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/mystery/components/ui/button";
import { Input } from "@/mystery/components/ui/input";
import { Card } from "@/mystery/components/ui/card";
import { RoundListItem } from "@/mystery/components/roundBuilder/RoundListItem";
import { useEventBuilder } from "@/mystery/hooks/useEventBuilder";
import { useBreadcrumbStore } from "@/store/breadcrumbStore";
import type { ParticipantInput } from "@/mystery/api/participants";

type Tab = "cast" | "rounds";

function AddParticipantForm({ onAdd }: { onAdd: (input: ParticipantInput) => Promise<void> }) {
  const [characterName, setCharacterName] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!characterName.trim() || !name.trim() || !email.trim()) return;
    await onAdd({
      characterName: characterName.trim(),
      name: name.trim(),
      email: email.trim(),
      description: description.trim() || undefined,
    });
    setCharacterName("");
    setName("");
    setDescription("");
    setEmail("");
  }

  return (
    <form className="flex flex-col gap-2 sm:flex-row sm:flex-wrap" onSubmit={handleSubmit}>
      <Input
        placeholder="Suspect name (e.g. Colonel Mustard)"
        value={characterName}
        onChange={(e) => setCharacterName(e.target.value)}
        className="sm:flex-1"
      />
      <Input
        placeholder="Participant's real name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="sm:flex-1"
      />
      <Input
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="sm:flex-1"
      />
      <Input
        placeholder="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="sm:flex-1"
      />
      <Button type="submit">Add</Button>
    </form>
  );
}

export function EventBuilderPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const id = Number(eventId);
  const builder = useEventBuilder(id);
  const [tab, setTab] = useState<Tab>("cast");
  const [starting, setStarting] = useState(false);

  const setBreadcrumbLabel = useBreadcrumbStore((s) => s.setLabel);
  useEffect(() => {
    setBreadcrumbLabel(builder.event?.title ?? null);
    return () => setBreadcrumbLabel(null);
  }, [builder.event?.title, setBreadcrumbLabel]);

  useEffect(() => {
    if (builder.event && builder.event.status !== "created") {
      navigate(`/mystery/host/${id}/control`, { replace: true });
    }
  }, [builder.event, id, navigate]);

  if (builder.loading || !builder.event || builder.event.status !== "created") {
    return <p className="font-semibold text-[oklch(0.6_0.04_340)]">Loading...</p>;
  }

  async function handleStart() {
    setStarting(true);
    const ok = await builder.startEvent();
    setStarting(false);
    if (ok) {
      toast.success("Mystery started — take attendance next");
      navigate(`/mystery/host/${id}/control`);
    }
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "cast", label: "Cast", count: builder.participants.length },
    { key: "rounds", label: "Rounds", count: builder.rounds.length },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-[28px] font-semibold text-[oklch(0.4_0.14_340)]">{builder.event.title}</h1>
        <p className="text-sm font-semibold text-[oklch(0.52_0.05_340)]">
          Add your cast — each person is both a suspect and a voter — then build your rounds and start the mystery.
        </p>
      </div>

      <div className="flex gap-2 border-b-2 border-[oklch(0.9_0.05_340)]">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`border-b-2 px-4 py-2 text-sm font-semibold ${
              tab === t.key
                ? "border-[oklch(0.72_0.17_340)] text-[oklch(0.45_0.14_340)]"
                : "border-transparent text-[oklch(0.6_0.04_340)]"
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {tab === "cast" && (
        <div className="flex flex-col gap-3">
          <AddParticipantForm onAdd={builder.addParticipant} />
          <div className="flex flex-col gap-2">
            {builder.participants.map((p) => (
              <Card key={p.id} className="flex-row items-center justify-between px-5 py-3">
                <div>
                  <div className="font-semibold text-[oklch(0.35_0.05_340)]">
                    {p.characterName}
                    <span className="ml-2 text-xs font-normal text-[oklch(0.6_0.04_340)]">
                      played by {p.name}
                    </span>
                  </div>
                  <div className="text-xs text-[oklch(0.6_0.04_340)]">{p.email}</div>
                  {p.description && <div className="text-xs text-[oklch(0.6_0.04_340)]">{p.description}</div>}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => void builder.deleteParticipant(p.id)}
                >
                  Remove
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === "rounds" && (
        <div className="flex flex-col gap-3">
          <Button variant="outline" onClick={() => void builder.addRound()}>
            + Add Round
          </Button>
          <div className="flex flex-col gap-3">
            {builder.rounds.map((round) => (
              <RoundListItem
                key={round.id}
                round={round}
                cast={builder.participants}
                onDelete={() => builder.deleteRound(round.roundNumber)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end border-t-2 border-[oklch(0.9_0.05_340)] pt-5">
        <Button size="lg" disabled={!builder.canStart || starting} onClick={() => void handleStart()}>
          {starting ? "Starting..." : "Start Mystery"}
        </Button>
      </div>
    </div>
  );
}
