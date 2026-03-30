import type {
  CompetitionEvent,
  Participant,
  LeaderboardEntry,
  Prediction,
  StatsOverview,
  EventWithPredictions,
  LunchContribution,
} from "../types";

const API_BASE = import.meta.env.VITE_API_URL || "/api/competition";
const API_KEY = import.meta.env.VITE_LASERBEAMNODE_API_KEY;

const baseHeaders: HeadersInit = {
  "Content-Type": "application/json",
  ...(API_KEY ? { "X-API-Key": API_KEY } : {}),
};

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { headers: baseHeaders });
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
  return res.json();
}

function toArray<T>(data: unknown, ...keys: string[]): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object") {
    for (const key of keys) {
      const val = (data as Record<string, unknown>)[key];
      if (Array.isArray(val)) return val as T[];
    }
    const firstArray = Object.values(data as object).find(Array.isArray);
    if (firstArray) return firstArray as T[];
  }
  return [];
}

/** Normalise a raw API event object to our CompetitionEvent shape. */
function normalizeEvent(e: Record<string, unknown>): CompetitionEvent {
  return {
    id: Number(e.id),
    event_name: String(e.event_name ?? ""),
    sport: String(e.sport ?? ""),
    event_date: (e.event_date as string) ?? null,
    // API sends event_end_date; fall back to close_date if present
    close_date: (e.event_end_date as string) ?? (e.close_date as string) ?? null,
    points_value: Number(e.available_points ?? e.points_value ?? 14),
    correct_answer: (e.correct_answer as string) ?? null,
    status: (e.status as CompetitionEvent["status"]) ?? "upcoming",
    display_order: Number(e.event_number ?? e.display_order ?? e.id),
    created_at: e.created_at as string | undefined,
    // Odds fields — populated by backend cron from The Odds API
    favourite: (e.favourite as string) ?? null,
    favourite_odds: e.favourite_odds != null ? Number(e.favourite_odds) : null,
    underdog: (e.underdog as string) ?? null,
    underdog_odds: e.underdog_odds != null ? Number(e.underdog_odds) : null,
    odds_last_updated: (e.odds_last_updated as string) ?? null,
  };
}

export async function getEvents(status?: string): Promise<CompetitionEvent[]> {
  const query = status ? `?status=${status}` : "";
  const data = await fetchJson<unknown>(`/events${query}`);
  return toArray<Record<string, unknown>>(data, "events", "data", "results").map(normalizeEvent);
}

function buildEventWithPredictions(raw: Record<string, unknown>): EventWithPredictions {
  return {
    id: Number(raw.id),
    event_name: String(raw.event_name ?? ""),
    sport: String(raw.sport ?? ""),
    event_date: (raw.event_date as string) ?? null,
    close_date: (raw.event_end_date as string) ?? (raw.close_date as string) ?? null,
    points_value: Number(raw.available_points ?? raw.points_value ?? 14),
    correct_answer: (raw.correct_answer as string) ?? null,
    status: (raw.status as CompetitionEvent["status"]) ?? "upcoming",
    display_order: Number(raw.event_number ?? raw.display_order ?? raw.id),
    created_at: raw.created_at as string | undefined,
    favourite: (raw.favourite as string) ?? null,
    favourite_odds: raw.favourite_odds != null ? Number(raw.favourite_odds) : null,
    underdog: (raw.underdog as string) ?? null,
    underdog_odds: raw.underdog_odds != null ? Number(raw.underdog_odds) : null,
    odds_last_updated: (raw.odds_last_updated as string) ?? null,
    predictions: Array.isArray(raw.predictions) ? raw.predictions : [],
  };
}

export async function getEvent(id: number): Promise<EventWithPredictions> {
  const data = await fetchJson<unknown>(`/events/${id}`);
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const obj = data as Record<string, unknown>;
    // API may return the event wrapped in { event: {...}, predictions: [...] }
    if (obj.event && typeof obj.event === "object") {
      const event = obj.event as Record<string, unknown>;
      const predictions = Array.isArray(obj.predictions) ? obj.predictions : (event.predictions ?? []);
      return buildEventWithPredictions({ ...event, predictions });
    }
    // Or flat with id + event_name at root
    if ("id" in obj && "event_name" in obj) {
      return buildEventWithPredictions(obj);
    }
  }
  // Fallback: try to build from whatever we got
  return buildEventWithPredictions((data ?? {}) as Record<string, unknown>);
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const data = await fetchJson<unknown>("/leaderboard");
  return toArray<LeaderboardEntry>(data, "leaderboard", "data", "results");
}

