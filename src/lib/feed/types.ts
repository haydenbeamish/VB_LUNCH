export type FeedItemType =
  | "event_result"
  | "outlier_alert"
  | "winning_streak"
  | "losing_streak"
  | "perfect_pick"
  | "everyone_wrong"
  | "close_race"
  | "hot_take"
  | "winners_list"
  | "group_consensus"
  | "leader_banter"
  | "last_place_banter"
  | "pick_summary"
  | "result_commentary"
  | "new_leader"
  | "new_spud"
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
  /** Pick distribution: who picked what for an event */
  picks?: {
    options: Array<{
      label: string;
      count: number;
      names: string[];
      isCorrect?: boolean;
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
