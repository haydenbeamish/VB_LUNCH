import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { CompetitionEvent } from "../types";
import { getEvents } from "../data/api";


export function useEvents() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const { data: events = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: ["events"],
    queryFn: () => getEvents(),
  });

  const categories = useMemo(() => {
    const cats = new Set(events.map((e: CompetitionEvent) => e.sport));
    return ["All", ...Array.from(cats).sort()];
  }, [events]);

  const filteredEvents = useMemo(() => {
    const base = selectedCategory === "All" ? events : events.filter((e: CompetitionEvent) => e.sport === selectedCategory);

    return [...base].sort((a: CompetitionEvent, b: CompetitionEvent) => {
      if (a.status === "completed" && b.status !== "completed") return 1;
      if (b.status === "completed" && a.status !== "completed") return -1;

      if (a.status === "completed") {
        return (b.display_order ?? 0) - (a.display_order ?? 0);
      }

      // For upcoming/in_progress: sort by the display date (later of event_date / close_date)
      // so season-long events (e.g. AFL H&A) sit at their natural end-of-season position.
      const dateA = a.close_date && a.close_date > (a.event_date ?? "") ? a.close_date : (a.event_date ?? "");
      const dateB = b.close_date && b.close_date > (b.event_date ?? "") ? b.close_date : (b.event_date ?? "");
      if (dateA && dateB) return dateA.localeCompare(dateB);
      if (dateA) return -1;
      if (dateB) return 1;
      return (a.display_order ?? 0) - (b.display_order ?? 0);
    });
  }, [events, selectedCategory]);

  const statusCounts = useMemo(() => {
    const base = selectedCategory === "All" ? events : events.filter((e: CompetitionEvent) => e.sport === selectedCategory);
    return {
      live: base.filter((e: CompetitionEvent) => e.status === "in_progress").length,
      upcoming: base.filter((e: CompetitionEvent) => e.status === "upcoming").length,
      completed: base.filter((e: CompetitionEvent) => e.status === "completed").length,
    };
  }, [events, selectedCategory]);

  return {
    events: filteredEvents,
    allEvents: events,
    categories,
    selectedCategory,
    setSelectedCategory,
    statusCounts,
    loading,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
    retry: () => { refetch(); },
  };
}
