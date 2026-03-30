import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getResults, getLeaderboard, getEvents, getFeed } from "../data/api";
import { generateNewsFeed, type FeedItem } from "../lib/newsfeed";
import { normalizeBackendFeedItem } from "../lib/feed/normalize";
import { enhanceBanter } from "../data/ai";
import type { LeaderboardEntry, CompetitionEvent, Prediction, Participant } from "../types";

interface NewsFeedData {
  feedItems: FeedItem[];
  leaderboard: LeaderboardEntry[];
  events: CompetitionEvent[];
}

/**
 * Enrich a backend feed item with structured odds & picks data
 * when the item references an event that has odds and predictions.
 */
function enrichFeedItemWithOddsAndPicks(
  item: FeedItem,
  events: CompetitionEvent[],
  predictions: Prediction[],
  participants: Participant[]
): FeedItem {
  // Only enrich odds-related types that are missing structured data
  const ODDS_TYPES = new Set(["odds_alert", "contrarian_pick", "underdog_backer", "pre_event_odds", "picks_open"]);
  if (!ODDS_TYPES.has(item.type)) return item;
  if (!item.eventId) return item;

  const event = events.find((e) => Number(e.id) === Number(item.eventId));
  if (!event || !event.favourite || !event.favourite_odds) return item;

  const enriched = { ...item };

  // Add odds if missing
  if (!enriched.odds) {
    enriched.odds = {
      favourite: event.favourite,
      favouriteOdds: event.favourite_odds,
      underdog: event.underdog ?? undefined,
      underdogOdds: event.underdog_odds ?? undefined,
    };
  }

  // Add picks if missing
  if (!enriched.picks) {
    const eventPreds = predictions.filter(
      (p) => Number(p.event_id) === Number(event.id)
    );
    if (eventPreds.length > 0) {
      const participantMap = new Map(
        participants.map((p) => [Number(p.id), p.name])
      );
      const groups: Record<string, { label: string; names: string[] }> = {};
      for (const pred of eventPreds) {
        const key = pred.prediction.toLowerCase().trim();
        if (!groups[key]) {
          groups[key] = { label: pred.prediction.trim(), names: [] };
        }
        const name =
          participantMap.get(Number(pred.participant_id)) ??
          pred.participant_name ??
          "Unknown";
        groups[key].names.push(name);
      }
      const favouriteKey = event.favourite.toLowerCase().trim();
      const options = Object.entries(groups)
        .map(([key, { label, names }]) => ({
          label,
          count: names.length,
          names,
          isFavourite: key === favouriteKey,
        }))
        .sort((a, b) => b.count - a.count);

      enriched.picks = { options, total: eventPreds.length };
    }
  }

  return enriched;
}

