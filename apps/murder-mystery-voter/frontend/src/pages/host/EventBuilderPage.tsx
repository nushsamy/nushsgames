import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { RoundListItem } from "@/components/roundBuilder/RoundListItem";
import { useEventBuilder } from "@/hooks/useEventBuilder";

type Tab = "suspects" | "participants" | "rounds";

function AddSuspectForm({ onAdd }: { onAdd: (name: string, description?: string) => Promise<void> }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await onAdd(name.trim(), description.trim() || undefined);
    setName("");
    setDescription("");
  }

  return (
    <form className="flex flex-col gap-2 sm:flex-row" onSubmit={handleSubmit}>
      <Input placeholder="Suspect name" value={name} onChange={(e) => setName(e.target.value)} />
      <Input placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
      <Button type="submit">Add</Button>
    </form>
  );
}

function AddParticipantForm({ onAdd }: { onAdd: (name: string, email: string) => Promise<void> }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    await onAdd(name.trim(), email.trim());
    setName("");
    setEmail("");
  }

  return (
    <form className="flex flex-col gap-2 sm:flex-row" onSubmit={handleSubmit}>
      <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
      <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Button type="submit">Add</Button>
    </form>
  );
}

export function EventBuilderPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const id = Number(eventId);
  const builder = useEventBuilder(id);
  const [tab, setTab] = useState<Tab>("suspects");
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (builder.event && builder.event.status !== "created") {
      navigate(`/host/${id}/control`, { replace: true });
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
      navigate(`/host/${id}/control`);
    }
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "suspects", label: "Suspects", count: builder.suspects.length },
    { key: "participants", label: "Participants", count: builder.participants.length },
    { key: "rounds", label: "Rounds", count: builder.rounds.length },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-[28px] font-semibold text-[oklch(0.4_0.14_340)]">{builder.event.title}</h1>
        <p className="text-sm font-semibold text-[oklch(0.52_0.05_340)]">
          Add suspects, invite participants, and build your rounds — then start the mystery.
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

      {tab === "suspects" && (
        <div className="flex flex-col gap-3">
          <AddSuspectForm onAdd={builder.addSuspect} />
          <div className="flex flex-col gap-2">
            {builder.suspects.map((s) => (
              <Card
                key={s.id}
                className="flex-row items-center justify-between px-5 py-3"
              >
                <div>
                  <div className="font-semibold text-[oklch(0.35_0.05_340)]">{s.name}</div>
                  {s.description && <div className="text-xs text-[oklch(0.6_0.04_340)]">{s.description}</div>}
                </div>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => void builder.deleteSuspect(s.id)}>
                  Remove
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === "participants" && (
        <div className="flex flex-col gap-3">
          <AddParticipantForm onAdd={builder.addParticipant} />
          <div className="flex flex-col gap-2">
            {builder.participants.map((p) => (
              <Card
                key={p.id}
                className="flex-row items-center justify-between px-5 py-3"
              >
                <div>
                  <div className="font-semibold text-[oklch(0.35_0.05_340)]">{p.name}</div>
                  <div className="text-xs text-[oklch(0.6_0.04_340)]">{p.email}</div>
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
                suspects={builder.suspects}
                onSave={(ids) => builder.setRoundSuspects(round.roundNumber, ids)}
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
