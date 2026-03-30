import type { CompetitionEvent, Prediction, Participant } from "../../types";
import type { FeedItem } from "./types";
import { hashPick, CONTRARIAN_PICK_TEMPLATES, UNDERDOG_BACKER_TEMPLATES } from "./templates";

/** Maximum total odds-related items to include in the feed */
const MAX_ODDS_ITEMS = 3;

/** Build a pick distribution for an event: who picked what, grouped by option */
function buildPickDistribution(
  event: CompetitionEvent,
  allPredictions: Prediction[],
  participants: Participant[]
): NonNullable<FeedItem["picks"]> {
  const eventPreds = allPredictions.filter(
    (p) => Number(p.event_id) === Number(event.id)
  );

  const participantMap = new Map(
    participants.map((p) => [Number(p.id), p.name])
  );

  // Group predictions by option (case-insensitive)
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

  const favouriteKey = event.favourite?.toLowerCase().trim() ?? "";

  const options = Object.entries(groups)
    .map(([key, { label, names }]) => ({
      label,
      count: names.length,
      names,
      isFavourite: key === favouriteKey,
    }))
    .sort((a, b) => b.count - a.count);

  return { options, total: eventPreds.length };
}

export function generateOddsFeedItems(
  events: CompetitionEvent[],
  allPredictions: Prediction[],
  participants: Participant[]
): FeedItem[] {
  const feed: FeedItem[] = [];

  const upcomingWithOdds = events.filter(
    (e) => e.status !== "completed" && e.favourite && e.favourite_odds
  );

  // --- Odds alerts: show actual odds for upcoming events ---
  for (const event of upcomingWithOdds) {
    const eventDate = event.event_date ?? event.close_date;
    const picks = buildPickDistribution(event, allPredictions, participants);
    const favOdds = `$${event.favourite_odds!.toFixed(2)}`;
    const headline = event.underdog
      ? `${event.favourite} (${favOdds}) vs ${event.underdog}${event.underdog_odds ? ` ($${event.underdog_odds.toFixed(2)})` : ""}`
      : `${event.favourite} favoured at ${favOdds}`;

    feed.push({
      id: `odds-${event.id}`,
      type: "odds_alert",
      emoji: "\u{1F4CA}",
      headline,
      subtext: event.event_name,
      eventId: event.id,
      eventName: event.event_name,
      sport: event.sport,
      timestamp: eventDate ?? undefined,
      priority: 5,
      odds: {
        favourite: event.favourite!,
        favouriteOdds: event.favourite_odds!,
        underdog: event.underdog ?? undefined,
        underdogOdds: event.underdog_odds ?? undefined,
      },
      picks: picks.total > 0 ? picks : undefined,
    });
  }

  // --- Contrarian picks: group's most popular pick differs from bookmaker favourite ---
  const contrarianCandidates: {
    event: CompetitionEvent;
    popularDisplay: string;
    popularCount: number;
    total: number;
    favOdds: string;
  }[] = [];

  for (const event of upcomingWithOdds) {
    const eventPreds = allPredictions.filter((p) => Number(p.event_id) === Number(event.id));
    if (eventPreds.length < 3) continue;

    const counts: Record<string, number> = {};
    const originalCase: Record<string, string> = {};
    for (const p of eventPreds) {
      const key = p.prediction.toLowerCase().trim();
      counts[key] = (counts[key] || 0) + 1;
      if (!originalCase[key]) originalCase[key] = p.prediction.trim();
    }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const popularKey = sorted[0]?.[0] ?? "";
    const popularDisplay = originalCase[popularKey] ?? popularKey;
    const favouriteKey = event.favourite!.toLowerCase().trim();

    if (popularKey && popularKey !== favouriteKey) {
      contrarianCandidates.push({
        event,
        popularDisplay,
        popularCount: sorted[0]?.[1] ?? 0,
        total: eventPreds.length,
        favOdds: `$${event.favourite_odds!.toFixed(2)}`,
      });
    }
  }

  // Sort by disagreement strength (highest % of group disagreeing with bookies first)
  contrarianCandidates.sort((a, b) => (b.popularCount / b.total) - (a.popularCount / a.total));

  // Only keep the top 2 most dramatic disagreements
  for (const c of contrarianCandidates.slice(0, 2)) {
    const pctGroup = Math.round((c.popularCount / c.total) * 100);
    const t = hashPick(CONTRARIAN_PICK_TEMPLATES, `contrarian-${c.event.id}`);
    const { headline, subtext } = t(c.event.event_name, c.event.favourite!, c.favOdds, c.popularDisplay, pctGroup);
    const picks = buildPickDistribution(c.event, allPredictions, participants);
    feed.push({
      id: `contrarian-${c.event.id}`,
      type: "contrarian_pick",
      emoji: "\u{1F914}",
      headline,
      subtext,
      eventId: c.event.id,
      eventName: c.event.event_name,
      sport: c.event.sport,
      priority: 7,
      odds: {
        favourite: c.event.favourite!,
        favouriteOdds: c.event.favourite_odds!,
        underdog: c.event.underdog ?? undefined,
        underdogOdds: c.event.underdog_odds ?? undefined,
      },
      picks: picks.total > 0 ? picks : undefined,
    });
  }

  // --- Underdog backers: only the single boldest pick (highest underdog odds) ---
  let boldestUnderdog: {
    participant: Participant;
    event: CompetitionEvent;
    prediction: Prediction;
    underdogOdds: number;
  } | null = null;

  for (const event of upcomingWithOdds) {
    if (!event.underdog || !event.underdog_odds) continue;
    const underdogKey = event.underdog.toLowerCase().trim();
    const eventPreds = allPredictions.filter((p) => Number(p.event_id) === Number(event.id));

    for (const pred of eventPreds) {
      const pickKey = pred.prediction.toLowerCase().trim();
      if (pickKey === underdogKey) {
        const participant = participants.find((p) => Number(p.id) === Number(pred.participant_id));
        if (participant && (!boldestUnderdog || event.underdog_odds > boldestUnderdog.underdogOdds)) {
          boldestUnderdog = { participant, event, prediction: pred, underdogOdds: event.underdog_odds };
        }
      }
    }
  }

  if (boldestUnderdog) {
    const { participant, event, prediction, underdogOdds } = boldestUnderdog;
    const underdogOddsStr = `$${underdogOdds.toFixed(2)}`;
    const t = hashPick(UNDERDOG_BACKER_TEMPLATES, `underdog-${prediction.id}`);
    const { headline, subtext } = t(participant.name, event.event_name, prediction.prediction, underdogOddsStr);
    feed.push({
      id: `underdog-${prediction.id}`,
      type: "underdog_backer",
      emoji: "\u{1F40E}",
      headline,
      subtext,
      playerName: participant.name,
      playerId: participant.id,
      eventId: event.id,
      eventName: event.event_name,
      sport: event.sport,
      priority: 6,
      odds: {
        favourite: event.favourite!,
        favouriteOdds: event.favourite_odds!,
        underdog: event.underdog ?? undefined,
        underdogOdds: event.underdog_odds ?? undefined,
      },
    });
  }

  // Hard cap on total odds items
  return feed.slice(0, MAX_ODDS_ITEMS);
}
