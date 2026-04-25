import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Target,
  Flame,
  RefreshCw,
  TrendingUp,
  Users,
  ChevronRight,
} from "lucide-react";
import { useLeaderboard } from "../hooks/useLeaderboard";
import { useEvents } from "../hooks/useEvents";
import { Podium } from "../components/leaderboard/Podium";
import { RankRow } from "../components/leaderboard/RankRow";
import { SpudBanner } from "../components/leaderboard/SpudBanner";
import { StatCard } from "../components/ui/StatCard";
import { Avatar } from "../components/ui/Avatar";
import { Badge } from "../components/ui/Badge";
import { FormGuide } from "../components/ui/FormGuide";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { ClickableRow } from "../components/ui/ClickableRow";
import { cn } from "../lib/cn";
import type { EnhancedLeaderboardEntry } from "../hooks/useLeaderboard";

type Tab = "standings" | "members";
type SortKey = "points" | "win_rate" | "form" | "picks";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "points", label: "Points" },
  { key: "win_rate", label: "Win %" },
  { key: "form", label: "Form" },
  { key: "picks", label: "Picks" },
];

function formScore(entry: EnhancedLeaderboardEntry): number {
  let score = 0;
  for (let i = 0; i < entry.form.length; i++) {
    const weight = Math.max(1, 5 - i);
    if (entry.form[i] === "W") score += weight;
  }
  return score;
}

function sortEntries(
  entries: EnhancedLeaderboardEntry[],
  key: SortKey,
): EnhancedLeaderboardEntry[] {
  if (key === "points") return entries;
  const copy = [...entries];
  copy.sort((a, b) => {
    if (key === "win_rate")
      return b.win_rate - a.win_rate || b.total_points - a.total_points;
    if (key === "form")
      return formScore(b) - formScore(a) || b.total_points - a.total_points;
    if (key === "picks")
      return (
        b.total_predictions - a.total_predictions ||
        b.total_points - a.total_points
      );
    return 0;
  });
  return copy;
}

