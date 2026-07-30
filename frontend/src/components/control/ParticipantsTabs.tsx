import { Tabs as TabsPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";
import type { Participant } from "@/api/types";

interface ParticipantsTabsProps {
  active: Participant[];
  eliminated: Participant[];
  currentParticipantId?: number;
}

const TAB_TRIGGER =
  "cursor-pointer rounded-full border-2 border-transparent px-[18px] py-2 font-fredoka text-[13px] font-bold data-[state=inactive]:border-[oklch(0.9_0.05_340)] data-[state=inactive]:bg-white data-[state=inactive]:text-[oklch(0.5_0.05_340)] data-[state=active]:bg-[linear-gradient(135deg,oklch(0.72_0.17_340),oklch(0.75_0.15_20))] data-[state=active]:text-white";

export function ParticipantsTabs({ active, eliminated, currentParticipantId }: ParticipantsTabsProps) {
  return (
    <TabsPrimitive.Root defaultValue="active" className="flex flex-col gap-3">
      <TabsPrimitive.List className="flex gap-2">
        <TabsPrimitive.Trigger value="active" className={TAB_TRIGGER}>
          Active ({active.length})
        </TabsPrimitive.Trigger>
        <TabsPrimitive.Trigger value="eliminated" className={TAB_TRIGGER}>
          Eliminated ({eliminated.length})
        </TabsPrimitive.Trigger>
      </TabsPrimitive.List>
      <TabsPrimitive.Content value="active">
        <ul className="m-0 flex flex-col gap-1.5 rounded-[20px] border-2 border-[oklch(0.9_0.05_340)] bg-[oklch(0.99_0.015_340)] p-3.5">
          {active.map((p) => (
            <li
              key={p.id}
              className={cn(
                "list-none rounded-xl px-3 py-2 text-sm font-semibold text-[oklch(0.45_0.05_340)]",
                p.id === currentParticipantId && "bg-[oklch(0.95_0.05_340)] font-bold text-[oklch(0.4_0.12_340)]",
              )}
            >
              {p.name}
              {p.id === currentParticipantId && " (spelling now)"}
            </li>
          ))}
          {active.length === 0 && (
            <li className="list-none text-sm font-semibold text-[oklch(0.6_0.04_340)]">No active participants</li>
          )}
        </ul>
      </TabsPrimitive.Content>
      <TabsPrimitive.Content value="eliminated">
        <ul className="m-0 flex flex-col gap-1.5 rounded-[20px] border-2 border-[oklch(0.9_0.05_340)] bg-[oklch(0.99_0.015_340)] p-3.5">
          {eliminated.map((p) => (
            <li key={p.id} className="list-none px-3 py-2 text-sm font-semibold text-[oklch(0.6_0.04_340)]">
              {p.name} &mdash; Eliminated in Round {p.eliminatedRound}
            </li>
          ))}
          {eliminated.length === 0 && (
            <li className="list-none text-sm font-semibold text-[oklch(0.6_0.04_340)]">No eliminations yet</li>
          )}
        </ul>
      </TabsPrimitive.Content>
    </TabsPrimitive.Root>
  );
}
