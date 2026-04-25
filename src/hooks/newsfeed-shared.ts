import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { getResults, getLeaderboard, getEvents, getFeed } from "../data/api";
import { generateNewsFeed, type FeedItem } from "../lib/newsfeed";
import { normalizeBackendFeedItem } from "../lib/feed/normalize";
import { enhanceBanter } from "../data/ai";
import type { CompetitionEvent, LeaderboardEntry } from "../types";

/** Backend types we never surface in the manual-entry app. */
const BORING_TYPES = new Set([
  "pick_summary",
  "group_consensus",
  "pre_event_odds",
  "odds_vs_picks",
  "odds_alert",
  "contrarian_pick",
  "underdog_backer",
  "upset_alert",
]);

const BORING_HEADLINE_PREFIXES = ["Date Check", "Odds vs picks:"];

const RESULT_TYPES = new Set([
  "event_result",
  "perfect_pick",
  "everyone_wrong",
]);

const UNCAPPED_TYPES = new Set(["event_result"]);

function feedItemKey(item: FeedItem): string {
  if (item.eventId && item.playerId)
    return `${item.type}-e${item.eventId}-p${item.playerId}`;
  if (item.eventId) return `${item.type}-e${item.eventId}`;
  if (item.playerId) return `${item.type}-p${item.playerId}`;
  return item.id;
}

function mergeBanterIntoFeed(
  feedItems: FeedItem[],
  toEnhance: FeedItem[],
  enhanced: Array<{ headline: string; subtext: string }>,
): FeedItem[] {
  const enhanceIds = new Set(toEnhance.map((f) => f.id));
  let enhIdx = 0;
  return feedItems.map((item) => {
    if (!enhanceIds.has(item.id)) return item;
    if (enhIdx >= enhanced.length) return item;
    const enh = enhanced[enhIdx];
    enhIdx++;
    if (enh?.headline && enh?.subtext) {
      return { ...item, headline: enh.headline, subtext: enh.subtext };
    }
    return item;
  });
}

interface BuildFeedOptions {
  maxItems: number;
  /** When true, pin result types to the top; when false, sort strictly chronologically. */
  resultsFirst: boolean;
  /** When true, reshuffles to avoid 3 cards of the same type in a row. */
  interleave: boolean;
}

interface FeedBuildResult {
  feedItems: FeedItem[];
  leaderboard: LeaderboardEntry[];
  events: CompetitionEvent[];
}

