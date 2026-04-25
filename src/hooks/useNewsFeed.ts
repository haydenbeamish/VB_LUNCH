import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getResults, getLeaderboard, getEvents, getFeed } from "../data/api";
import { generateNewsFeed, type FeedItem } from "../lib/newsfeed";
import { normalizeBackendFeedItem } from "../lib/feed/normalize";
import { enhanceBanter } from "../data/ai";
import type { LeaderboardEntry, CompetitionEvent } from "../types";

interface NewsFeedData {
  feedItems: FeedItem[];
  leaderboard: LeaderboardEntry[];
  events: CompetitionEvent[];
}

async function fetchNewsFeedData(): Promise<NewsFeedData> {
  const [results, lb, allEvents, backendFeedRaw] = await Promise.all([
    getResults(),
    getLeaderboard(),
    getEvents(),
    getFeed({ limit: 100 }).catch(() => [] as unknown[]),
  ]);

  const allPredictions = results.predictions ?? [];

  const resultsEventIds = new Set((results.events ?? []).map((e) => e.id));
  const mergedEvents = [
    ...(results.events ?? []),
    ...allEvents.filter((e) => !resultsEventIds.has(e.id)),
  ];

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

  const backendItems = backendFeedRaw
    .map((raw) => normalizeBackendFeedItem(raw))
    .filter((item): item is FeedItem =>
      item !== null &&
      !BORING_TYPES.has(item.type) &&
      !BORING_HEADLINE_PREFIXES.some((prefix) => item.headline.startsWith(prefix))
    );

  const clientItems = generateNewsFeed(
    mergedEvents,
    results.participants ?? [],
    allPredictions,
    lb
  );

  const backendKeys = new Set(backendItems.map((item) => feedItemKey(item)));
  const uniqueClientItems = clientItems.filter(
    (item) => !backendKeys.has(feedItemKey(item))
  );

  const combined = [...backendItems, ...uniqueClientItems];

  // Drop stale picks_open nudges for events that are already completed
  const completedEventIds = new Set(
    mergedEvents
      .filter((e) => e.status === "completed")
      .map((e) => Number(e.id))
  );
  const filtered = combined.filter((item) => {
    if (!item.eventId) return true;
    if (item.type !== "picks_open") return true;
    return !completedEventIds.has(Number(item.eventId));
  });

  const RESULT_TYPES = new Set(["event_result", "perfect_pick", "everyone_wrong"]);
  filtered.sort((a, b) => {
    const aIsResult = RESULT_TYPES.has(a.type) ? 1 : 0;
    const bIsResult = RESULT_TYPES.has(b.type) ? 1 : 0;
    if (aIsResult !== bIsResult) return bIsResult - aIsResult;

    if (a.timestamp && b.timestamp) {
      const cmp = b.timestamp.localeCompare(a.timestamp);
      if (cmp !== 0) return cmp;
    } else if (a.timestamp) return -1;
    else if (b.timestamp) return 1;
    return b.priority - a.priority;
  });

  const UNCAPPED_TYPES = new Set(["event_result"]);
  const MAX_PER_TYPE = 3;
  const typeCounts: Record<string, number> = {};
  const capped = filtered.filter((item) => {
    if (UNCAPPED_TYPES.has(item.type)) return true;
    const count = typeCounts[item.type] ?? 0;
    if (count >= MAX_PER_TYPE) return false;
    typeCounts[item.type] = count + 1;
    return true;
  });

  // Avoid runs of 3+ same-type cards back-to-back
  for (let i = 2; i < capped.length; i++) {
    if (capped[i].type === capped[i - 1].type && capped[i].type === capped[i - 2].type) {
      const swapIdx = capped.findIndex((item, j) => j > i && item.type !== capped[i].type);
      if (swapIdx !== -1) {
        [capped[i], capped[swapIdx]] = [capped[swapIdx], capped[i]];
      }
    }
  }

  const MAX_FEED_ITEMS = 50;

  return { feedItems: capped.slice(0, MAX_FEED_ITEMS), leaderboard: lb, events: allEvents };
}

/** Produce a dedup key for a feed item based on type + context */
function feedItemKey(item: FeedItem): string {
  if (item.eventId && item.playerId) return `${item.type}-e${item.eventId}-p${item.playerId}`;
  if (item.eventId) return `${item.type}-e${item.eventId}`;
  if (item.playerId) return `${item.type}-p${item.playerId}`;
  return item.id;
}

export function useNewsFeed() {
  const [enhancedFeed, setEnhancedFeed] = useState<FeedItem[] | null>(null);
  const [banterKey, setBanterKey] = useState<string | null>(null);

  const { data, isLoading: loading, error, refetch } = useQuery({
    queryKey: ["newsfeed"],
    queryFn: fetchNewsFeedData,
    throwOnError: false,
  });

  // Track which data we've already enhanced to avoid re-running
  const dataKey = data?.feedItems.map(f => f.id).join(",") ?? null;

  // Async AI banter enhancement (non-blocking)
  useEffect(() => {
    if (!data?.feedItems.length || dataKey === banterKey) return;

    let cancelled = false;
    const toEnhance = data.feedItems.slice(0, 25);

    enhanceBanter(toEnhance).then((enhanced) => {
      if (cancelled) return;
      if (enhanced && enhanced.length === toEnhance.length) {
        const merged = data.feedItems.map((item, idx) => {
          if (idx < enhanced.length && enhanced[idx]?.headline && enhanced[idx]?.subtext) {
            return { ...item, headline: enhanced[idx].headline, subtext: enhanced[idx].subtext };
          }
          return item;
        });
        setEnhancedFeed(merged);
        setBanterKey(dataKey);
      }
    });

    return () => { cancelled = true; };
  }, [data, dataKey, banterKey]);

  // Only surface the error to callers when there is no data at all.
  // If stale data is available, keep showing it even if a background refetch failed.
  const hasData = Boolean(data);
  const errorMessage = (!hasData && error)
    ? (error instanceof Error ? error.message : String(error))
    : null;

  if (error) {
    console.error("[useNewsFeed] query error:", error);
  }

  return {
    feed: enhancedFeed ?? data?.feedItems ?? [],
    leaderboard: data?.leaderboard ?? [],
    events: data?.events ?? [],
    loading,
    error: errorMessage,
    retry: () => { refetch(); },
  };
}
