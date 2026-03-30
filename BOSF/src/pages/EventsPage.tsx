import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Check, CalendarDays, CheckCircle2 } from "lucide-react";
import { getEventDisplayDate, formatEventDate } from "../lib/dates";
import { useEvents } from "../hooks/useEvents";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { SportIcon } from "../components/ui/SportIcon";
import { StatusPill } from "../components/ui/StatusPill";
import { getCategoryInfo } from "../lib/categories";
import { cn } from "../lib/cn";
import { Zap } from "lucide-react";

type EventTab = "upcoming" | "decided";

export function EventsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<EventTab>("upcoming");
  const {
    allEvents,
    categories,
    selectedCategory,
    setSelectedCategory,
    statusCounts,
    loading,
    error,
  } = useEvents();

  const scrollRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (activeTabRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const button = activeTabRef.current;
      const scrollLeft = button.offsetLeft - container.offsetWidth / 2 + button.offsetWidth / 2;
      container.scrollTo({ left: scrollLeft, behavior: "smooth" });
    }
  }, [selectedCategory]);

  if (error) {
    return (
      <EmptyState
        icon={<Zap size={28} />}
        title="Couldn't load events"
        description={error}
      />
    );
  }

  if (loading) {
    return (
      <div className="px-4 pt-4 flex flex-col gap-3">
        <Skeleton className="h-10 rounded-2xl" />
        <Skeleton className="h-10 rounded-2xl" />
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-16 rounded-2xl" />
      </div>
    );
  }

  const base = selectedCategory === "All" ? allEvents : allEvents.filter((e) => e.sport === selectedCategory);

  const upcomingEvents = base
    .filter((e) => e.status === "upcoming" || e.status === "in_progress")
    .sort((a, b) => {
      // Sort by display date (the later of event_date / close_date) so season-long
      // in-progress events sit at their natural end-of-season position.
      const dateA = a.close_date && a.close_date > (a.event_date ?? "") ? a.close_date : (a.event_date ?? "");
      const dateB = b.close_date && b.close_date > (b.event_date ?? "") ? b.close_date : (b.event_date ?? "");
      if (dateA && dateB) return dateA.localeCompare(dateB);
      if (dateA) return -1;
      if (dateB) return 1;
      return (a.display_order ?? 0) - (b.display_order ?? 0);
    });

  const decidedEvents = base
    .filter((e) => e.status === "completed")
    .sort((a, b) => {
      if (a.event_date && b.event_date) return b.event_date.localeCompare(a.event_date);
      if (a.event_date) return 1;
      if (b.event_date) return -1;
      return (b.display_order ?? 0) - (a.display_order ?? 0);
    });

  const displayEvents = activeTab === "upcoming" ? upcomingEvents : decidedEvents;
  const upcomingCount = statusCounts.upcoming + statusCounts.live;
  const decidedCount = statusCounts.completed;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="pb-20"
    >
      <div className="px-4 pt-4">
        {/* Upcoming / Decided segmented control */}
        <div className="relative flex gap-1 p-1 rounded-xl bg-zinc-100 mb-3">
          <motion.div
            layoutId="segment-pill"
            className="absolute top-1 bottom-1 rounded-lg bg-white shadow-sm"
            style={{ width: "calc(50% - 4px)", left: activeTab === "upcoming" ? 4 : "calc(50% + 0px)" }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
          <button
            onClick={() => setActiveTab("upcoming")}
            className={cn(
              "relative z-10 flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors duration-200",
              activeTab === "upcoming"
                ? "text-zinc-900"
                : "text-zinc-400"
            )}
          >
            <CalendarDays size={13} />
            Upcoming
            {upcomingCount > 0 && (
              <span className={cn(
                "text-[10px] rounded-full px-1.5 py-0.5 font-bold transition-colors duration-200",
                activeTab === "upcoming" ? "bg-emerald-100 text-emerald-700" : "bg-zinc-200 text-zinc-500"
              )}>{upcomingCount}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("decided")}
            className={cn(
              "relative z-10 flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors duration-200",
              activeTab === "decided"
                ? "text-zinc-900"
                : "text-zinc-400"
            )}
          >
            <CheckCircle2 size={13} />
            Decided
            {decidedCount > 0 && (
              <span className={cn(
                "text-[10px] rounded-full px-1.5 py-0.5 font-bold transition-colors duration-200",
                activeTab === "decided" ? "bg-emerald-100 text-emerald-700" : "bg-zinc-200 text-zinc-500"
              )}>{decidedCount}</span>
            )}
          </button>
        </div>

        {/* Category tabs with edge fades */}
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-surface-50 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-surface-50 to-transparent z-10 pointer-events-none" />
          <div
            ref={scrollRef}
            className="flex gap-1.5 py-2 overflow-x-auto scrollbar-none px-1"
          >
            {categories.map((cat) => {
              const isActive = cat === selectedCategory;
              const info = cat === "All" ? null : getCategoryInfo(cat);
              return (
                <button
                  key={cat}
                  ref={isActive ? activeTabRef : null}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all shrink-0 active:scale-95",
                    isActive
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                      : "bg-zinc-100 text-zinc-500 border border-zinc-200/50"
                  )}
                >
                  {info && <span className="text-[11px]">{info.emoji}</span>}
                  {cat === "All" ? "All" : info?.label ?? cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Events list */}
        <AnimatePresence mode="wait">
        {displayEvents.length === 0 ? (
          <motion.div
            key={`empty-${activeTab}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="text-center py-12 text-zinc-400 text-sm"
          >
            {activeTab === "upcoming"
              ? `No upcoming${selectedCategory === "All" ? "" : " " + selectedCategory} events. Check back soon, punter!`
              : `No decided${selectedCategory === "All" ? "" : " " + selectedCategory} events yet. Sit tight!`}
          </motion.div>
        ) : (
          <motion.div
            key={`list-${activeTab}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-1.5 pt-1"
          >
            {displayEvents.map((evt, i) => (
              <motion.div
                key={evt.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.025, 0.5), duration: 0.3 }}
                onClick={() => navigate(`/events/${evt.id}`)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-2xl border cursor-pointer active:scale-[0.98] hover:shadow-md hover:-translate-y-0.5 transition-all shadow-sm",
                  evt.status === "completed"
                    ? "border-zinc-200/60 bg-white"
                    : evt.status === "in_progress"
                    ? "border-amber-200/50 bg-amber-50/30"
                    : "border-zinc-200/60 bg-white"
                )}
              >
                <SportIcon sport={evt.sport} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-800 line-clamp-2 leading-snug">{evt.event_name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {evt.status === "completed" && evt.correct_answer ? (
                      <div className="flex items-center gap-1 min-w-0">
                        <Check size={10} className="text-emerald-600 shrink-0" />
                        <p className="text-xs text-emerald-600 truncate">{evt.correct_answer}</p>
                      </div>
                    ) : evt.status === "in_progress" ? (
                      <div className="flex items-center gap-1.5">
                        <StatusPill status="in_progress" />
                        {formatEventDate(getEventDisplayDate(evt.event_date, evt.close_date)) && (
                          <p className="text-xs text-zinc-400">
                            ends {formatEventDate(getEventDisplayDate(evt.event_date, evt.close_date))}
                          </p>
                        )}
                      </div>
                    ) : formatEventDate(getEventDisplayDate(evt.event_date, evt.close_date)) ? (
                      <p className="text-xs text-zinc-400">
                        {formatEventDate(getEventDisplayDate(evt.event_date, evt.close_date))}
                      </p>
                    ) : null}
                  </div>
                </div>
                <ChevronRight size={14} className="text-zinc-300 shrink-0" />
              </motion.div>
            ))}
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
export default EventsPage;
