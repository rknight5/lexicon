# Lexicon — Design Document

## Summary

Lexicon is a web app that takes natural language descriptions of a user's interests and generates playable word search puzzles. Users type any topic — "80s hair metal", "Italian cooking", "Marvel Universe" — and get a word search filled with relevant terms, names, and references.

**Domain-agnostic from day one.** Not locked to music. Claude dynamically generates relevant categories and words for any topic.

## MVP Scope

The MVP delivers the core puzzle loop with no persistence:

**Landing → Config → Generate → Play → Win/Lose**

No database, no usernames, no score persistence, no save/resume. Just generate and play.

## Architecture

- **Stack:** Next.js (App Router), React, TypeScript, Tailwind CSS, Claude API (Anthropic SDK), Lucide React (icons)
- **State management:** useState + useReducer (no external state library)
- **Single API route:** `POST /api/generate` — handles Claude calls, word validation, grid generation
- **Deployment:** Railway (production), Cloudflare tunnel (dev testing)
- **No database in MVP.** Prisma + PostgreSQL deferred to Phase 2.

## Key Design Decisions

### 1. Dynamic Categories via Two-Step API Flow

Instead of hardcoded music categories, the system uses two Claude calls:

1. **Haiku call (~400ms, ~$0.0001/call):** User submits topic → Claude returns 5-7 relevant categories for that topic (e.g., "Italian cooking" → Dishes, Ingredients, Techniques, Chefs, Regions)
2. **Sonnet call (~2-3s):** User selects categories + difficulty → Claude generates words filtered to selected categories

The Haiku call happens in the transition to the config screen, so it feels instant.

### 2. Claude Model Selection

- **Category suggestion:** Claude Haiku (fastest, cheapest)
- **Word generation:** Claude Sonnet 4.5 (`claude-sonnet-4-5-20250929`) for reliable structured output

### 3. Grid Generation

- Server-side in the API route (keeps API key secure)
- Custom TypeScript algorithm: sort words by length (longest first), attempt placement with random direction/position, fill remaining cells with weighted random letters
- Difficulty scaling: Easy (12x12, right/down only, common fill letters), Medium (15x15, all 8 directions, common fill), Hard (18x18, all 8 directions, uniform random fill)

### 4. Drag Interaction

- Click/tap start cell → drag to end cell in straight line
- Direction snaps to nearest 45-degree angle
- **Direction locks after 2 cells** to prevent flickering
- Reverse word matching supported (selecting letters backward counts)
- `touch-action: none` on grid to prevent scroll on mobile
- Only completed drags on 2+ cells that don't match a word cost a life

### 5. Response Parsing

Same battle-tested approach as Waypoint:
- Strip markdown code fences
- Find first `{` and last `}`
- Parse JSON
- Validate shape
- Check `stop_reason === "max_tokens"` for truncation
- `max_tokens` set to 4096

### 6. Retry Strategy

3 attempts with progressively broadened prompts:
1. Standard prompt with user's config
2. Broadened: include related topics and references
3. Further broadened: remove category restrictions
4. Error message suggesting broader topic

## Design System

Follows the PRD's design system exactly:

- **Aesthetic:** Bold, gamified, arcade meets trivia night. Maximalist, not minimal.
- **Colors:** Deep purple gradients, gold CTAs, green success, cyan active states, pink errors
- **Typography:** Bungee (display), Fredoka One (headings), Nunito (body), Space Mono (grid) via Google Fonts
- **Icons:** Lucide React. Dynamic categories use generic `Tag` icon (not hardcoded music icons)
- **Layout:** Mobile-first, full-screen immersive, centered vertical flow, rounded everything
- **Spacing:** 4px base unit, consistent Tailwind scale

### MVP Animations (prioritized)

- Selection highlight (cyan glow on dragged cells)
- Word-found flash (green highlight + word bank strikethrough)
- Life-lost shake (heart animation + brief screen flash)
- Button press tactile feel (scale down on active)

### Deferred Animations

- Confetti/sparkle on completion
- Grid cascade entrance (cells appear top-left to bottom-right)
- Staggered page-load fade-in
- Loading state letter shuffle

## UI Components (MVP)

| Component | Purpose |
|-----------|---------|
| Landing page (`page.tsx`) | Topic input, domain-spanning example chips, generate button |
| ConfigScreen | Dynamic category chips (from Haiku), difficulty cards, generate button |
| PuzzleGrid | Interactive word search grid with drag selection |
| WordBank | Words to find, grouped by dynamic categories, progress counter |
| GameBar | Difficulty badge, lives (3 hearts), timer (MM:SS) |
| PauseMenu | Resume, Quit Without Saving (no Save & Exit in MVP) |
| GameOverModal | Stats, unfound words revealed, Try Again / New Puzzle / New Topic |
| CompletionModal | Stats, fun fact, Play Again / New Topic / Make it Harder |

### Components NOT in MVP

- UsernamePrompt
- Score persistence / all-time best in GameBar
- Save & Exit in PauseMenu

## API

### `POST /api/generate`

**Step 1 — Category Suggestion (if no categories provided):**

Request: `{ "topic": "Italian cooking" }`
Response: `{ "categories": ["Dishes", "Ingredients", "Techniques", "Chefs", "Regions"] }`

**Step 2 — Puzzle Generation:**

Request:
```json
{
  "topic": "Italian cooking",
  "difficulty": "medium",
  "focusCategories": ["Dishes", "Ingredients", "Techniques"],
  "gridSize": 15
}
```

Response:
```json
{
  "title": "Italian Kitchen Word Search",
  "grid": [["P","A","S","T","A",...], ...],
  "words": [
    {
      "word": "RISOTTO",
      "clue": "Creamy rice dish from Northern Italy",
      "category": "Dishes",
      "difficulty": 1,
      "startRow": 3,
      "startCol": 0,
      "direction": "right"
    }
  ],
  "gridSize": 15,
  "funFact": "The word 'pasta' comes from the Italian for 'paste'.",
  "difficulty": "medium"
}
```

This could be one or two separate API routes. Implementation will determine the cleanest approach.

## Edge Cases

All edge cases from the PRD Section 16 apply. Key ones for MVP:

- **Empty/whitespace input:** Disable Generate button
- **Long input (>200 chars):** Truncate
- **Non-straight drag:** Snap to nearest 45-degree direction
- **Reverse word selection:** Count as valid find
- **Pointer leaves grid during drag:** Cancel selection, no life lost
- **Tab goes to background:** Pause timer via `visibilitychange`
- **Claude returns too few words:** Retry with broadened prompt (3 attempts max)
- **Words can't be placed in grid:** Skip unplaceable words, retry grid if >30% skipped

## Backlog (Phase 2+)

1. Prisma + PostgreSQL setup on Railway
2. Username system + availability checking
3. Score calculation and persistence
4. All-time best score display in game bar
5. Save/resume game flow (`/api/games`)
6. `/api/scores`, `/api/games`, `/api/users` routes
7. Confetti/sparkle completion animation
8. Grid cascade entrance animation
9. Staggered page-load animations
10. Keyboard accessibility (arrow keys on grid)
11. Screen reader support for word bank
12. Print/export mode
13. Leaderboards
14. Shareable puzzle links
