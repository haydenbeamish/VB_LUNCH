# BOSF - Punting Leaderboard

A web-based sports prediction leaderboard app ("Betting On Sports Fun") for a group of mates to track competition events, predictions, and participant rankings across various sports (F1, Basketball, Golf, etc.). Features AI-generated banter via OpenRouter and Brave Search integration.

## Tech Stack

- **Frontend:** React 19 + TypeScript
- **Build Tool:** Vite 8
- **Styling:** Tailwind CSS 4 (glassmorphism design)
- **Routing:** React Router 7
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **State/Cache:** TanStack Query v5 with localStorage persistence
- **Backend:** Express.js (AI proxy for OpenRouter + Brave Search)
- **Package Manager:** npm

## Project Structure

- `src/pages/` - Top-level route pages (Dashboard, Leaderboard, Events, Player, Admin)
- `src/components/` - Reusable UI components (layout, leaderboard, feed, ui)
- `src/data/api.ts` - API layer for external data backend (uses `VITE_API_URL` env var or defaults to `https://api.laserbeamcapital.com`)
- `src/data/ai.ts` - AI API calls (to local Express server at `/api/ai`)
- `src/hooks/` - Custom React hooks for data fetching
- `src/types/` - TypeScript interfaces
- `src/lib/` - Utility helpers and feed generation logic
- `server.js` - Express server for AI proxy endpoints

## Development

```bash
npm install
npm run dev:all   # Runs both Vite (port 5000) and Express server (port 3000) concurrently
```

- Vite dev server runs on `0.0.0.0:5000` (the webview)
- Express server runs on port 3000 (AI proxy endpoints at `/api/ai/*`)
- Vite proxies `/api/ai` requests to `http://localhost:3000`

## Deployment

- Build command: `npm install && npm run build`
- Run command: `node server.js` (serves built frontend + API endpoints, uses `PORT` env var)

## Environment Variables

- `VITE_API_URL` - External data backend URL (optional, defaults to `https://api.laserbeamcapital.com`)
- `OPENROUTER_API_KEY` - API key for OpenRouter AI banter generation
- `BRAVE_WEBSEARCH_API` - API key for Brave Search event context
