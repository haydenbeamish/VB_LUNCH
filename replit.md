# BOSF - Punting Leaderboard

A web-based sports prediction leaderboard app that tracks competition events, predictions, and participant rankings across various sports (F1, Basketball, Golf, etc.).

## Tech Stack

- **Frontend:** React 19 + TypeScript
- **Build Tool:** Vite 8
- **Styling:** Tailwind CSS 4 (glassmorphism design)
- **Routing:** React Router 7
- **Animations:** Framer Motion
- **Charts:** Recharts
- **Icons:** Lucide React
- **Package Manager:** npm

## Project Structure

- `src/pages/` - Top-level route pages (Dashboard, Leaderboard, Events, Player)
- `src/components/` - Reusable UI components (layout, leaderboard, ui)
- `src/data/api.ts` - API layer (uses `VITE_API_URL` env var or defaults to `/api/competition`)
- `src/hooks/` - Custom React hooks for data fetching
- `src/types/` - TypeScript interfaces
- `src/lib/` - Utility helpers

## Development

```bash
npm install
npm run dev
```

The dev server runs on `0.0.0.0:5000` with all hosts allowed for Replit proxy compatibility.

## Deployment

Configured as a static site deployment:
- Build command: `npm run build`
- Public directory: `dist`

## Environment Variables

- `VITE_API_URL` - Backend API base URL (optional, defaults to `/api/competition`)
