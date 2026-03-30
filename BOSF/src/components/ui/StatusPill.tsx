import { cn } from "../../lib/cn";
import type { EventStatus } from "../../types";

const config: Record<EventStatus, { label: string; dot: string; text: string; bg: string }> = {
  completed: { label: "Decided", dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" },
  in_progress: { label: "Live", dot: "bg-amber-500 animate-pulse", text: "text-amber-700", bg: "bg-amber-50" },
  upcoming: { label: "Upcoming", dot: "bg-zinc-400", text: "text-zinc-600", bg: "bg-zinc-100" },
};

export function StatusPill({ status }: { status: EventStatus }) {
  const c = config[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5", c.bg)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", c.dot)} />
      <span className={cn("text-[10px] font-bold uppercase tracking-wider", c.text)}>
        {c.label}
      </span>
    </span>
  );
}
