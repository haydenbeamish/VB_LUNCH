import { describe, it, expect } from "vitest";
import { findOutliers } from "../outliers";
import type { CompetitionEvent, Prediction, Participant } from "../../../types";

const participants: Participant[] = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
  { id: 3, name: "Charlie" },
  { id: 4, name: "Dave" },
];

function makeUpcomingEvent(id: number): CompetitionEvent {
  return {
    id,
    event_name: `Event ${id}`,
    sport: "Test",
    event_date: null,
    close_date: null,
    points_value: 1,
    correct_answer: null,
    status: "upcoming",
    display_order: id,
  };
}

function makePred(participantId: number, eventId: number, prediction: string): Prediction {
  return {
    id: 0,
    participant_id: participantId,
    event_id: eventId,
    prediction,
    is_correct: null,
    points_earned: 0,
  };
}

describe("findOutliers", () => {
  it("finds outlier when one person disagrees with the group", () => {
    const events = [makeUpcomingEvent(1)];
    const preds = [
      makePred(1, 1, "Team A"),
      makePred(2, 1, "Team A"),
      makePred(3, 1, "Team A"),
      makePred(4, 1, "Team B"), // outlier
    ];

    const outliers = findOutliers(events, preds, participants);
    expect(outliers).toHaveLength(1);
    expect(outliers[0].participant.name).toBe("Dave");
    expect(outliers[0].popularPick).toBe("Team A");
  });

  it("returns no outliers when there is no consensus", () => {
    const events = [makeUpcomingEvent(1)];
    const preds = [
      makePred(1, 1, "Team A"),
      makePred(2, 1, "Team B"),
      makePred(3, 1, "Team C"),
      makePred(4, 1, "Team D"),
    ];

    const outliers = findOutliers(events, preds, participants);
    expect(outliers).toHaveLength(0);
  });

  it("skips events with fewer than 3 predictions", () => {
    const events = [makeUpcomingEvent(1)];
    const preds = [
      makePred(1, 1, "Team A"),
      makePred(2, 1, "Team B"),
    ];

    const outliers = findOutliers(events, preds, participants);
    expect(outliers).toHaveLength(0);
  });

  it("ignores completed events", () => {
    const events: CompetitionEvent[] = [{
      ...makeUpcomingEvent(1),
      status: "completed",
      correct_answer: "Team A",
    }];
    const preds = [
      makePred(1, 1, "Team A"),
      makePred(2, 1, "Team A"),
      makePred(3, 1, "Team A"),
      makePred(4, 1, "Team B"),
    ];

    const outliers = findOutliers(events, preds, participants);
    expect(outliers).toHaveLength(0);
  });

  it("handles case-insensitive prediction matching", () => {
    const events = [makeUpcomingEvent(1)];
    const preds = [
      makePred(1, 1, "Team A"),
      makePred(2, 1, "team a"),
      makePred(3, 1, "TEAM A"),
      makePred(4, 1, "Team B"),
    ];

    const outliers = findOutliers(events, preds, participants);
    expect(outliers).toHaveLength(1);
    expect(outliers[0].participant.name).toBe("Dave");
  });
});