export async function getParticipants(): Promise<Participant[]> {
  const data = await fetchJson<unknown>("/participants");
  return toArray<Participant>(data, "participants", "data", "results");
}

export async function getParticipant(id: number): Promise<{
  participant: Participant;
  predictions: Prediction[];
  total_points: number;
}> {
  const data = await fetchJson<unknown>(`/participants/${id}`);
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    // Handle case where participant data is at root or nested
    const participant = (obj.participant ?? obj.data ?? obj) as Participant;
    const rawPredictions = Array.isArray(obj.predictions) ? obj.predictions as Prediction[] : [];
    // Normalize is_correct: API may return 1/0 instead of true/false
    const predictions = rawPredictions.map((p) => ({
      ...p,
      is_correct: p.is_correct === null || p.is_correct === undefined ? null : Boolean(p.is_correct),
    }));
    const participantObj = obj.participant as Record<string, unknown> | undefined;
    const total_points =
      typeof obj.total_points === "number" ? obj.total_points :
      (participantObj && typeof participantObj === "object" && typeof participantObj.total_points === "number") ? participantObj.total_points :
      predictions.reduce((sum: number, p: Prediction) => sum + (p.points_earned || 0), 0);
    return { participant, predictions, total_points };
  }
  return data as { participant: Participant; predictions: Prediction[]; total_points: number };
}

export async function getResults(): Promise<{
  events: CompetitionEvent[];
  participants: Participant[];
  predictions: Prediction[];
}> {
  const raw = await fetchJson<Record<string, unknown>>("/results");

  // Participants keyed by name for ID lookup
  const rawParticipants: Participant[] = toArray<Participant>(raw, "participants");
  const nameToId = new Map(rawParticipants.map((p) => [p.name, Number(p.id)]));

  const rawEvents = toArray<Record<string, unknown>>(raw, "events");
  const events: CompetitionEvent[] = rawEvents.map(normalizeEvent);

  // Flatten per-event embedded predictions (keyed by participant name) into a flat array
  const predictions: Prediction[] = rawEvents.flatMap((e) => {
    const eventId = Number(e.id);
    const embeddedPreds = e.predictions;
    if (!embeddedPreds || typeof embeddedPreds !== "object" || Array.isArray(embeddedPreds)) return [];
    return Object.entries(embeddedPreds as Record<string, Record<string, unknown>>).map(
      ([name, pred]) => ({
        id: 0,
        event_id: eventId,
        participant_id: nameToId.get(name) ?? 0,
        prediction: String(pred.prediction ?? ""),
        is_correct:
          pred.is_correct === null || pred.is_correct === undefined
            ? null
            : Boolean(pred.is_correct),
        points_earned: Number(pred.points_awarded ?? pred.points_earned ?? 0),
        participant_name: name,
      })
    );
  });

  return { events, participants: rawParticipants, predictions };
}

export async function getFeed(options?: {
  limit?: number;
  offset?: number;
  type?: string;
  since?: string;
}): Promise<unknown[]> {
  const params = new URLSearchParams();
  if (options?.limit) params.set("limit", String(options.limit));
  if (options?.offset) params.set("offset", String(options.offset));
  if (options?.type) params.set("type", options.type);
  if (options?.since) params.set("since", options.since);
  const query = params.toString() ? `?${params}` : "";
  const data = await fetchJson<unknown>(`/feed${query}`);
  return toArray<unknown>(data, "feed", "items", "data", "results");
}

export async function getStats(): Promise<StatsOverview> {
  const [stats, lb] = await Promise.all([
    fetchJson<StatsOverview>("/stats"),
    getLeaderboard(),
  ]);

  // Build the full lunch contributions table (14 positions) with participant names
  const { LUNCH_CONTRIBUTIONS } = await import("../lib/feed/index");
  const lunch_contributions: LunchContribution[] = LUNCH_CONTRIBUTIONS.map((entry) => {
    const player = lb[entry.position - 1];
    return {
      position: entry.position,
      contribution: entry.contribution,
      participant_name: player?.name,
    };
  });

  return { ...stats, lunch_contributions };
}