async function fetchAndBuildFeed(
  options: BuildFeedOptions,
  queryClient: QueryClient,
): Promise<FeedBuildResult> {
  const [results, lb, allEvents, backendFeedRaw] = await Promise.all([
    queryClient.fetchQuery({ queryKey: ["results"], queryFn: getResults }),
    queryClient.fetchQuery({ queryKey: ["leaderboard"], queryFn: getLeaderboard }),
    queryClient.fetchQuery({ queryKey: ["events"], queryFn: () => getEvents() }),
    getFeed({ limit: 100 }).catch(() => [] as unknown[]),
  ]);

  const allPredictions = results.predictions ?? [];

  const resultsEventIds = new Set((results.events ?? []).map((e) => e.id));
  const mergedEvents = [
    ...(results.events ?? []),
    ...allEvents.filter((e) => !resultsEventIds.has(e.id)),
  ];

  const backendItems = backendFeedRaw
    .map((raw) => normalizeBackendFeedItem(raw))
    .filter(
      (item): item is FeedItem =>
        item !== null &&
        !BORING_TYPES.has(item.type) &&
        !BORING_HEADLINE_PREFIXES.some((p) => item.headline.startsWith(p)),
    );

  const clientItems = generateNewsFeed(
    mergedEvents,
    results.participants ?? [],
    allPredictions,
    lb,
  );

  const backendKeys = new Set(backendItems.map((i) => feedItemKey(i)));
  const uniqueClientItems = clientItems.filter(
    (i) => !backendKeys.has(feedItemKey(i)),
  );

  const combined = [...backendItems, ...uniqueClientItems];

  // Drop stale picks_open nudges for events that are already completed
  const completedEventIds = new Set(
    mergedEvents.filter((e) => e.status === "completed").map((e) => Number(e.id)),
  );
  const filtered = combined.filter((item) => {
    if (!item.eventId) return true;
    if (item.type !== "picks_open") return true;
    return !completedEventIds.has(Number(item.eventId));
  });

  filtered.sort((a, b) => {
    if (options.resultsFirst) {
      const aIsResult = RESULT_TYPES.has(a.type) ? 1 : 0;
      const bIsResult = RESULT_TYPES.has(b.type) ? 1 : 0;
      if (aIsResult !== bIsResult) return bIsResult - aIsResult;
    }
    if (a.timestamp && b.timestamp) {
      const cmp = b.timestamp.localeCompare(a.timestamp);
      if (cmp !== 0) return cmp;
    } else if (a.timestamp) return -1;
    else if (b.timestamp) return 1;
    return b.priority - a.priority;
  });

  const MAX_PER_TYPE = 3;
  const typeCounts: Record<string, number> = {};
  const capped = filtered.filter((item) => {
    if (UNCAPPED_TYPES.has(item.type)) return true;
    const count = typeCounts[item.type] ?? 0;
    if (count >= MAX_PER_TYPE) return false;
    typeCounts[item.type] = count + 1;
    return true;
  });

  if (options.interleave) {
    for (let i = 2; i < capped.length; i++) {
      if (
        capped[i].type === capped[i - 1].type &&
        capped[i].type === capped[i - 2].type
      ) {
        const swapIdx = capped.findIndex(
          (item, j) => j > i && item.type !== capped[i].type,
        );
        if (swapIdx !== -1) {
          [capped[i], capped[swapIdx]] = [capped[swapIdx], capped[i]];
        }
      }
    }
  }

  return {
    feedItems: capped.slice(0, options.maxItems),
    leaderboard: lb,
    events: allEvents,
  };
}

export function buildNewsFeedHook(
  queryKey: string,
  options: BuildFeedOptions,
) {
  return function useFeedHook() {
    const queryClient = useQueryClient();
    const [enhancedFeed, setEnhancedFeed] = useState<{
      key: string;
      items: FeedItem[];
    } | null>(null);
    const enhancingKey = useRef<string | null>(null);

    const { data, isLoading: loading, error, refetch } = useQuery({
      queryKey: [queryKey],
      queryFn: () => fetchAndBuildFeed(options, queryClient),
    });

    const dataKey = useMemo(
      () => data?.feedItems.map((f) => f.id).join(",") ?? null,
      [data?.feedItems],
    );

    useEffect(() => {
      if (
        !data?.feedItems.length ||
        !dataKey ||
        enhancedFeed?.key === dataKey ||
        enhancingKey.current === dataKey
      ) {
        return;
      }

      enhancingKey.current = dataKey;
      let cancelled = false;
      const toEnhance = data.feedItems.slice(0, 25);

      enhanceBanter(toEnhance).then((enhanced) => {
        if (cancelled) return;
        if (enhanced && enhanced.length === toEnhance.length) {
          setEnhancedFeed({
            key: dataKey,
            items: mergeBanterIntoFeed(data.feedItems, toEnhance, enhanced),
          });
        }
      });

      return () => {
        cancelled = true;
      };
    }, [data, dataKey, enhancedFeed?.key]);

    const feed =
      enhancedFeed && enhancedFeed.key === dataKey
        ? enhancedFeed.items
        : data?.feedItems ?? [];
    const errorMessage =
      !data && error
        ? error instanceof Error
          ? error.message
          : String(error)
        : null;

    return {
      feed,
      leaderboard: data?.leaderboard ?? [],
      events: data?.events ?? [],
      loading,
      error: errorMessage,
      retry: () => {
        refetch();
      },
    };
  };
}
