import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { Participant } from "@/api/types";

interface ParticipantsTabsProps {
  active: Participant[];
  eliminated: Participant[];
  currentParticipantId?: number;
}

export function ParticipantsTabs({ active, eliminated, currentParticipantId }: ParticipantsTabsProps) {
  return (
    <Tabs defaultValue="active">
      <TabsList>
        <TabsTrigger value="active">Active ({active.length})</TabsTrigger>
        <TabsTrigger value="eliminated">Eliminated ({eliminated.length})</TabsTrigger>
      </TabsList>
      <TabsContent value="active">
        <ul className="flex flex-col gap-1">
          {active.map((p) => (
            <li
              key={p.id}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm",
                p.id === currentParticipantId && "bg-accent font-semibold",
              )}
            >
              {p.name}
              {p.id === currentParticipantId && " (spelling now)"}
            </li>
          ))}
          {active.length === 0 && <li className="text-sm text-muted-foreground">No active participants</li>}
        </ul>
      </TabsContent>
      <TabsContent value="eliminated">
        <ul className="flex flex-col gap-1">
          {eliminated.map((p) => (
            <li key={p.id} className="px-3 py-1.5 text-sm text-muted-foreground">
              {p.name} &mdash; Eliminated in Round {p.eliminatedRound}
            </li>
          ))}
          {eliminated.length === 0 && <li className="text-sm text-muted-foreground">No eliminations yet</li>}
        </ul>
      </TabsContent>
    </Tabs>
  );
}
