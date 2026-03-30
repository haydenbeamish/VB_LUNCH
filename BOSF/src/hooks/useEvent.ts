import { useQuery } from "@tanstack/react-query";
import { getEvent } from "../data/api";

export function useEvent(id: number) {
  const { data: event = null, isLoading: loading, error, refetch } = useQuery({
    queryKey: ["event", id],
    queryFn: () => getEvent(id),
  });

  return {
    event,
    loading,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
    retry: () => { refetch(); },
  };
}
