# CLAUDE.md

AI-powered word puzzle generator. Users describe a topic, Claude AI generates words/clues, app creates playable word search, crossword, or anagram with lives, hints, timer, scoring, and difficulty scaling. Saved games persist in-progress state for resume.

## Commands
`npm run dev` (Next.js dev server) | `npm run build` | `npm run lint` | `npm run test` (Vitest watch) | `npm run test:run` (single run) | `npm run db:push` (Drizzle schema push) | `npx vitest run path/to/file.test.ts`

## Stack
Next.js 16 (App Router) + React 19 + TypeScript | Tailwind CSS 4 | PostgreSQL + Drizzle ORM | iron-session (encrypted cookies) | Claude API (Haiku 4.5 categories, Sonnet 4.5 generation) | Vitest + Testing Library (jsdom, globals)

## Gotchas
- `POST /api/generate` handles category suggestions AND full puzzle generation
- Generation is rate-limited. Config in `schema.ts`, response includes `_meta` — client strips before storing in sessionStorage
- Retry with loosened categories on final attempt. Right-size candidate counts to ~1.5× minWords
- Game state via `useReducer` in `use{WordSearch,Crossword,Anagram}Game.ts`. Status: `idle` → `playing` → `won`/`lost`
- Grid generators: `src/lib/games/{wordsearch,crossword}/gridGenerator.ts`. Scoring: `src/lib/scoring.ts`
- sessionStorage keys in `src/lib/storage-keys.ts`. Auto-save via `useAutoSave` hook. `hintedCells` Set → Array for JSON
- All fetch to `/api/*` must include `credentials: "include"`. Types: `src/lib/types.ts`. Tests: `__tests__/` dirs, alias `@/` → `src/`
- Quick-start topics: Classic Movies, Italian Cuisine, Marvel Universe, Ancient Egypt, Ocean Life, Space Exploration
## Design
Dark-first. Glassmorphic panels (`--glass-bg: rgba(255,255,255,0.08)`, `--glass-border: rgba(255,255,255,0.15)`, `--white-muted`). CSS custom properties in `globals.css`.

### Fonts (via `next/font/google`)
- **Display/headings** (`font-display`, `font-heading`): Nunito 700-900
- **Body** (`font-body`): Inter
- **Grid** (`font-grid`): JetBrains Mono 500-600

### Colors
Purple gradient `#2D1B69` → `#1A0A2E` | Gold `#FFD700` | Green `#00E676` | Cyan `#00E5FF` | Pink `#FF4081`

## Environment Variables (.env.local)
`ANTHROPIC_API_KEY` | `DATABASE_URL` | `SESSION_SECRET`

## Reference: `.claude/docs/architecture.md` (local only, not in git)

## Mobile / Desktop Components
- All game pages share `GameBar` (header) and `GameStatsBar` (fixed bottom bar, desktop). `WordProgress` used by wordsearch, anagram, crossword. Update all when changing layout
- Desktop game panels (trivia, anagram): `w-[600px]` centered. Crossword/wordsearch use flexible grid sizing
- Primary action buttons: gold gradient `linear-gradient(135deg, #f7c948, #e5b52e)`, dark text `#1a1430`, `borderRadius: 12`
- Interstitials: `fixed inset-0 overflow-hidden`, not `min-h-screen`. Messages escalate (exploratory → constructive → conclusive), never loop
