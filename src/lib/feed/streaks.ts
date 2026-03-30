import type { CompetitionEvent, Prediction } from "../../types";

const STREAK_THRESHOLD = 3;

export { STREAK_THRESHOLD };

export function computeStreaks(
  participantId: number,
  predictions: Prediction[],
  events: CompetitionEvent[]
): { winStreak: number; loseStreak: number } {
  const completedEventIds = new Set(
    events.filter((e) => e.status === "completed").map((e) => Number(e.id))
  );

  const sorted = predictions
    .filter((p) => Number(p.participant_id) === Number(participantId) && completedEventIds.has(Number(p.event_id)))
    .sort((a, b) => {
      const eA = events.find((e) => Number(e.id) === Number(a.event_id));
      const eB = events.find((e) => Number(e.id) === Number(b.event_id));
      return (eB?.display_order ?? 0) - (eA?.display_order ?? 0);
    });

  let winStreak = 0;
  let loseStreak = 0;

  for (const pred of sorted) {
    const correct = pred.is_correct === true || (pred.is_correct as unknown) === 1;
    const incorrect = pred.is_correct === false || (pred.is_correct as unknown) === 0;
    if (correct) {
      if (loseStreak > 0) break;
      winStreak++;
    } else if (incorrect) {
      if (winStreak > 0) break;
      loseStreak++;
    }
  }

  return { winStreak, loseStreak };
}
