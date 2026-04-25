import { useQuery } from "@tanstack/react-query";
import { getResults } from "../data/api";

/** Shared results query — keyed so all consumers dedupe through TanStack Query. */
export function useResults() {
  return useQuery({
    queryKey: ["results"],
    queryFn: getResults,
  });
}
