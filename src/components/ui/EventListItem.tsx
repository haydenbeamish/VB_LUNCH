import { useNavigate } from "react-router-dom";
import { ChevronRight, Check } from "lucide-react";
import { cn } from "../../lib/cn";
import { SportIcon } from "./SportIcon";
import { StatusPill } from "./StatusPill";
import { ClickableRow } from "./ClickableRow";
import { formatEventDate, getEventDisplayDate } from "../../lib/dates";
import type { CompetitionEvent } from "../../types";

interface EventListItemProps {
  event: CompetitionEvent;
  index?: number;
  animated?: boolean;
  iconSize?: "sm" | "md" | "lg";
  className?: string;
}

export function EventListItem({
  event,
  index = 0,
  animated = true,
  iconSize = "md",
  className,
}: EventListItemProps) {
  const navigate = useNavigate();
  const isCompleted = event.status === "completed";
  const isLive = event.status === "in_progress";
  const displayDate = formatEventDate(
    getEventDisplayDate(event.event_date, event.close_date),
  );

  const animProps = animated
    ? {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        transition: { delay: Math.min(index * 0.025, 0.3), duration: 0.3 },
      }
    : {};

  return (
    <ClickableRow
      onActivate={() => navigate(`/events/${event.id}`)}
      ariaLabel={`${event.event_name} — ${event.sport}`}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-2xl border shadow-sm",
        "hover:shadow-md hover:-translate-y-0.5",
        isCompleted
          ? "border-zinc-200/60 bg-white"
          : isLive
          ? "border-amber-200/50 bg-amber-50/30"
          : "border-zinc-200/60 bg-white",
        className,
      )}
      {...animProps}
    >
      <SportIcon sport={event.sport} size={iconSize} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-800 line-clamp-2 leading-snug">
          {event.event_name}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {isCompleted && event.correct_answer ? (
            <div className="flex items-center gap-1 min-w-0">
              <Check size={10} className="text-emerald-600 shrink-0" />
              <p className="text-xs text-emerald-600 truncate">
                {event.correct_answer}
              </p>
            </div>
          ) : isLive ? (
            <div className="flex items-center gap-1.5">
              <StatusPill status="in_progress" />
              {displayDate && (
                <p className="text-xs text-zinc-400">ends {displayDate}</p>
              )}
            </div>
          ) : (
            displayDate && <p className="text-xs text-zinc-400">{displayDate}</p>
          )}
        </div>
      </div>
      <ChevronRight size={14} className="text-zinc-300 shrink-0" />
    </ClickableRow>
  );
}
