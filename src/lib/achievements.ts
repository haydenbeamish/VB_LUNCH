import type { Prediction } from "../types";
import type { EnhancedLeaderboardEntry } from "../hooks/useLeaderboard";
import { isCorrect, isIncorrect } from "./predictions";

export type AchievementId =
  | "first_blood"
  | "hot_streak_3"
  | "hot_streak_5"
  | "ice_streak_3"
  | "ice_streak_5"
  | "sharpshooter"
  | "iron_punter"
  | "podium_finish"
  | "apex"
  | "spud_club"
  | "century"
  | "half_century"
  | "lone_genius"
  | "consistency"
  | "polyglot";

export interface Achievement {
  id: AchievementId;
  label: string;
  description: string;
  tone: "gold" | "emerald" | "sky" | "violet" | "amber" | "red";
  progress?: number;
  qualifier?: string;
}

interface ComputeInput {
  predictions: Prediction[];
  leaderboardEntry?: EnhancedLeaderboardEntry;
  /** Total leaderboard size, used to detect "spud_club" (last place). */
  leaderboardSize?: number;
  /** Total count of completed events in the season. */
  completedEvents: number;
}

/**
 * Pure function: given a player's predictions and leaderboard context,
 * return all achievements they've earned.
 */
export function computeAchievements({
  predictions,
  leaderboardEntry,
  leaderboardSize,
  completedEvents,
}: ComputeInput): Achievement[] {
  const out: Achievement[] = [];
  const decided = predictions.filter(
    (p) => p.is_correct !== null && p.is_correct !== undefined,
  );
  const wins = decided.filter((p) => isCorrect(p.is_correct));
  const losses = decided.filter((p) => isIncorrect(p.is_correct));

  if (wins.length >= 1) {
    out.push({
      id: "first_blood",
      label: "First Blood",
      description: "Landed your first correct pick.",
      tone: "emerald",
    });
  }

  // Walk decided picks most-recent-first to find current and best streaks.
  const orderedByRecent = [...decided].sort(
    (a, b) => (b.event_id ?? 0) - (a.event_id ?? 0),
  );
  let currentWinRun = 0;
  let currentLoseRun = 0;
  let bestWinRun = 0;
  let bestLoseRun = 0;
  for (const p of orderedByRecent) {
    if (isCorrect(p.is_correct)) {
      currentWinRun++;
      bestWinRun = Math.max(bestWinRun, currentWinRun);
      currentLoseRun = 0;
    } else if (isIncorrect(p.is_correct)) {
      currentLoseRun++;
      bestLoseRun = Math.max(bestLoseRun, currentLoseRun);
      currentWinRun = 0;
    }
  }

  if (bestWinRun >= 3) {
    out.push({
      id: "hot_streak_3",
      label: "Hot Streak",
      description: "Three correct picks in a row.",
      tone: "emerald",
      qualifier: `${bestWinRun} in a row`,
    });
  }
  if (bestWinRun >= 5) {
    out.push({
      id: "hot_streak_5",
      label: "On Fire",
      description: "Five correct picks in a row.",
      tone: "amber",
      qualifier: `${bestWinRun} in a row`,
    });
  }
  if (bestLoseRun >= 3) {
    out.push({
      id: "ice_streak_3",
      label: "Cold Snap",
      description: "Three losses in a row. Rough.",
      tone: "sky",
      qualifier: `${bestLoseRun} in a row`,
    });
  }
  if (bestLoseRun >= 5) {
    out.push({
      id: "ice_streak_5",
      label: "Frostbite",
      description: "Five losses in a row. It happens.",
      tone: "red",
      qualifier: `${bestLoseRun} in a row`,
    });
  }

  if (decided.length >= 5) {
    const pct = Math.round((wins.length / decided.length) * 100);
    if (pct >= 75) {
      out.push({
        id: "sharpshooter",
        label: "Sharpshooter",
        description: "75%+ win rate with 5+ decided picks.",
        tone: "gold",
        qualifier: `${pct}%`,
      });
    }
  }

  if (completedEvents >= 5 && decided.length >= completedEvents) {
    out.push({
      id: "iron_punter",
      label: "Iron Punter",
      description: "Had a pick for every decided event.",
      tone: "violet",
    });
  }

  if (leaderboardEntry) {
    if (leaderboardEntry.rank === 1) {
      out.push({
        id: "apex",
        label: "Apex",
        description: "Sitting first on the leaderboard.",
        tone: "gold",
      });
    } else if (leaderboardEntry.rank <= 3) {
      out.push({
        id: "podium_finish",
        label: "Podium",
        description: "Top three on the leaderboard.",
        tone: "amber",
        qualifier: `#${leaderboardEntry.rank}`,
      });
    }
    if (
      leaderboardSize &&
      leaderboardSize >= 4 &&
      leaderboardEntry.rank === leaderboardSize
    ) {
      out.push({
        id: "spud_club",
        label: "Spud Club",
        description: "Currently last on the leaderboard.",
        tone: "red",
      });
    }
  }

  const points = leaderboardEntry?.total_points ?? 0;
  if (points >= 100) {
    out.push({
      id: "century",
      label: "Century",
      description: "Broke 100 points.",
      tone: "emerald",
      qualifier: `${points.toFixed(0)} pts`,
    });
  } else if (points >= 50) {
    out.push({
      id: "half_century",
      label: "Half Century",
      description: "Broke 50 points.",
      tone: "sky",
      qualifier: `${points.toFixed(0)} pts`,
    });
  }

  const sportWins = new Set<string>();
  for (const p of wins) {
    if (p.sport) sportWins.add(p.sport);
  }
  if (sportWins.size >= 3) {
    out.push({
      id: "polyglot",
      label: "Polyglot",
      description: "Won picks across 3+ different sports.",
      tone: "violet",
      qualifier: `${sportWins.size} sports`,
    });
  }

  if (decided.length >= 5 && wins.length > losses.length && bestLoseRun < 3) {
    out.push({
      id: "consistency",
      label: "Consistent",
      description: "Above water and no 3-loss streak.",
      tone: "emerald",
    });
  }

  return out;
}

/**
 * Cross-player pass — adds achievements that depend on what other players did,
 * e.g. "lone_genius" (only correct pick on an event with 3+ entries).
 */
export function annotateCrossPlayerAchievements(
  achievements: Achievement[],
  predictions: Prediction[],
  allPredictions: Prediction[],
): Achievement[] {
  const out = [...achievements];
  const playerWins = predictions.filter((p) => isCorrect(p.is_correct));

  for (const win of playerWins) {
    const eventPreds = allPredictions.filter(
      (p) =>
        Number(p.event_id) === Number(win.event_id) &&
        (p.is_correct === true || p.is_correct === false),
    );
    const correctOnEvent = eventPreds.filter((p) => isCorrect(p.is_correct));
    if (correctOnEvent.length === 1 && eventPreds.length >= 3) {
      out.push({
        id: "lone_genius",
        label: "Lone Genius",
        description: "The only one to nail a pick everyone else missed.",
        tone: "violet",
      });
      break;
    }
  }

  return out;
}

export const TONE_CLASSES: Record<
  Achievement["tone"],
  { bg: string; text: string; border: string }
> = {
  gold: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200/60" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200/60" },
  sky: { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200/60" },
  violet: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200/60" },
  amber: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200/60" },
  red: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200/60" },
};
