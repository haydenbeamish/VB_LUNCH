export type SportCategory =
  | "F1"
  | "Basketball"
  | "Golf"
  | "UFC"
  | "Surfing"
  | "Horse Racing"
  | "Soccer"
  | "Darts"
  | "Tennis"
  | "World Cup"
  | "Ice Hockey"
  | "Rugby League"
  | "Cricket"
  | "Cycling"
  | "Poker"
  | "TV"
  | "AFL"
  | "WAFL";

export type EventStatus = "upcoming" | "in_progress" | "completed";

export interface Participant {
  id: number;
  name: string;
  created_at?: string;
}

export interface CompetitionEvent {
  id: number;
  event_name: string;
  sport: string;
  event_date: string | null;
  close_date: string | null;
  points_value: number;
  correct_answer: string | null;
  status: EventStatus;
  display_order: number;
  created_at?: string;
  // Odds fields (nullable — populated by backend cron from The Odds API)
  favourite?: string | null;
  favourite_odds?: number | null;
  underdog?: string | null;
  underdog_odds?: number | null;
  odds_last_updated?: string | null;
}

export interface Prediction {
  id: number;
  participant_id: number;
  event_id: number;
  prediction: string;
  is_correct: boolean | null;
  points_earned: number;
  participant_name?: string;
  event_name?: string;
  sport?: string;
  status?: EventStatus;
  correct_answer?: string | null;
}

export interface LeaderboardEntry {
  id: number;
  name: string;
  total_points: number;
  correct_predictions: number;
  total_predictions: number;
  rank: number;
}

export interface EventWithPredictions extends CompetitionEvent {
  predictions: (Prediction & { participant_name: string })[];
}

export interface ParticipantWithPredictions extends Participant {
  predictions: Prediction[];
  total_points: number;
}

export interface LunchContribution {
  position: number;
  contribution: number;
  participant_name?: string;
}

export interface StatsOverview {
  total_events: number;
  completed_events: number;
  upcoming_events: number;
  in_progress_events: number;
  leaderboard: LeaderboardEntry[];
  lunch_contributions?: LunchContribution[];
}
