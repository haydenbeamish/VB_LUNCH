import { useQuery } from "@tanstack/react-query";
import type { LeaderboardEntry } from "../types";
import { getLeaderboard, getResults } from "../data/api";
import { LUNCH_CONTRIBUTIONS } from "../lib/feed/index";

export type FormResult = "W" | "L";

export interface EnhancedLeaderboardEntry extends LeaderboardEntry {
  decided_predictions: number;
  win_rate: number;
  penalty: number;
  form: FormResult[];
}

async function fetchLeaderboardData(): Promise<EnhancedLeaderboardEntry[]> {
  const [leaderboard, results] = await Promise.all([getLeaderboard(), getResults()]);
  const allPredictions = results.predictions ?? [];

  const decidedByPlayer: Record<number, { correct: number; decided: number }> = {};
  const decidedPredsByPlayer: Record<number, { event_id: number; is_correct: boolean }[]> = {};

  for (const pred of allPredictions) {
    if (pred.is_correct !== null && pred.is_correct !== undefined) {
      if (!decidedByPlayer[pred.participant_id]) {
        decidedByPlayer[pred.participant_id] = { correct: 0, decided: 0 };
      }
      decidedByPlayer[pred.participant_id].decided++;
      if (pred.is_correct === true) {
        decidedByPlayer[pred.participant_id].correct++;
      }
      if (!decidedPredsByPlayer[pred.participant_id]) {
        decidedPredsByPlayer[pred.participant_id] = [];
      }
      decidedPredsByPlayer[pred.participant_id].push({
        event_id: pred.event_id,
        is_correct: pred.is_correct === true,
      });
    }
  }

  for (const preds of Object.values(decidedPredsByPlayer)) {
    preds.sort((a, b) => b.event_id - a.event_id);
  }

  const enhanced = leaderboard.map((entry) => {
    const stats = decidedByPlayer[entry.id];
    const decided = stats?.decided ?? 0;
    const correct = stats?.correct ?? entry.correct_predictions;
    const playerPreds = decidedPredsByPlayer[entry.id] ?? [];
    const form: FormResult[] = playerPreds.slice(0, 5).map((p) => (p.is_correct ? "W" : "L"));
    return {
      ...entry,
      decided_predictions: decided,
      win_rate: decided > 0 ? Math.round((correct / decided) * 100) : 0,
      penalty: 0,
      form,
    };
  });

  enhanced.sort((a, b) => b.total_points - a.total_points);
  enhanced.forEach((entry, index) => {
    entry.rank = index + 1;
    const lunchEntry = LUNCH_CONTRIBUTIONS.find((lc) => lc.position === index + 1);
    entry.penalty = lunchEntry?.contribution ?? LUNCH_CONTRIBUTIONS[LUNCH_CONTRIBUTIONS.length - 1].contribution;
  });

  return enhanced;
}

export function useLeaderboard() {
  const { data: entries = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: fetchLeaderboardData,
  });

  const spud = (() => {
    if (entries.length < 2) return null;
    const last = entries[entries.length - 1];
    const secondLast = entries[entries.length - 2];
    if (last.total_points < secondLast.total_points) return last;
    return null;
  })();

  return {
    entries,
    spud,
    loading,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
    retry: () => { refetch(); },
  };
}
