# CLAUDE.md

AI-powered word puzzle generator. Users describe a topic, Claude AI generates words/clues, app creates playable word search, crossword, or anagram with lives, hints, timer, scoring, and difficulty scaling. Saved games persist in-progress state for resume.

## Commands
`npm run dev` (Next.js dev server) | `npm run build` | `npm run lint` | `npm run test` (Vitest watch) | `npm run test:run` (single run) | `npm run db:push` (Drizzle schema push) | `npx vitest run path/to/file.test.ts`

## Stack
Next.js 16 (App Router) + React 19 + TypeScript | Tailwind CSS 4 | PostgreSQL + Drizzle ORM | iron-session (encrypted cookies) | Claude API (Haiku 4.5 categories, Sonnet 4.5 generation, 3-attempt retry) | Vitest + Testing Library (jsdom, globals)

## Gotchas
- Single API route `POST /api/generate` handles both category suggestions and full puzzle generation
- Game state via `useReducer` action machines in `useWordSearchGame.ts` / `useCrosswordGame.ts` / `useAnagramGame.ts`
- Status lifecycle: `idle` → `playing` → `won`/`lost` (with `paused` side state). Hints cost 1 life (disabled at 1 remaining)
- Grid generators: `src/lib/games/wordsearch/gridGenerator.ts`, `src/lib/games/crossword/gridGenerator.ts`. Scoring: `src/lib/scoring.ts`
- sessionStorage keys per game type: `lexicon-puzzle`, `lexicon-puzzle-crossword`, `lexicon-puzzle-anagram`, plus shared `lexicon-saved-puzzle-id`/`lexicon-game-state` — clean up ALL on navigation
- Crossword `hintedCells` is a Set — serialize via `Array.from()` for JSON, reconstruct with `new Set()` on restore
- All fetch to `/api/*` must include `credentials: "include"`
- Puzzle history persisted in PostgreSQL, scoped by username. Stats derived server-side
- Landing page debounces topic input (600ms) for category prefetch
- All shared types/config constants in `src/lib/types.ts`
- Tests in `__tests__/` dirs alongside source. Setup at `src/test/setup.ts`. Path alias `@/` → `src/`
- `drizzle-kit push` won't load `.env.local` — source env vars first: `source <(grep -v '^#' .env.local | sed 's/^/export /')`

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

## Reference docs (local only, not in git)
- `.claude/docs/architecture.md` — game flow, API, state management, grid gen, hints, scoring, storage
