import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Trophy, Target, Clock, Check, X, Flame, RefreshCw, Zap } from "lucide-react";
import { usePlayer } from "../hooks/usePlayer";
import { useLeaderboard } from "../hooks/useLeaderboard";
import { getResults } from "../data/api";
import { Avatar } from "../components/ui/Avatar";
import { GlassCard } from "../components/ui/GlassCard";
import { Badge } from "../components/ui/Badge";
import { SportIcon } from "../components/ui/SportIcon";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { ClickableRow } from "../components/ui/ClickableRow";
import { AchievementList } from "../components/ui/AchievementList";
import { PlayerInsight } from "../components/feed/PlayerInsight";
import { PlayerCharts } from "../components/feed/PlayerCharts";
import { FormGuide } from "../components/ui/FormGuide";
import type { FormResult } from "../components/ui/FormGuide";
import {
  computeAchievements,
  annotateCrossPlayerAchievements,
} from "../lib/achievements";
import { cn } from "../lib/cn";

export function PlayerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const numId = Number(id);
  const { data, loading, error, retry } = usePlayer(numId);
  const { entries: leaderboard } = useLeaderboard();
  const { data: resultsData } = useQuery({
    queryKey: ["results"],
    queryFn: getResults,
  });

  const achievements = useMemo(() => {
    if (!data) return [];
    const entry = leaderboard.find((e) => e.id === numId);
    const completedEvents =
      resultsData?.events.filter((e) => e.status === "completed").length ?? 0;
    const base = computeAchievements({
      predictions: data.predictions,
      leaderboardEntry: entry,
      leaderboardSize: leaderboard.length,
      completedEvents,
    });
    if (!resultsData?.predictions?.length) return base;
    return annotateCrossPlayerAchievements(
      base,
      data.predictions,
      resultsData.predictions,
    );
  }, [data, leaderboard, numId, resultsData]);

  // Compute derived stats
  const stats = useMemo(() => {
    if (!data) return null;
    const { predictions, total_points } = data;
    const wins = predictions.filter((p) => p.is_correct === true).length;
    const losses = predictions.filter((p) => p.is_correct === false).length;
    const pending = predictions.filter((p) => p.is_correct === null).length;
    const winRate = (wins + losses) > 0 ? Math.round((wins / (wins + losses)) * 100) : 0;

    // Sort decided by most recent (highest event_id = most recently created)
    const decided = predictions
      .filter((p) => p.is_correct !== null)
      .sort((a, b) => (b.event_id ?? 0) - (a.event_id ?? 0));
    const pendingList = predictions
      .filter((p) => p.is_correct === null)
      .sort((a, b) => (a.event_id ?? 0) - (b.event_id ?? 0));

    // Best sport: sport with highest win rate (min 2 decided)
    const sportStats: Record<string, { wins: number; total: number }> = {};
    for (const pred of predictions) {
      if (pred.is_correct !== null && pred.sport) {
        if (!sportStats[pred.sport]) sportStats[pred.sport] = { wins: 0, total: 0 };
        sportStats[pred.sport].total++;
        if (pred.is_correct) sportStats[pred.sport].wins++;
      }
    }
    const bestSport = Object.entries(sportStats)
      .filter(([, s]) => s.total >= 2)
      .sort((a, b) => (b[1].wins / b[1].total) - (a[1].wins / a[1].total))
      .map(([sport, s]) => ({ sport, winRate: Math.round((s.wins / s.total) * 100), wins: s.wins, total: s.total }))[0] ?? null;

    // Current streak
    let currentStreak = 0;
    let streakType: "win" | "lose" | null = null;
    for (const pred of decided) {
      if (pred.is_correct === true) {
        if (streakType === "lose") break;
        streakType = "win";
        currentStreak++;
      } else if (pred.is_correct === false) {
        if (streakType === "win") break;
        streakType = "lose";
        currentStreak++;
      }
    }

    // Form guide: last 10 decided results (most recent first)
    const formGuide: FormResult[] = decided.slice(0, 10).map((p) => (p.is_correct ? "W" : "L"));

    return { wins, losses, pending, winRate, decided, pendingList, total_points, bestSport, currentStreak, streakType, formGuide };
  }, [data]);

  if (!id || isNaN(numId)) {
    return <EmptyState icon={<X size={28} />} title="Invalid player" description="This player doesn't exist." />;
  }
  if (error) {
    return (
      <EmptyState icon={<X size={28} />} title="Couldn't load player" description={error}>
        <button
          onClick={retry}
          className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-semibold active:scale-95 transition-transform"
        >
          <RefreshCw size={14} /> Try again
        </button>
      </EmptyState>
    );
  }
  if (loading || !data || !stats) {
    return (
      <div className="px-4 pt-6 flex flex-col gap-3">
        <Skeleton className="h-32 rounded-2xl" />
        <div className="grid grid-cols-4 gap-2">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-2xl" />
        ))}
      </div>
    );
  }

  const { participant } = data;
  const { wins, losses, pending, winRate, decided, pendingList, total_points, bestSport, currentStreak, streakType, formGuide } = stats;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="pb-20"
    >
      {/* Profile header */}
      <div className="px-4 pt-4 pb-2">
        <GlassCard className="p-5">
          <div className="flex items-center gap-4">
            <Avatar name={participant.name} id={participant.id} size="xl" ringColor="accent" />
            <div className="flex-1 min-w-0">
              <h1 className="font-display font-extrabold text-xl text-zinc-900 truncate">
                {participant.name}
              </h1>
              <p className="text-3xl font-display font-extrabold text-gradient-accent mt-1">
                {Number(total_points).toFixed(1)} <span className="text-sm text-zinc-400 font-body font-normal">pts</span>
              </p>
            </div>
          </div>

          {/* Streak & best sport badges */}
          {(currentStreak >= 2 || bestSport) && (
            <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-zinc-100">
              {currentStreak >= 2 && streakType && (
                <Badge variant={streakType === "win" ? "accent" : "loss"}>
                  {streakType === "win" ? <Zap size={9} /> : <Flame size={9} />}
                  {currentStreak} {streakType === "win" ? "win" : "loss"} streak
                </Badge>
              )}
              {bestSport && (
                <Badge variant="gold">
                  Best: {bestSport.sport} ({bestSport.winRate}%)
                </Badge>
              )}
            </div>
          )}
        </GlassCard>
      </div>

      {/* Achievements / badges */}
      {achievements.length > 0 && (
        <div className="px-4 mb-4">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2 px-1">
            Badges ({achievements.length})
          </h3>
          <AchievementList achievements={achievements} />
        </div>
      )}

      {/* AI-generated player insight */}
      <PlayerInsight
        name={participant.name}
        wins={wins}
        losses={losses}
        pending={pending}
        totalPoints={total_points}
        winRate={winRate}
      />

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2 px-4 mb-4">
        {[
          { label: "Won", value: wins, icon: <Trophy size={12} />, color: "text-emerald-600" },
          { label: "Lost", value: losses, icon: <X size={12} />, color: "text-red-500" },
          { label: "Pending", value: pending, icon: <Clock size={12} />, color: "text-zinc-400" },
          { label: "Win %", value: `${winRate}%`, icon: <Target size={12} />, color: winRate >= 50 ? "text-emerald-600" : "text-zinc-400" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className="rounded-2xl border border-zinc-200/60 bg-white p-3 text-center shadow-sm"
          >
            <div className="flex justify-center mb-1.5 text-zinc-400">{stat.icon}</div>
            <p className={cn("font-display font-extrabold text-lg", stat.color)}>{stat.value}</p>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-zinc-400 mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Form Guide */}
      {formGuide.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="px-4 mb-4"
        >
          <div className="rounded-2xl border border-zinc-200/60 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <FormGuide results={formGuide} max={10} />
              <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-300 ml-2">
                Latest &rarr;
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Player charts: cumulative points + sport mix */}
      <PlayerCharts predictions={data.predictions} />

      {/* Decided picks */}
      {decided.length > 0 && (
        <div className="px-4 mb-6">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-3 px-1">
            Decided ({decided.length})
          </h3>
          <div className="flex flex-col gap-2">
            {decided.map((pred, i) => (
              <ClickableRow
                key={pred.id ?? `d-${pred.event_id}-${i}`}
                onActivate={() => navigate(`/events/${pred.event_id}`)}
                ariaLabel={`${pred.event_name} — picked ${pred.prediction}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + Math.min(i * 0.02, 0.4) }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-2xl border",
                  pred.is_correct
                    ? "border-emerald-200/40 bg-emerald-50/50"
                    : "border-red-200/30 bg-red-50/30",
                )}
              >
                <SportIcon sport={pred.sport || "AFL"} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-800 line-clamp-2 leading-snug font-medium">{pred.event_name}</p>
                  <p className="text-xs text-zinc-400 truncate mt-0.5">
                    Picked: <span className="text-zinc-600">{pred.prediction}</span>
                    {pred.correct_answer && (
                      <> &middot; <span className={pred.is_correct ? "text-emerald-600" : "text-red-500"}>{pred.correct_answer}</span></>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {pred.is_correct && pred.points_earned > 0 && (
                    <span className="text-xs font-bold text-emerald-600 tabular-nums">
                      +{Number.isInteger(pred.points_earned) ? pred.points_earned : pred.points_earned.toFixed(1)}
                    </span>
                  )}
                  <div className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center",
                    pred.is_correct ? "bg-emerald-100" : "bg-red-100",
                  )}>
                    {pred.is_correct ? <Check size={14} className="text-emerald-600" /> : <X size={14} className="text-red-400" />}
                  </div>
                </div>
              </ClickableRow>
            ))}
          </div>
        </div>
      )}

      {/* Pending picks */}
      {pendingList.length > 0 && (
        <div className="px-4">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-3 px-1">
            Pending ({pendingList.length})
          </h3>
          <div className="flex flex-col gap-2">
            {pendingList.map((pred, i) => (
              <ClickableRow
                key={pred.id ?? `p-${pred.event_id}-${i}`}
                onActivate={() => navigate(`/events/${pred.event_id}`)}
                ariaLabel={`${pred.event_name} — pending`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + Math.min(i * 0.02, 0.4) }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-2xl border border-zinc-200/60 bg-white shadow-sm"
              >
                <SportIcon sport={pred.sport || "AFL"} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-700 line-clamp-2 leading-snug font-medium">{pred.event_name}</p>
                  <p className="text-xs text-zinc-400 truncate mt-0.5">
                    Picked: <span className="text-zinc-600">{pred.prediction}</span>
                  </p>
                </div>
                <Clock size={12} className="text-zinc-300 shrink-0" />
              </ClickableRow>
            ))}
          </div>
        </div>
      )}

      {data.predictions.length === 0 && (
        <EmptyState
          icon={<Flame size={24} />}
          title="No picks yet"
          description={`${participant.name} hasn't had a punt yet. What are they waiting for?`}
        />
      )}
    </motion.div>
  );
}

export default PlayerPage;