async function fetchNewsFeedData(): Promise<NewsFeedData> {
  const [results, lb, allEvents, backendFeedRaw] = await Promise.all([
    getResults(),
    getLeaderboard(),
    getEvents(),
    getFeed({ limit: 100 }).catch(() => [] as unknown[]),
  ]);

  const allPredictions = results.predictions ?? [];

  // Merge results events with all events (deduped by id) so upcoming events
  // that carry odds data are included in odds-based feed items.
  const resultsEventIds = new Set((results.events ?? []).map((e) => e.id));
  const mergedEvents = [
    ...(results.events ?? []),
    ...allEvents.filter((e) => !resultsEventIds.has(e.id)),
  ];

  // Normalise backend feed items into our FeedItem shape, filtering out
  // boring types that clog the feed (plain pick summaries, consensus)
  const BORING_TYPES = new Set([
    "pick_summary",
    "group_consensus",
    "pre_event_odds",
    "odds_vs_picks",
  ]);

  // Headlines that indicate admin/validation items or generic placeholders, not real news
  const BORING_HEADLINE_PREFIXES = ["Date Check", "Odds vs picks:"];

  const backendItems = backendFeedRaw
    .map((raw) => normalizeBackendFeedItem(raw))
    .filter((item): item is FeedItem =>
      item !== null &&
      !BORING_TYPES.has(item.type) &&
      !BORING_HEADLINE_PREFIXES.some((prefix) => item.headline.startsWith(prefix))
    )
    .map((item) =>
      enrichFeedItemWithOddsAndPicks(item, mergedEvents, allPredictions, results.participants ?? [])
    );

  // Generate client-side feed items as supplement
  const clientItems = generateNewsFeed(
    mergedEvents,
    results.participants ?? [],
    allPredictions,
    lb
  );

  // Merge: backend items take priority, deduplicate by matching type+eventId or type+playerId
  const backendKeys = new Set(
    backendItems.map((item) => feedItemKey(item))
  );

  const uniqueClientItems = clientItems.filter(
    (item) => !backendKeys.has(feedItemKey(item))
  );

  const combined = [...backendItems, ...uniqueClientItems];

  // Remove odds/contrarian/underdog items for events that are already completed
  // — these are stale pre-event analysis cards that no longer matter
  const completedEventIds = new Set(
    mergedEvents
      .filter((e) => e.status === "completed")
      .map((e) => Number(e.id))
  );
  const STALE_WHEN_COMPLETED = new Set([
    "odds_alert",
    "contrarian_pick",
    "underdog_backer",
    "picks_open",
  ]);
  const filtered = combined.filter((item) => {
    if (!item.eventId) return true;
    if (!STALE_WHEN_COMPLETED.has(item.type)) return true;
    return !completedEventIds.has(Number(item.eventId));
  });

  // Sort: event results first (they're the most interesting), then by
  // timestamp (newest first), then priority as tiebreaker
  const RESULT_TYPES = new Set(["event_result", "perfect_pick", "everyone_wrong", "upset_alert"]);
  filtered.sort((a, b) => {
    // Boost result-related items above everything else
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

  // Cap per type — prevent any single category from dominating the feed
  // Result types are uncapped so every completed event shows its result
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

  // Interleave: avoid runs of 3+ cards of the same type back-to-back.
  // Walk the sorted list; when we see a third consecutive same-type item,
  // swap it with the next different-type item found later in the list.
  for (let i = 2; i < capped.length; i++) {
    if (capped[i].type === capped[i - 1].type && capped[i].type === capped[i - 2].type) {
      const swapIdx = capped.findIndex((item, j) => j > i && item.type !== capped[i].type);
      if (swapIdx !== -1) {
        [capped[i], capped[swapIdx]] = [capped[swapIdx], capped[i]];
      }
    }
  }

  // Cap the feed — show plenty of items but not infinite
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
  });

  // Track which data we've already enhanced to avoid re-running
  const dataKey = data?.feedItems.map(f => f.id).join(",") ?? null;

  // Async AI banter enhancement (non-blocking)
  useEffect(() => {
    if (!data?.feedItems.length || dataKey === banterKey) return;

    let cancelled = false;
    // Skip odds_alert from AI enhancement — they render structured odds data, not text
    const toEnhance = data.feedItems.filter((f) => f.type !== "odds_alert").slice(0, 25);

    enhanceBanter(toEnhance).then((enhanced) => {
      if (cancelled) return;
      if (enhanced && enhanced.length === toEnhance.length) {
        let enhIdx = 0;
        const merged = data.feedItems.map((item) => {
          if (item.type === "odds_alert") return item;
          if (enhIdx < enhanced.length && enhanced[enhIdx]?.headline && enhanced[enhIdx]?.subtext) {
            return { ...item, headline: enhanced[enhIdx].headline, subtext: enhanced[enhIdx++].subtext };
          }
          enhIdx++;
          return item;
        });
        setEnhancedFeed(merged);
        setBanterKey(dataKey);
      }
    });

    return () => { cancelled = true; };
  }, [data, dataKey, banterKey]);

  return {
    feed: enhancedFeed ?? data?.feedItems ?? [],
    leaderboard: data?.leaderboard ?? [],
    events: data?.events ?? [],
    loading,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
    retry: () => { refetch(); },
  };
}
