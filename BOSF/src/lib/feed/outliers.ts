import type { CompetitionEvent, Prediction, Participant } from "../../types";

const MAX_OUTLIERS = 4;

export { MAX_OUTLIERS };

export interface OutlierInfo {
  participant: Participant;
  prediction: Prediction;
  event: CompetitionEvent;
  popularPick: string;
  pickCount: number;
  totalPicks: number;
}

export function findOutliers(
  events: CompetitionEvent[],
  allPredictions: Prediction[],
  participants: Participant[]
): OutlierInfo[] {
  const outliers: OutlierInfo[] = [];

  // Only flag outliers for events resolving within the next 90 days.
  // Season-long events (e.g. AFL H&A ending in August) are excluded so the
  // news feed doesn't chatter about picks that won't matter for months.
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + 90);

  const upcomingEvents = events.filter((e) => {
    if (e.status === "completed") return false;
    const displayDate = e.close_date && e.close_date > (e.event_date ?? "")
      ? e.close_date
      : e.event_date;
    if (!displayDate) return true;
    return new Date(displayDate) <= cutoff;
  });

  for (const event of upcomingEvents) {
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
    const popularPick = sorted[0]?.[0] ?? "";
    const popularPickDisplay = originalCase[popularPick] ?? popularPick;
    const popularCount = sorted[0]?.[1] ?? 0;
    const groupHasConsensus = popularCount >= eventPreds.length - 2;

    for (const pred of eventPreds) {
      const key = pred.prediction.toLowerCase().trim();
      const count = counts[key] ?? 0;
      if (count <= 2 && key !== popularPick && groupHasConsensus) {
        const participant = participants.find((p) => Number(p.id) === Number(pred.participant_id));
        if (participant) {
          outliers.push({
            participant,
            prediction: pred,
            event,
            popularPick: popularPickDisplay,
            pickCount: count,
            totalPicks: eventPreds.length,
          });
        }
      }
    }
  }

  return outliers;
}
