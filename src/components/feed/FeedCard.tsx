import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Trophy,
  Target,
  XCircle,
  TrendingUp,
  TrendingDown,
  Eye,
  Swords,
  Lightbulb,
  Coins,
  Users,
  Crown,
  Banknote,
  ClipboardList,
  MessageSquare,
  ArrowUpCircle,
  Skull,
  Percent,
  CreditCard,
  Bell,
} from "lucide-react";
import { cn } from "../../lib/cn";
import type { FeedItem } from "../../lib/newsfeed";

const TYPE_CONFIG: Record<
  string,
  { icon: React.ElementType; accent: string; stripe: string }
> = {
  event_result: {
    icon: Trophy,
    accent: "text-emerald-600",
    stripe: "bg-emerald-500",
  },
  perfect_pick: {
    icon: Target,
    accent: "text-amber-600",
    stripe: "bg-amber-500",
  },
  everyone_wrong: {
    icon: XCircle,
    accent: "text-red-500",
    stripe: "bg-red-500",
  },
  winning_streak: {
    icon: TrendingUp,
    accent: "text-emerald-600",
    stripe: "bg-emerald-500",
  },
  losing_streak: {
    icon: TrendingDown,
    accent: "text-zinc-500",
    stripe: "bg-zinc-400",
  },
  outlier_alert: {
    icon: Eye,
    accent: "text-violet-600",
    stripe: "bg-violet-500",
  },
  close_race: {
    icon: Swords,
    accent: "text-amber-600",
    stripe: "bg-amber-500",
  },
  hot_take: {
    icon: Lightbulb,
    accent: "text-sky-600",
    stripe: "bg-sky-500",
  },
  winners_list: {
    icon: Coins,
    accent: "text-yellow-600",
    stripe: "bg-yellow-400",
  },
  group_consensus: {
    icon: Users,
    accent: "text-indigo-600",
    stripe: "bg-indigo-500",
  },
  leader_banter: {
    icon: Crown,
    accent: "text-yellow-600",
    stripe: "bg-yellow-500",
  },
  last_place_banter: {
    icon: Banknote,
    accent: "text-red-600",
    stripe: "bg-red-500",
  },
  pick_summary: {
    icon: ClipboardList,
    accent: "text-sky-600",
    stripe: "bg-sky-500",
  },
  result_commentary: {
    icon: MessageSquare,
    accent: "text-emerald-600",
    stripe: "bg-emerald-500",
  },
  new_leader: {
    icon: ArrowUpCircle,
    accent: "text-amber-600",
    stripe: "bg-amber-500",
  },
  new_spud: {
    icon: Skull,
    accent: "text-red-600",
    stripe: "bg-red-500",
  },
  accuracy_check: {
    icon: Percent,
    accent: "text-cyan-600",
    stripe: "bg-cyan-500",
  },
  lunch_liability: {
    icon: CreditCard,
    accent: "text-rose-600",
    stripe: "bg-rose-500",
  },
  picks_open: {
    icon: Bell,
    accent: "text-amber-600",
    stripe: "bg-amber-500",
  },
};

const DEFAULT_CONFIG = TYPE_CONFIG.event_result;

/** Human-readable labels for feed item types */
const TYPE_LABELS: Record<string, string> = {
  event_result: "Event Result",
  perfect_pick: "Perfect Pick",
  everyone_wrong: "Everyone Wrong",
  winning_streak: "Winning Streak",
  losing_streak: "Losing Streak",
  outlier_alert: "Outlier Alert",
  close_race: "Close Race",
  hot_take: "Hot Take",
  winners_list: "Winners & Losers",
  group_consensus: "Group Consensus",
  leader_banter: "Leaderboard",
  last_place_banter: "Last Place",
  pick_summary: "Pick Summary",
  result_commentary: "Commentary",
  new_leader: "New Leader",
  new_spud: "New Spud",
  accuracy_check: "Accuracy",
  lunch_liability: "Lunch Liability",
  picks_open: "Picks Open",
};

interface FeedCardProps {
  item: FeedItem;
  index: number;
}

export function FeedCard({ item, index }: FeedCardProps) {
  const navigate = useNavigate();
  const config = TYPE_CONFIG[item.type] ?? DEFAULT_CONFIG;
  const Icon = config.icon;

  const handleClick = () => {
    if (item.eventId) {
      navigate(`/events/${item.eventId}`);
    } else if (item.playerId) {
      navigate(`/player/${item.playerId}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label={item.headline}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-zinc-200/60 bg-white shadow-sm",
        "cursor-pointer transition-all duration-200",
        "hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]",
        "pl-0 pr-4 py-3.5"
      )}
    >
      {/* Left accent stripe */}
      <div
        className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl", config.stripe)}
      />

      <div className="flex items-start gap-3 pl-4">
        <div
          className={cn(
            "mt-0.5 shrink-0 flex items-center justify-center w-8 h-8 rounded-xl bg-zinc-50",
            config.accent
          )}
        >
          <Icon size={16} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-0.5">
            {TYPE_LABELS[item.type] ?? item.type.replace(/_/g, " ")}
          </p>
          <p className="font-display font-bold text-sm leading-snug text-zinc-800">
            {item.headline}
          </p>
          {item.subtext && (
            <p className="text-[13px] text-zinc-500 mt-0.5 leading-relaxed">
              {item.subtext}
            </p>
          )}
          {item.picks && item.picks.total > 0 && (
            <PicksDisplay picks={item.picks} />
          )}
          {item.sport && (
            <span className="inline-block mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 bg-zinc-100 rounded-full px-2 py-0.5">
              {item.sport}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function PicksDisplay({ picks }: { picks: NonNullable<FeedItem["picks"]> }) {
  return (
    <div className="mt-2 space-y-1.5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
        Picks ({picks.total})
      </p>
      {picks.options.map((opt) => {
        const pct = Math.round((opt.count / picks.total) * 100);
        return (
          <div key={opt.label}>
            <div className="flex items-center justify-between mb-0.5">
              <span
                className={cn(
                  "text-[12px] font-semibold truncate",
                  opt.isCorrect ? "text-emerald-700" : "text-zinc-700"
                )}
              >
                {opt.label}
                {opt.isCorrect && (
                  <span className="ml-1 text-[10px] text-emerald-500 font-normal">
                    (correct)
                  </span>
                )}
              </span>
              <span className="text-[11px] font-bold tabular-nums text-zinc-500">
                {pct}%
              </span>
            </div>
            <div className="flex h-1.5 rounded-full overflow-hidden bg-zinc-100 mb-0.5">
              <div
                className={cn(
                  "rounded-full transition-all",
                  opt.isCorrect ? "bg-emerald-500" : "bg-blue-500"
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-[11px] text-zinc-400 leading-tight truncate">
              {opt.names.join(", ")}
            </p>
          </div>
        );
      })}
    </div>
  );
}

