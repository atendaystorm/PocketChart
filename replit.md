# PocketRoster

A college football Hall of Fame roster management app. Visitors can browse teams and player stats in read-only mode. Admins log in to add, edit, and delete all content.

## Stack

- **Frontend**: React + TypeScript + Vite, wouter routing, TanStack Query, shadcn/ui, Tailwind CSS, Recharts
- **Backend**: Express + TypeScript (tsx), Drizzle ORM + drizzle-zod, PostgreSQL
- **Auth**: express-session (in-memory store), cookie-based sessions

## Architecture

- `shared/schema.ts` — Drizzle schema + Zod insert/select types
- `server/storage.ts` — Storage interface for all CRUD
- `server/routes.ts` — Thin API routes + auth endpoints
- `server/index.ts` — Express app + session middleware
- `client/src/context/auth-context.tsx` — AuthProvider + useAuth hook
- `client/src/components/app-sidebar.tsx` — Sidebar with login/logout in footer
- `client/src/pages/` — dashboard, team-details, players, player-details

## Auth

- Login via "Admin Login" button at bottom of sidebar
- Credentials are supplied through environment variables.
- All add/edit/delete controls are hidden from non-admin visitors

## Data Model

- **teams** — name, mascot, conference, logo, wins, losses, headCoachName, coachAccolades, coachAwards, coachRecords
- **players** — name, position, number, height, weight, status, draftRound, draftPick, accolades, teamId, photoUrl
- **playerStats** — season, gamesPlayed, rushing/passing/receiving yards + TDs (split fields), tackles, sacks, interceptions, TFL, completionPercentage, passerRating, carries, brokenTackles, fumbles

## Position-based stat charts

- QB: Yards, TDs/INTs, Comp%/Passer Rating
- RB: Yards/Broken Tackles, TDs/Fumbles, Averages
- WR/TE: Receiving Yards + TDs
- Defense (LB/DE/DT/CB/S/DB/DL/EDGE/SS/FS): Tackles+TFL+Sacks, Turnovers+Impact
