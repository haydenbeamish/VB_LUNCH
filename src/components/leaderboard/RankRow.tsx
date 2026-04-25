import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Avatar } from "../ui/Avatar";
import { FormGuide } from "../ui/FormGuide";
import { cn } from "../../lib/cn";
import type { EnhancedLeaderboardEntry } from "../../hooks/useLeaderboard";

interface RankRowProps {
  entry: EnhancedLeaderboardEntry;
  isSpud: boolean;
  index: number;
}

export function RankRow({ entry, isSpud, index }: RankRowProps) {
  const navigate = useNavigate();
  const winRate = entry.win_rate;

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 + index * 0.04, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      onClick={() => navigate(`/player/${entry.id}`)}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-200",
        "border border-zinc-200/60 bg-white shadow-sm",
        "active:scale-[0.98] hover:shadow-md hover:-translate-y-0.5",
        isSpud && "border-red-200/50 bg-red-50/50"
      )}
    >
      {/* Rank */}
      <div className="w-7 flex items-center justify-center shrink-0">
        <span className={cn(
          "font-display font-extrabold text-sm",
          entry.rank <= 3 ? "text-amber-600" : isSpud ? "text-red-500" : "text-zinc-400"
        )}>
          {entry.rank}
        </span>
      </div>

      {/* Avatar */}
      <Avatar name={entry.name} id={entry.id} size="md" />

      {/* Name + win rate */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-sm text-zinc-900 truncate">
            {entry.name}
          </span>
          {isSpud && (
            <span className="text-[10px]" role="img" aria-label="last place">{"\u{1F954}"}</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] text-zinc-400">
            {entry.correct_predictions}/{entry.decided_predictions} correct
          </span>
          <span className="text-[11px] text-zinc-300">&middot;</span>
          <span className={cn("text-[11px] font-semibold", winRate >= 50 ? "text-emerald-600" : "text-zinc-400")}>
            {winRate}%
          </span>
        </div>
        {entry.form.length > 0 && (
          <div className="mt-1">
            <FormGuide results={entry.form} max={5} compact />
          </div>
        )}
      </div>

      {/* Points + Penalty */}
      <div className="text-right shrink-0 mr-1">
        <span className={cn(
          "font-display font-extrabold text-base tabular-nums",
          entry.rank === 1 ? "text-amber-600" : isSpud ? "text-red-500" : "text-zinc-800"
        )}>
          {entry.total_points.toFixed(1)}
        </span>
        <p className="text-[9px] font-semibold uppercase tracking-wider text-zinc-400">pts</p>
        {entry.penalty > 0 && (
          <p className={cn(
            "text-[10px] font-semibold tabular-nums mt-0.5",
            isSpud ? "text-red-400" : "text-zinc-400"
          )}>
            -${entry.penalty}
          </p>
        )}
      </div>

      <ChevronRight size={14} className="text-zinc-300 shrink-0" />
    </motion.div>
  );
}
