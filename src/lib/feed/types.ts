export type FeedItemType =
  | "event_result"
  | "outlier_alert"
  | "winning_streak"
  | "losing_streak"
  | "perfect_pick"
  | "everyone_wrong"
  | "close_race"
  | "hot_take"
  | "odds_alert"
  | "contrarian_pick"
  | "underdog_backer"
  | "winners_list"
  | "group_consensus"
  | "leader_banter"
  | "last_place_banter"
  | "pick_summary"
  | "result_commentary"
  | "pre_event_odds"
  | "new_leader"
  | "new_spud"
  | "upset_alert"
  | "accuracy_check"
  | "lunch_liability"
  | "picks_open";

export interface FeedItem {
  id: string;
  type: FeedItemType;
  emoji: string;
  headline: string;
  subtext: string;
  playerName?: string;
  playerId?: number;
  eventId?: number;
  eventName?: string;
  sport?: string;
  timestamp?: string;
  priority: number;
  /** Structured odds data for visual rendering on odds_alert cards */
  odds?: {
    favourite: string;
    favouriteOdds: number;
    underdog?: string;
    underdogOdds?: number;
  };
  /** Who picked what — for showing pick distribution alongside odds */
  picks?: {
    options: Array<{
      label: string;
      count: number;
      names: string[];
      isFavourite?: boolean;
    }>;
    total: number;
  };
}

/**
 * Shape of a feed item returned by the backend /api/competition/feed endpoint.
 * We normalise these into FeedItem before display.
 */
export interface BackendFeedItem {
  id: number | string;
  type: string;
  headline?: string;
  title?: string;
  subtext?: string;
  body?: string;
  description?: string;
  emoji?: string;
  player_name?: string;
  participant_name?: string;
  player_id?: number;
  participant_id?: number;
  event_id?: number;
  event_name?: string;
  sport?: string;
  timestamp?: string;
  created_at?: string;
  priority?: number;
}
