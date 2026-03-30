import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Table2, RefreshCw, Check, X, Clock } from "lucide-react";
import { getResults } from "../data/api";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { cn } from "../lib/cn";

interface ResultsData {
  events: Array<{
    id: number;
    event_number?: number;
    event_name: string;
    sport: string;
    status: string;
    correct_answer: string | null;
    predictions: Record<
      string,
      {
        prediction: string;
        is_correct: boolean | null;
        points_awarded: number;
        prediction_label?: string;
      }
    >;
  }>;
  participants: Array<{ id: number; name: string }>;
  prize_pool?: {
    lunchCostPerHead: number;
    participantCount: number;
    totalLunchCost: number;
    lunchContributions: number[];
  };
}

function useResultsGrid() {
  return useQuery<ResultsData>({
    queryKey: ["results-grid"],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "https://laserbeamnode.replit.app"}/api/vb/results`
      );
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      return res.json();
    },
  });
}

export function ResultsGridPage() {
  const { data, isLoading, error, refetch } = useResultsGrid();

  if (error) {
    return (
      <EmptyState
        icon={<Table2 size={28} />}
        title="Couldn't load results"
        description={error instanceof Error ? error.message : String(error)}
      >
        <button
          onClick={() => refetch()}
          className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-semibold active:scale-95 transition-transform"
        >
          <RefreshCw size={14} /> Try again
        </button>
      </EmptyState>
    );
  }

  if (isLoading) {
    return (
      <div className="px-4 pt-6 flex flex-col gap-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (!data || !data.events?.length) {
    return (
      <EmptyState
        icon={<Table2 size={28} />}
        title="No results yet"
        description="The spreadsheet will populate once events are loaded."
      />
    );
  }

  const { events, participants } = data;
  const participantNames = participants.map((p) => p.name);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="pb-20"
    >
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-lg font-bold text-zinc-800">Results Grid</h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          {events.filter((e) => e.status === "completed").length} of {events.length} events decided
        </p>
      </div>

      <div className="overflow-x-auto px-2">
        <table className="text-xs border-collapse min-w-max">
          <thead>
            <tr>
              <th className="sticky left-0 z-20 bg-zinc-100 px-2 py-2 text-left font-semibold text-zinc-600 border-b border-r border-zinc-200 min-w-[180px]">
                Event
              </th>
              <th className="sticky z-10 bg-zinc-100 px-2 py-2 text-center font-semibold text-zinc-600 border-b border-r border-zinc-200 min-w-[80px]">
                Answer
              </th>
              {participantNames.map((name) => (
                <th
                  key={name}
                  className="bg-zinc-100 px-2 py-2 text-center font-semibold text-zinc-600 border-b border-zinc-200 min-w-[80px]"
                >
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {events.map((event, i) => {
              const isCompleted = event.status === "completed";
              return (
                <tr
                  key={event.id}
                  className={cn(
                    i % 2 === 0 ? "bg-white" : "bg-zinc-50/50",
                    "hover:bg-emerald-50/30 transition-colors"
                  )}
                >
                  <td className="sticky left-0 z-10 px-2 py-1.5 font-medium text-zinc-700 border-r border-zinc-200 bg-inherit min-w-[180px] max-w-[220px]">
                    <span className="line-clamp-2 leading-tight">{event.event_name}</span>
                  </td>
                  <td className="px-2 py-1.5 text-center border-r border-zinc-200">
                    {isCompleted && event.correct_answer ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                        <Check size={10} />
                        <span className="truncate max-w-[70px]">{event.correct_answer}</span>
                      </span>
                    ) : (
                      <span className="text-zinc-300 flex items-center justify-center gap-1">
                        <Clock size={10} />
                        {event.status === "in_progress" ? "Live" : "TBD"}
                      </span>
                    )}
                  </td>
                  {participantNames.map((name) => {
                    const pred = event.predictions?.[name];
                    if (!pred) {
                      return (
                        <td key={name} className="px-2 py-1.5 text-center text-zinc-300 border-zinc-100">
                          -
                        </td>
                      );
                    }
                    const correct = pred.is_correct === true;
                    const incorrect = pred.is_correct === false;
                    return (
                      <td
                        key={name}
                        className={cn(
                          "px-2 py-1.5 text-center border-zinc-100",
                          correct && "bg-emerald-50 text-emerald-800 font-semibold",
                          incorrect && "bg-red-50 text-red-400 line-through",
                          !correct && !incorrect && "text-zinc-600"
                        )}
                      >
                        <div className="flex items-center justify-center gap-0.5">
                          {correct && <Check size={9} className="text-emerald-600 shrink-0" />}
                          {incorrect && <X size={9} className="text-red-400 shrink-0" />}
                          <span className="truncate max-w-[70px]">{pred.prediction}</span>
                        </div>
                        {correct && pred.points_awarded > 0 && (
                          <div className="text-[9px] text-emerald-600 mt-0.5">
                            +{pred.points_awarded.toFixed(1)}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

export default ResultsGridPage;
