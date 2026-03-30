import { describe, it, expect } from "vitest";
import { generateNewsFeed } from "../index";
import type { CompetitionEvent, Prediction, LeaderboardEntry, Participant } from "../../../types";

const participants: Participant[] = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
  { id: 3, name: "Charlie" },
];

const leaderboard: LeaderboardEntry[] = [
  { id: 1, name: "Alice", total_points: 5, correct_predictions: 5, total_predictions: 8, rank: 1 },
  { id: 2, name: "Bob", total_points: 4, correct_predictions: 4, total_predictions: 8, rank: 2 },
  { id: 3, name: "Charlie", total_points: 2, correct_predictions: 2, total_predictions: 8, rank: 3 },
];

function makeCompletedEvent(id: number, answer: string): CompetitionEvent {
  return {
    id,
    event_name: `Event ${id}`,
    sport: "Test",
    event_date: null,
    close_date: null,
    points_value: 1,
    correct_answer: answer,
    status: "completed",
    display_order: id,
  };
}

function makePred(participantId: number, eventId: number, isCorrect: boolean): Prediction {
  return {
    id: 0,
    participant_id: participantId,
    event_id: eventId,
    prediction: isCorrect ? "Correct" : "Wrong",
    is_correct: isCorrect,
    points_earned: isCorrect ? 1 : 0,
    participant_name: participants.find(p => p.id === participantId)?.name,
  };
}

describe("generateNewsFeed", () => {
  it("generates event_result items for completed events", () => {
    const events = [makeCompletedEvent(1, "Team A")];
    const predictions = [
      makePred(1, 1, true),
      makePred(2, 1, false),
      makePred(3, 1, true),
    ];

    const feed = generateNewsFeed(events, participants, predictions, leaderboard);
    const results = feed.filter(f => f.type === "event_result");
    expect(results).toHaveLength(1);
    expect(results[0].eventId).toBe(1);
  });

  it("generates everyone_wrong when nobody is correct", () => {
    const events = [makeCompletedEvent(1, "Team A")];
    const predictions = [
      makePred(1, 1, false),
      makePred(2, 1, false),
      makePred(3, 1, false),
    ];

    const feed = generateNewsFeed(events, participants, predictions, leaderboard);
    const wrongItems = feed.filter(f => f.type === "everyone_wrong");
    expect(wrongItems).toHaveLength(1);
  });

  it("generates perfect_pick when only one person is correct", () => {
    const events = [makeCompletedEvent(1, "Team A")];
    const predictions = [
      makePred(1, 1, true),
      makePred(2, 1, false),
      makePred(3, 1, false),
    ];

    const feed = generateNewsFeed(events, participants, predictions, leaderboard);
    const perfectPicks = feed.filter(f => f.type === "perfect_pick");
    expect(perfectPicks).toHaveLength(1);
    expect(perfectPicks[0].playerName).toBe("Alice");
  });

  it("generates close_race when top 2 are within 3 points", () => {
    const feed = generateNewsFeed([], participants, [], leaderboard);
    const races = feed.filter(f => f.type === "close_race");
    expect(races).toHaveLength(1);
  });

  it("does not generate close_race when gap is large", () => {
    const wideLeaderboard: LeaderboardEntry[] = [
      { id: 1, name: "Alice", total_points: 10, correct_predictions: 10, total_predictions: 10, rank: 1 },
      { id: 2, name: "Bob", total_points: 2, correct_predictions: 2, total_predictions: 10, rank: 2 },
    ];
    const feed = generateNewsFeed([], participants, [], wideLeaderboard);
    const races = feed.filter(f => f.type === "close_race");
    expect(races).toHaveLength(0);
  });

  it("sorts by priority descending", () => {
    const events = [makeCompletedEvent(1, "Team A")];
    const predictions = [
      makePred(1, 1, true),
      makePred(2, 1, false),
      makePred(3, 1, false),
    ];

    const feed = generateNewsFeed(events, participants, predictions, leaderboard);
    for (let i = 1; i < feed.length; i++) {
      expect(feed[i - 1].priority).toBeGreaterThanOrEqual(feed[i].priority);
    }
  });

  it("returns empty feed when there is no data", () => {
    const feed = generateNewsFeed([], [], [], []);
    expect(feed).toHaveLength(0);
  });
});