export function LeaderboardPage() {
  const { entries, spud, loading, error, retry } = useLeaderboard();
  const { allEvents } = useEvents();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("standings");
  const [sortKey, setSortKey] = useState<SortKey>("points");
  const [showInactive, setShowInactive] = useState(true);

  const {
    visibleEntries,
    groupWinRate,
    topScore,
    topGap,
    completedEvents,
    tiedAtTop,
  } = useMemo(() => {
    const totalDecided = entries.reduce(
      (s, e) => s + e.decided_predictions,
      0,
    );
    const totalCorrect = entries.reduce(
      (s, e) => s + e.correct_predictions,
      0,
    );
    const groupWinRate =
      totalDecided > 0 ? Math.round((totalCorrect / totalDecided) * 100) : 0;
    const topScore = entries[0]?.total_points ?? 0;
    const topGap =
      entries.length >= 2 ? entries[0].total_points - entries[1].total_points : 0;
    const completedEvents = allEvents.filter(
      (e) => e.status === "completed",
    ).length;

    const tiedAtTop =
      entries.length >= 2
        ? entries.filter((e) => e.total_points === topScore).length
        : 1;

    const filtered = showInactive
      ? entries
      : entries.filter((e) => e.total_predictions > 0);

    return {
      visibleEntries: sortEntries(filtered, sortKey),
      groupWinRate,
      topScore,
      topGap,
      completedEvents,
      tiedAtTop,
    };
  }, [entries, allEvents, sortKey, showInactive]);

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
          <Skeleton className="h-24 flex-1" />
        </div>
        <Skeleton className="h-10 rounded-xl" />
        <Skeleton className="h-48 rounded-2xl" />
        {Array.from({ length: 5 }).map((_, i) => (
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="pb-20"
    >
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

      {/* Tab toggle */}
      <div className="mx-4 mt-4 flex rounded-xl bg-zinc-100 p-1 gap-1">
        {(["standings", "members"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            aria-pressed={activeTab === tab}
            className={cn(
              "flex-1 py-2 rounded-lg text-xs font-bold transition-all capitalize",
              activeTab === tab
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-400",
            )}
          >
            {tab === "standings" ? "Standings" : "Members"}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "standings" ? (
          <motion.div
            key="standings"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.18 }}
          >
            {entries.length >= 2 && topGap <= 3 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mx-4 mt-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/30 px-4 py-2.5 flex items-center gap-2"
              >
                <TrendingUp size={14} className="text-amber-600 shrink-0" />
                <p className="text-xs text-amber-700 font-medium">
                  {tiedAtTop >= 3
                    ? `${tiedAtTop} punters tied at the top — nobody's running away with it!`
                    : topGap === 0
                    ? `${entries[0].name} and ${entries[1].name} tied at the top!`
                    : `Only ${topGap.toFixed(1)} point${topGap === 1 ? "" : "s"} between 1st and 2nd — tight race.`}
                </p>
              </motion.div>
            )}

            <Podium
              entries={entries}
              onSelect={(id) => navigate(`/player/${id}`)}
            />
            {spud && <SpudBanner spud={spud} />}

            {entries.length > 3 && (
              <div className="px-4 mt-2">
                <div className="flex items-center justify-between mb-3 gap-2">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    Full Standings
                  </h3>
                  <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => setSortKey(opt.key)}
                        aria-pressed={sortKey === opt.key}
                        className={cn(
                          "text-[10px] font-semibold px-2 py-1 rounded-full transition-colors whitespace-nowrap",
                          sortKey === opt.key
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                            : "text-zinc-400 border border-transparent",
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                    <button
                      onClick={() => setShowInactive((v) => !v)}
                      aria-pressed={!showInactive}
                      className={cn(
                        "text-[10px] font-semibold px-2 py-1 rounded-full transition-colors whitespace-nowrap ml-1",
                        !showInactive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                          : "text-zinc-400 border border-transparent",
                      )}
                      title={
                        showInactive
                          ? "Hide punters with no picks"
                          : "Show all"
                      }
                    >
                      Active only
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {(sortKey === "points"
                    ? visibleEntries.slice(3)
                    : visibleEntries
                  ).map((entry, i) => (
                    <RankRow
                      key={entry.id}
                      entry={entry}
                      isSpud={spud?.id === entry.id}
                      index={i}
                    />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="members"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.18 }}
          >
            <div className="px-4 pt-4 pb-2">
              <p className="text-xs text-zinc-400">
                {entries.length} punter{entries.length !== 1 ? "s" : ""} having
                a crack
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 px-4 mb-4">
              <div className="rounded-xl border border-zinc-200/60 bg-white p-2.5 text-center shadow-sm">
                <div className="flex justify-center mb-1 text-zinc-400">
                  <Users size={11} />
                </div>
                <p className="font-display font-extrabold text-sm text-zinc-900">
                  {entries.reduce((s, m) => s + m.total_predictions, 0)}
                </p>
                <p className="text-[9px] font-semibold uppercase tracking-wider text-zinc-400">
                  Total Picks
                </p>
              </div>
              <div className="rounded-xl border border-zinc-200/60 bg-white p-2.5 text-center shadow-sm">
                <div className="flex justify-center mb-1 text-zinc-400">
                  <Target size={11} />
                </div>
                <p className="font-display font-extrabold text-sm text-emerald-600">
                  {groupWinRate}%
                </p>
                <p className="text-[9px] font-semibold uppercase tracking-wider text-zinc-400">
                  Avg Win Rate
                </p>
              </div>
              <div className="rounded-xl border border-zinc-200/60 bg-white p-2.5 text-center shadow-sm">
                <div className="flex justify-center mb-1 text-zinc-400">
                  <TrendingUp size={11} />
                </div>
                <p className="font-display font-extrabold text-sm text-zinc-900">
                  {completedEvents}
                </p>
                <p className="text-[9px] font-semibold uppercase tracking-wider text-zinc-400">
                  Decided
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 px-4">
              {entries.map((member, i) => {
                const participationRate =
                  completedEvents > 0
                    ? Math.round(
                        (member.decided_predictions / completedEvents) * 100,
                      )
                    : 0;

                return (
                  <ClickableRow
                    key={member.id}
                    onActivate={() => navigate(`/player/${member.id}`)}
                    ariaLabel={`${member.name}, rank ${member.rank}, ${member.total_points.toFixed(1)} points`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: Math.min(i * 0.025, 0.3),
                      duration: 0.3,
                    }}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-zinc-200/60 bg-white",
                      "hover:shadow-md hover:-translate-y-0.5 shadow-sm",
                    )}
                  >
                    <div className="relative">
                      <Avatar name={member.name} id={member.id} size="lg" />
                      <div className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-white shadow-sm border border-zinc-200/60 flex items-center justify-center">
                        {member.rank === 1 ? (
                          <Trophy size={10} className="text-amber-600" />
                        ) : (
                          <span
                            className={cn(
                              "text-[9px] font-display font-extrabold",
                              member.rank <= 3
                                ? "text-amber-600"
                                : "text-zinc-400",
                            )}
                          >
                            {member.rank}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-display font-bold text-sm text-zinc-900 truncate">
                        {member.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {member.decided_predictions > 0 ? (
                          <Badge
                            variant={
                              member.win_rate >= 50 ? "accent" : "default"
                            }
                            size="sm"
                          >
                            {member.win_rate}%
                          </Badge>
                        ) : (
                          <Badge variant="default" size="sm">
                            New
                          </Badge>
                        )}
                        <span className="text-[11px] text-zinc-400">
                          {member.correct_predictions}/
                          {member.decided_predictions}
                        </span>
                        {participationRate > 0 && participationRate < 100 && (
                          <>
                            <span className="text-[11px] text-zinc-300">
                              &middot;
                            </span>
                            <span className="text-[11px] text-zinc-400">
                              {participationRate}% active
                            </span>
                          </>
                        )}
                      </div>
                      {member.form.length > 0 && (
                        <div className="mt-1">
                          <FormGuide results={member.form} max={5} compact />
                        </div>
                      )}
                    </div>

                    <div className="text-right shrink-0 min-w-0">
                      <p
                        className={cn(
                          "font-display font-extrabold text-base tabular-nums",
                          member.rank === 1 ? "text-amber-600" : "text-zinc-800",
                        )}
                      >
                        {Number(member.total_points).toFixed(1)}
                      </p>
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-zinc-400">
                        pts
                      </p>
                    </div>
                    <ChevronRight size={14} className="text-zinc-300 shrink-0" />
                  </ClickableRow>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default LeaderboardPage;
