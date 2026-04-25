import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, X, Clock, Sparkles, RefreshCw, Users, Flame } from "lucide-react";
import { useEvent } from "../hooks/useEvent";
import { isCorrect, isIncorrect } from "../lib/predictions";
import { SportIcon } from "../components/ui/SportIcon";
import { StatusPill } from "../components/ui/StatusPill";
import { Avatar } from "../components/ui/Avatar";
import { GlassCard } from "../components/ui/GlassCard";
import { Badge } from "../components/ui/Badge";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { ClickableRow } from "../components/ui/ClickableRow";
import { EventNews } from "../components/feed/EventNews";
import { cn } from "../lib/cn";

interface PredictionGroup {
  answer: string;
  predictions: Array<{
    id?: number;
    participant_id: number;
    participant_name?: string;
    prediction: string;
    is_correct: boolean | null;
    points_earned: number;
  }>;
  isCorrect: boolean | null;
  isOutlier: boolean;
  percentage: number;
  isMostPicked: boolean;
}

function groupPredictions(predictions: Array<{
  id?: number;
  participant_id: number;
  participant_name?: string;
  prediction: string;
  is_correct: boolean | null;
  points_earned: number;
}>): PredictionGroup[] {
  const groups: Record<string, PredictionGroup> = {};

  for (const pred of predictions) {
    const key = pred.prediction.toLowerCase().trim();
    const correctness = isCorrect(pred.is_correct)
      ? true
      : isIncorrect(pred.is_correct)
      ? false
      : null;
    if (!groups[key]) {
      groups[key] = {
        answer: pred.prediction,
        predictions: [],
        isCorrect: correctness,
        isOutlier: false,
        percentage: 0,
        isMostPicked: false,
      };
    }
    groups[key].predictions.push(pred);
  }

  const total = predictions.length;
  const threshold = Math.max(1, Math.floor(total * 0.2));

  const list = Object.values(groups).map((g) => ({
    ...g,
    percentage: total > 0 ? Math.round((g.predictions.length / total) * 100) : 0,
    isOutlier: g.predictions.length <= threshold && total >= 3,
  }));

  const maxCount = list.reduce((m, g) => Math.max(m, g.predictions.length), 0);
  for (const g of list) {
    if (g.predictions.length === maxCount && maxCount > 0) g.isMostPicked = true;
  }

  list.sort((a, b) => {
    if (a.isCorrect === true && b.isCorrect !== true) return -1;
    if (b.isCorrect === true && a.isCorrect !== true) return 1;
    return b.predictions.length - a.predictions.length;
  });

  return list;
}

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const numId = Number(id);
  const { event, loading, error, retry } = useEvent(numId);

  if (!id || isNaN(numId)) {
    return <EmptyState icon={<X size={28} />} title="Invalid event" description="This event doesn't exist." />;
  }
  if (error) {
    return (
      <EmptyState icon={<X size={28} />} title="Couldn't load event" description={error}>
        <button
          onClick={retry}
          className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-semibold active:scale-95 transition-transform"
        >
          <RefreshCw size={14} /> Try again
        </button>
      </EmptyState>
    );
  }
  if (loading || !event) {
    return (
      <div className="px-4 pt-4 flex flex-col gap-3">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-16 rounded-2xl" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-2xl" />
        ))}
      </div>
    );
  }

  const isDecided = event.status === "completed";

  const predictions = event.predictions ?? [];
  const correctCount = predictions.filter((p) => isCorrect(p.is_correct)).length;
  const groups = groupPredictions(predictions);
  const uniqueAnswers = groups.length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="pb-20"
    >
      {/* Event header */}
      <div className="px-4 pt-4 pb-4">
        <div className="flex items-start gap-3">
          <SportIcon sport={event.sport} size="lg" />
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-extrabold text-lg text-zinc-900 leading-tight">
              {event.event_name}
            </h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <StatusPill status={event.status} />
              <span className="text-xs text-zinc-400">{event.sport}</span>
            </div>
            {event.event_date && (
              <p className="text-xs text-zinc-400 mt-2">
                {new Date(event.event_date).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
              </p>
            )}
          </div>
        </div>

        {/* Result banner */}
        {isDecided && event.correct_answer && (
          <GlassCard glow="accent" className="mt-4 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <Check size={20} className="text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-0.5">Result</p>
                <p className="font-display font-extrabold text-base text-zinc-900">{event.correct_answer}</p>
              </div>
            </div>
            {predictions.length > 0 && (
              <div className="mt-3 pt-3 border-t border-zinc-100">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-zinc-400">
                    {correctCount} of {predictions.length} got it right
                  </p>
                  <span className={cn(
                    "text-xs font-bold",
                    correctCount === 0 ? "text-red-500" :
                    correctCount === predictions.length ? "text-emerald-600" :
                    "text-zinc-500"
                  )}>
                    {correctCount === 0 ? "Total wipeout" :
                     correctCount === predictions.length ? "Clean sweep!" :
                     `${Math.round((correctCount / predictions.length) * 100)}% correct`}
                  </span>
                </div>
                {correctCount > 0 && (
                  <p className="text-xs text-emerald-600 font-semibold mt-1">
                    {event.points_value} pts shared {correctCount > 1 ? `between ${correctCount}` : ""} — {Number((event.points_value / correctCount).toFixed(2))} pts each
                  </p>
                )}
              </div>
            )}
          </GlassCard>
        )}

      </div>

      {/* Grouped Predictions */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            All Picks ({predictions.length})
          </h3>
          {uniqueAnswers > 1 && (
            <span className="text-[10px] text-zinc-400">
              {uniqueAnswers} different answers
            </span>
          )}
        </div>

        {predictions.length === 0 ? (
          <div className="text-center py-12">
            <Users size={24} className="mx-auto text-zinc-300 mb-3" />
            <p className="text-sm text-zinc-400 font-medium">No picks yet</p>
            <p className="text-xs text-zinc-300 mt-1">The punters haven't had their say yet. Give 'em time.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {groups.map((group, gi) => (
              <motion.div
                key={group.answer}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: gi * 0.05, duration: 0.3 }}
              >
                {/* Group header */}
                <div className="flex items-center gap-2 mb-2 px-1">
                  <div className="flex-1 flex items-center gap-2 min-w-0">
                    <span className={cn(
                      "font-display font-bold text-sm truncate",
                      group.isCorrect === true ? "text-emerald-700" :
                      group.isCorrect === false ? "text-red-500" :
                      "text-zinc-700"
                    )}>
                      {group.answer}
                    </span>
                    {group.isCorrect === true && (
                      <Check size={14} className="text-emerald-600 shrink-0" />
                    )}
                    {group.isCorrect === false && isDecided && (
                      <X size={12} className="text-red-400 shrink-0" />
                    )}
                    {group.isMostPicked && group.predictions.length > 1 && (
                      <Badge variant="gold" size="sm" className="shrink-0">
                        <Flame size={8} /> Most picked
                      </Badge>
                    )}
                    {group.isOutlier && (
                      <Badge variant="void" size="sm" className="shrink-0">
                        <Sparkles size={8} /> Outlier
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-zinc-400 shrink-0">
                    {group.predictions.length} pick{group.predictions.length !== 1 ? "s" : ""} ({group.percentage}%)
                  </span>
                </div>

                {/* Consensus bar - animated */}
                <div className="h-1.5 rounded-full bg-zinc-100 mb-2 mx-1 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${group.percentage}%` }}
                    transition={{ delay: gi * 0.05 + 0.2, duration: 0.5, ease: "easeOut" }}
                    className={cn(
                      "h-full rounded-full",
                      group.isCorrect === true ? "bg-emerald-400" :
                      group.isCorrect === false ? "bg-red-300" :
                      "bg-zinc-300"
                    )}
                  />
                </div>

                {/* Participants in this group */}
                <div className="flex flex-col gap-1.5">
                  {group.predictions.map((pred, i) => (
                    <ClickableRow
                      key={pred.id ?? `${pred.participant_id}-${i}`}
                      onActivate={() => navigate(`/player/${pred.participant_id}`)}
                      ariaLabel={`${pred.participant_name ?? "Player"} — picked ${pred.prediction}`}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl border",
                        group.isCorrect === true
                          ? "border-emerald-200/40 bg-emerald-50/50"
                          : group.isCorrect === false
                          ? "border-red-200/30 bg-red-50/30"
                          : "border-zinc-200/60 bg-white",
                      )}
                    >
                      <Avatar name={pred.participant_name ?? "?"} id={pred.participant_id} size="sm" />
                      <span className="font-display font-semibold text-sm text-zinc-800 flex-1 truncate">
                        {pred.participant_name}
                      </span>

                      {isDecided && (
                        <div className={cn(
                          "w-6 h-6 rounded-lg flex items-center justify-center shrink-0",
                          isCorrect(pred.is_correct) ? "bg-emerald-100" : "bg-red-100",
                        )}>
                          {isCorrect(pred.is_correct) ? (
                            <Check size={12} className="text-emerald-600" />
                          ) : (
                            <X size={12} className="text-red-400" />
                          )}
                        </div>
                      )}
                      {!isDecided && (
                        <Clock size={12} className="text-zinc-400 shrink-0" />
                      )}
                    </ClickableRow>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Brave Search: Latest news for this event */}
        <EventNews eventName={event.event_name} sport={event.sport} />
      </div>
    </motion.div>
  );
}

export default EventDetailPage;
