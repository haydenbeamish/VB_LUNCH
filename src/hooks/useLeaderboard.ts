import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { LeaderboardEntry, Prediction } from "../types";
import { getLeaderboard } from "../data/api";
import { isCorrect, isIncorrect } from "../lib/predictions";
import { LUNCH_CONTRIBUTIONS } from "../lib/feed/index";
import { useResults } from "./useResults";

export type FormResult = "W" | "L";

export interface EnhancedLeaderboardEntry extends LeaderboardEntry {
  decided_predictions: number;
  win_rate: number;
  penalty: number;
  form: FormResult[];
}

function enhanceLeaderboard(
  leaderboard: LeaderboardEntry[],
  allPredictions: Prediction[],
): EnhancedLeaderboardEntry[] {
  const decidedByPlayer: Record<number, { correct: number; decided: number }> = {};
  const decidedPredsByPlayer: Record<number, { event_id: number; won: boolean }[]> = {};

  for (const pred of allPredictions) {
    const won = isCorrect(pred.is_correct);
    const lost = isIncorrect(pred.is_correct);
    if (!won && !lost) continue;
    if (!decidedByPlayer[pred.participant_id]) {
      decidedByPlayer[pred.participant_id] = { correct: 0, decided: 0 };
    }
    decidedByPlayer[pred.participant_id].decided++;
    if (won) decidedByPlayer[pred.participant_id].correct++;
    if (!decidedPredsByPlayer[pred.participant_id]) {
      decidedPredsByPlayer[pred.participant_id] = [];
    }
    decidedPredsByPlayer[pred.participant_id].push({
      event_id: pred.event_id,
      won,
    });
  }

  for (const preds of Object.values(decidedPredsByPlayer)) {
    preds.sort((a, b) => b.event_id - a.event_id);
  }

  const enhanced = leaderboard.map((entry) => {
    const stats = decidedByPlayer[entry.id];
    const decided = stats?.decided ?? 0;
    const correct = stats?.correct ?? entry.correct_predictions;
    const playerPreds = decidedPredsByPlayer[entry.id] ?? [];
    const form: FormResult[] = playerPreds.slice(0, 5).map((p) => (p.won ? "W" : "L"));
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
    entry.penalty =
      lunchEntry?.contribution ??
      LUNCH_CONTRIBUTIONS[LUNCH_CONTRIBUTIONS.length - 1].contribution;
  });

  return enhanced;
}

export function useLeaderboard() {
  const lbQuery = useQuery({
    queryKey: ["leaderboard"],
    queryFn: getLeaderboard,
  });
  const resultsQuery = useResults();

  const entries = useMemo(() => {
    if (!lbQuery.data) return [] as EnhancedLeaderboardEntry[];
    return enhanceLeaderboard(lbQuery.data, resultsQuery.data?.predictions ?? []);
  }, [lbQuery.data, resultsQuery.data]);

  const spud = useMemo(() => {
    if (entries.length < 2) return null;
    const last = entries[entries.length - 1];
    const secondLast = entries[entries.length - 2];
    return last.total_points < secondLast.total_points ? last : null;
  }, [entries]);

  const loading = lbQuery.isLoading || resultsQuery.isLoading;
  const error = lbQuery.error || resultsQuery.error;

  return {
    entries,
    spud,
    loading,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
    retry: () => {
      lbQuery.refetch();
      resultsQuery.refetch();
    },
  };
}
