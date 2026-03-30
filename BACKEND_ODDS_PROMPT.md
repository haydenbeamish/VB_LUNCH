# Backend Prompt: Odds API Integration for BOSF

## Context

BOSF is a sports prediction leaderboard app. The frontend (React/TypeScript) consumes a backend API at a configurable `VITE_API_URL` base. The frontend is read-only — all event/participant/prediction management happens on the backend.

The frontend already has a newsfeed system (`src/lib/newsfeed.ts`) that generates banter-style feed items (streaks, outliers, close races, etc.) from existing data. We want to enrich this with **real-world betting odds** so the feed can highlight things like:

- "The bookies have Duke at $1.40 but most of you picked Arizona"
- "Florida is a $6.50 outsider — Divis is backing the long shot"
- Upcoming event odds summaries the day before an event

## What to build

### 1. Integrate The Odds API

Use [The Odds API](https://the-odds-api.com/) to fetch live/upcoming odds for events.

- Free tier gives 500 requests/month — cache aggressively
- API docs: `https://the-odds-api.com/liveapi/guides/v4/`
- Key endpoints:
  - `GET /v4/sports` — list available sports
  - `GET /v4/sports/{sport}/odds` — get odds for upcoming events in a sport

### 2. New database fields on events table

Add these columns to the `events` table (all nullable, so existing events are unaffected):

```
odds_api_sport_key   TEXT     -- The Odds API sport key (e.g. "basketball_ncaab", "aussierules_afl")
odds_api_event_id    TEXT     -- The Odds API event ID for matching
favourite            TEXT     -- Name of the current bookmaker favourite
favourite_odds       REAL     -- Decimal odds of the favourite (e.g. 1.40)
underdog             TEXT     -- Name of the underdog
underdog_odds        REAL     -- Decimal odds of the underdog (e.g. 6.50)
odds_last_updated    DATETIME -- When odds were last fetched
```

### 3. Sport key mapping

Map BOSF sport categories to The Odds API sport keys. The BOSF sports are:

```
F1, Basketball, Golf, UFC, Surfing, Horse Racing, Soccer, Darts, Tennis,
World Cup, Ice Hockey, Rugby League, Cricket, Cycling, Poker, TV, AFL, WAFL
```

Not all will have odds API coverage. Create a mapping config, e.g.:

```json
{
  "AFL": "aussierules_afl",
  "Basketball": "basketball_ncaab",
  "Soccer": "soccer_epl",
  "Ice Hockey": "icehockey_nhl",
  "Rugby League": "rugbyleague_nrl",
  "Tennis": "tennis_atp_aus_open",
  "Cricket": "cricket_big_bash",
  "Golf": "golf_pga"
}
```

Note: Some BOSF sports like Poker, TV, Surfing, Darts won't have odds. That's fine — odds fields stay null for those.

### 4. New API endpoint

Add a new endpoint to serve odds data to the frontend:

**`GET /events/{id}/odds`**

Response:
```json
{
  "event_id": 42,
  "favourite": "Duke Blue Devils",
  "favourite_odds": 1.40,
  "underdog": "Arizona Wildcats",
  "underdog_odds": 6.50,
  "odds_source": "draftkings",
  "odds_last_updated": "2026-03-26T14:00:00Z"
}
```

Also **extend the existing `GET /events` and `GET /events/{id}` responses** to include the odds fields inline so the frontend doesn't need a separate call:

```json
{
  "id": 42,
  "event_name": "NCAA March Madness",
  "sport": "Basketball",
  "event_date": "2026-03-28",
  "status": "upcoming",
  "favourite": "Duke Blue Devils",
  "favourite_odds": 1.40,
  "underdog": "Arizona Wildcats",
  "underdog_odds": 6.50,
  "odds_last_updated": "2026-03-26T14:00:00Z"
}
```

### 5. Odds fetching strategy

Create a background job/cron that:

1. Runs **once daily** (to stay within free tier limits)
2. Finds all events with `status = 'upcoming'` or `status = 'in_progress'` that have an `odds_api_sport_key` set
3. Calls The Odds API for each distinct sport key
4. Matches API results to BOSF events by `odds_api_event_id` (or fuzzy name match if no ID set)
5. Updates `favourite`, `favourite_odds`, `underdog`, `underdog_odds`, `odds_last_updated`
6. Uses the **h2h (head-to-head / moneyline)** market and picks odds from the first available bookmaker (prefer `draftkings` or `tab` for Australian markets)

### 6. Event matching

When an admin creates a new event, they should be able to:

- Optionally set `odds_api_sport_key` and `odds_api_event_id` manually
- OR use a helper endpoint that searches The Odds API and returns matching events:

**`GET /odds/search?sport={odds_api_sport_key}`**

Returns upcoming events from The Odds API so the admin can pick the right one and link it.

### 7. Environment variables

Add:
```
ODDS_API_KEY=<the-odds-api-key>
```

## How the frontend will use this

Once odds fields are available on events, the frontend `newsfeed.ts` will add new feed item types:

- **`odds_alert`** — "NCAA March Madness tips off tomorrow. Duke is the $1.40 favourite."
- **`contrarian_pick`** — "The bookies have Duke at $1.40 but most of you picked Arizona at $6.50. Someone's wrong."
- **`underdog_backer`** — "Divis is riding with the $6.50 outsider Florida. Fortune favours the brave."

The frontend will read `favourite`, `favourite_odds`, `underdog`, `underdog_odds` directly from the event objects returned by `GET /events`. No extra API calls needed from the frontend.

## Summary of backend changes

1. Add odds columns to events table (migration)
2. Add sport key mapping config
3. Create daily cron job to fetch and cache odds from The Odds API
4. Extend existing event endpoints to return odds fields
5. Add `GET /events/{id}/odds` convenience endpoint
6. Add `GET /odds/search` admin helper endpoint
7. Add `ODDS_API_KEY` env var
