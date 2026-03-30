import { describe, it, expect } from "vitest";
import { computeStreaks } from "../streaks";
import type { CompetitionEvent, Prediction } from "../../../types";

function makeEvent(id: number, order: number): CompetitionEvent {
  return {
    id,
    event_name: `Event ${id}`,
    sport: "Test",
    event_date: null,
    close_date: null,
    points_value: 1,
    correct_answer: "A",
    status: "completed",
    display_order: order,
  };
}

function makePred(participantId: number, eventId: number, isCorrect: boolean | null): Prediction {
  return {
    id: 0,
    participant_id: participantId,
    event_id: eventId,
    prediction: "A",
    is_correct: isCorrect,
    points_earned: isCorrect ? 1 : 0,
  };
}

describe("computeStreaks", () => {
  const events = [makeEvent(1, 1), makeEvent(2, 2), makeEvent(3, 3), makeEvent(4, 4), makeEvent(5, 5)];

  it("detects a winning streak from the most recent events", () => {
    const preds = [
      makePred(1, 5, true),
      makePred(1, 4, true),
      makePred(1, 3, true),
      makePred(1, 2, false),
      makePred(1, 1, true),
    ];
    const { winStreak, loseStreak } = computeStreaks(1, preds, events);
    expect(winStreak).toBe(3);
    expect(loseStreak).toBe(0);
  });

  it("detects a losing streak from the most recent events", () => {
    const preds = [
      makePred(1, 5, false),
      makePred(1, 4, false),
      makePred(1, 3, false),
      makePred(1, 2, false),
      makePred(1, 1, true),
    ];
    const { winStreak, loseStreak } = computeStreaks(1, preds, events);
    expect(winStreak).toBe(0);
    expect(loseStreak).toBe(4);
  });

  it("returns zero streaks when results are mixed", () => {
    const preds = [
      makePred(1, 5, true),
      makePred(1, 4, false),
      makePred(1, 3, true),
    ];
    const { winStreak, loseStreak } = computeStreaks(1, preds, events);
    expect(winStreak).toBe(1);
    expect(loseStreak).toBe(0);
  });

  it("ignores predictions for other participants", () => {
    const preds = [
      makePred(1, 5, true),
      makePred(1, 4, true),
      makePred(2, 3, false), // different participant
      makePred(1, 3, true),
    ];
    const { winStreak, loseStreak } = computeStreaks(1, preds, events);
    expect(winStreak).toBe(3);
    expect(loseStreak).toBe(0);
  });

  it("handles empty predictions", () => {
    const { winStreak, loseStreak } = computeStreaks(1, [], events);
    expect(winStreak).toBe(0);
    expect(loseStreak).toBe(0);
  });

  it("skips null is_correct (pending) and continues counting the streak", () => {
    const preds = [
      makePred(1, 5, null),
      makePred(1, 4, true),
      makePred(1, 3, true),
    ];
    // null is_correct is neither correct nor incorrect, so it's skipped
    // and the win streak from events 4+3 is counted
    const { winStreak, loseStreak } = computeStreaks(1, preds, events);
    expect(winStreak).toBe(2);
    expect(loseStreak).toBe(0);
  });
});
