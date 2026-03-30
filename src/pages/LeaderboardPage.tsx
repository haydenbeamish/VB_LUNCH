import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, Target, Flame, RefreshCw, TrendingUp } from "lucide-react";
import { useLeaderboard } from "../hooks/useLeaderboard";
import { Podium } from "../components/leaderboard/Podium";
import { RankRow } from "../components/leaderboard/RankRow";
import { SpudBanner } from "../components/leaderboard/SpudBanner";
import { StatCard } from "../components/ui/StatCard";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";

export function LeaderboardPage() {
  const { entries, spud, loading, error, retry } = useLeaderboard();
  const navigate = useNavigate();

  if (error) {
    return (
      <EmptyState
        icon={<Trophy size={28} />}
        title="Couldn't load standings"
        description={error}
      >
        <button
          onClick={retry}
          className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-semibold active:scale-95 transition-transform"
        >
          <RefreshCw size={14} /> Try again
        </button>
      </EmptyState>
    );
  }

  if (loading) {
    return (
      <div className="px-4 pt-6 flex flex-col gap-3">
        <div className="flex gap-3 mb-4">
          <Skeleton className="h-24 flex-1" />
          <Skeleton className="h-24 flex-1" />
        </div>
        <Skeleton className="h-48 rounded-2xl" />
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={<Trophy size={28} />}
        title="No standings yet"
        description="Nothing to see here yet, punter. Sit tight — the action's coming."
      />
    );
  }

  // Use decided predictions for group win rate
  const totalDecided = entries.reduce((s, e) => s + e.decided_predictions, 0);
  const totalCorrect = entries.reduce((s, e) => s + e.correct_predictions, 0);
  const groupWinRate = totalDecided > 0 ? Math.round((totalCorrect / totalDecided) * 100) : 0;
  const topScore = entries[0]?.total_points ?? 0;

  // Find the tightest race at the top (gap between 1st and 2nd)
  const topGap = entries.length >= 2 ? entries[0].total_points - entries[1].total_points : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="pb-20"
    >
      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2 px-4 pt-4">
        <StatCard
          label="Punters"
          value={entries.length}
          icon={<Trophy size={14} />}
          delay={0}
        />
        <StatCard
          label="Win Rate"
          value={`${groupWinRate}%`}
          icon={<Target size={14} />}
          accent={groupWinRate >= 50 ? "accent" : "default"}
          delay={0.05}
        />
        <StatCard
          label="Top Score"
          value={topScore.toFixed(1)}
          icon={<Flame size={14} />}
          accent="gold"
          delay={0.1}
        />
      </div>

      {/* Race tightness indicator */}
      {entries.length >= 2 && topGap <= 3 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mx-4 mt-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/30 px-4 py-2.5 flex items-center gap-2"
        >
          <TrendingUp size={14} className="text-amber-600 shrink-0" />
          <p className="text-xs text-amber-700 font-medium">
            {topGap === 0
              ? `${entries[0].name} and ${entries[1].name} are tied at the top!`
              : `Only ${topGap.toFixed(1)} point${topGap === 1 ? "" : "s"} between 1st and 2nd — it's a tight race!`}
          </p>
        </motion.div>
      )}

      {/* Podium */}
      <Podium entries={entries} onSelect={(id) => navigate(`/player/${id}`)} />

      {/* Spud */}
      {spud && <SpudBanner spud={spud} />}

      {/* Rest of rankings */}
      {entries.length > 3 && (
        <div className="px-4 mt-2">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-3 px-1">
            Full Standings
          </h3>
          <div className="flex flex-col gap-2">
            {entries.slice(3).map((entry, i) => (
              <RankRow
                key={entry.id}
                entry={entry}
                isSpud={spud?.id === entry.id}
                index={i}
                totalEntries={entries.length}
              />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default LeaderboardPage;
