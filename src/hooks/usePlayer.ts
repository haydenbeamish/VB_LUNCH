import { useQuery } from "@tanstack/react-query";
import type { Participant, Prediction } from "../types";
import { getParticipant } from "../data/api";

interface PlayerData {
  participant: Participant;
  predictions: Prediction[];
  total_points: number;
}

export function usePlayer(id: number) {
  const { data = null, isLoading: loading, error, refetch } = useQuery<PlayerData>({
    queryKey: ["player", id],
    queryFn: () => getParticipant(id),
  });

  return {
    data,
    loading,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
    retry: () => { refetch(); },
  };
}
