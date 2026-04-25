import type { FeedItem, FeedItemType, BackendFeedItem } from "./types";

/** Default emoji per feed item type */
const TYPE_EMOJI: Record<string, string> = {
  new_leader: "\u{1F4AA}",
  new_spud: "\u{1F954}",
  event_result: "\u{1F3C6}",
  perfect_pick: "\u{1F3AF}",
  everyone_wrong: "\u{1F602}",
  winning_streak: "\u{1F525}",
  losing_streak: "\u{1F480}",
  outlier_alert: "\u{1F52E}",
  close_race: "\u{26A1}",
  hot_take: "\u{1F4A1}",
  winners_list: "\u{1F4B0}",
  group_consensus: "\u{1F5F3}\u{FE0F}",
  leader_banter: "\u{1F451}",
  last_place_banter: "\u{1F4B8}",
  pick_summary: "\u{1F4CB}",
  result_commentary: "\u{1F3C6}",
  accuracy_check: "\u{1F4C8}",
  lunch_liability: "\u{1F4B3}",
  picks_open: "\u{1F514}",
};

/** Default priority per feed item type */
const TYPE_PRIORITY: Record<string, number> = {
  event_result: 10,
  perfect_pick: 9,
  winners_list: 9,
  everyone_wrong: 8,
  close_race: 8,
  leader_banter: 8,
  last_place_banter: 8,
  result_commentary: 8,
  new_leader: 9,
  new_spud: 9,
  winning_streak: 7,
  losing_streak: 7,
  pick_summary: 6,
  outlier_alert: 5,
  group_consensus: 4,
  hot_take: 4,
  accuracy_check: 6,
  lunch_liability: 6,
  picks_open: 8,
};

/** Known type aliases the backend might use — map to our FeedItemType */
const TYPE_ALIASES: Record<string, FeedItemType> = {
  result: "event_result",
  pick: "pick_summary",
  picks: "pick_summary",
  commentary: "result_commentary",
  banter: "result_commentary",
  streak: "winning_streak",
  consensus: "group_consensus",
  leader: "leader_banter",
  last_place: "last_place_banter",
  outlier: "outlier_alert",
  perfect: "perfect_pick",
  wrong: "everyone_wrong",
  winners: "winners_list",
  close: "close_race",
};

/**
 * Normalise a raw backend feed item into our FeedItem shape.
 * Returns null if the item can't be meaningfully converted.
 */
export function normalizeBackendFeedItem(raw: unknown): FeedItem | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as BackendFeedItem;

  const headline = item.headline || item.title || "";
  const subtext = item.subtext || item.body || item.description || "";

  // Must have at least a headline or subtext to be useful
  if (!headline && !subtext) return null;

  const rawType = String(item.type ?? "result_commentary").toLowerCase().trim();
  const type: FeedItemType = TYPE_ALIASES[rawType] ?? (rawType as FeedItemType);

  return {
    id: `backend-${item.id ?? Math.random().toString(36).slice(2)}`,
    type,
    emoji: item.emoji || TYPE_EMOJI[type] || "\u{1F4E2}",
    headline,
    subtext,
    playerName: item.player_name || item.participant_name,
    playerId: item.player_id ?? item.participant_id,
    eventId: item.event_id,
    eventName: item.event_name,
    sport: item.sport,
    timestamp: item.timestamp || item.created_at,
    priority: item.priority ?? TYPE_PRIORITY[type] ?? 5,
  };
}
