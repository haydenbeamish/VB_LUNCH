import { useQuery } from "@tanstack/react-query";
import { searchEventNews } from "../data/ai";

interface NewsItem {
  title: string;
  url: string;
  description: string;
  age?: string;
}

export function useEventNews(eventName: string | undefined, sport: string | undefined) {
  const year = new Date().getFullYear();
  const query = eventName ? `${eventName}${sport ? ` ${sport}` : ""} results ${year}` : "";

  const { data: news = [], isLoading: loading, isError: error } = useQuery<NewsItem[]>({
    queryKey: ["eventNews", query],
    queryFn: () => searchEventNews(query),
    enabled: Boolean(eventName),
  });

  return { news, loading, error };
}
