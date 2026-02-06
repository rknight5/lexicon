# Lexicon — Product Requirements Document

## 1. Overview

**Lexicon** is a web app that takes natural language descriptions of a user's interests and generates playable word puzzles from them. A user types something like "80s hair metal bands" and gets a word search puzzle filled with relevant artist names, songs, albums, and cultural references.

**V1 Scope:** Word search puzzles in the music domain. No user accounts. Generate and play immediately.

**Tech Stack:** Next.js (App Router), React, TypeScript, Tailwind CSS, Claude API (Anthropic SDK).

---

## 2. User Flow

```
[Landing Page] → User types interest in natural language
       ↓
[Config Screen] → User selects difficulty, focus areas, grid size
       ↓
[Loading State] → Claude API generates word list + metadata
       ↓
[Puzzle Screen] → Playable word search with word bank
       ↓
[Completion] → Stats shown, option to generate new puzzle or tweak topic
```

### Detailed Steps

1. **User arrives at landing page.** Clean, minimal UI. A single prominent text input with placeholder text like *"What are you into? Try '90s grunge' or 'classic jazz piano'"*. A "Generate Puzzle" button. A few example topic chips below the input that users can click: "80s Rock", "Jazz Legends", "K-Pop", "Classic Country", "Hip Hop Golden Era". If the user has a saved username (stored in localStorage), show a "Resume Saved Game" link.

2. **User submits their topic and sees the config screen.** This is a modal or second panel that appears after the user enters their topic. The topic displays at the top (editable, so they can refine it). The screen collects the following:

   **Disclaimer** (always visible at top of config screen, subtle but clear):
   *"Tip: Very niche topics might get broadened to include related artists, genres, or cultural references to ensure a great puzzle."*

   **Difficulty** (required, single select, default Medium):
   - *Easy* — 12×12 grid, 10-12 words, horizontal and vertical only, well-known terms
   - *Medium* — 15×15 grid, 15-18 words, all 8 directions, mix of well-known and moderate terms
   - *Hard* — 18×18 grid, 18-22 words, all 8 directions, includes deep cuts and obscure references

   **Focus Areas** (optional, multi-select chips, all selected by default):
   - Artists / Bands
   - Songs
   - Albums
   - Genres / Subgenres
   - Events / Venues
   - Instruments / Gear
   - Cultural Terms / Slang

   The user can deselect categories to narrow the puzzle content. For example, selecting only "Artists / Bands" for "80s hair metal" gives a puzzle of just band names.

   **A "Generate Puzzle" button** at the bottom of the config screen triggers generation.

   Design note: this screen should feel fast and lightweight — not like a form. Chips and toggles, not dropdowns. The user should be able to go from landing page to generation in under 5 seconds if they just accept defaults.

3. **Loading state.** Show a brief loading animation (1-3 seconds typical). Display the user's topic and selections back to them: *"Building a medium 80s hair metal word search..."*

4. **Puzzle renders.** The user sees:
   - **Game bar** pinned at the top of the puzzle screen (see Section 7.4 for full spec), displaying:
     - All-time best score for this game type + difficulty combo
     - Current difficulty badge
     - Lives: 3 heart icons (filled = remaining, empty = lost)
     - Timer: MM:SS, starts on first interaction
   - A grid with letters (size determined by difficulty)
   - A word bank listing all words to find, organized by the categories the user selected
   - A title generated from their input (e.g., "80s Hair Metal Word Search")
   - A pause/menu button that allows saving and exiting

5. **User plays.** Click/tap a starting letter, drag to the ending letter to select a word. Valid finds highlight permanently and strike through in the word bank. Words can be horizontal, vertical, or diagonal (forward and backward depending on difficulty).

   **Lives system:** The user starts with 3 lives. When they complete a drag and release on an invalid sequence (letters that don't match any remaining word in the word bank), they lose one life. A brief shake animation plays and one heart icon empties. Starting a drag but not completing it (e.g., releasing immediately on the same cell, or pointer leaving the grid) does NOT cost a life. Only a fully completed drag-and-release on 2+ cells that doesn't match a word counts as a miss.

   **Game Over (lives exhausted):** When all 3 lives are lost, the game ends immediately. Show a Game Over screen with: words found vs total, time elapsed, the remaining unfound words revealed on the grid (highlighted in a different color, e.g., red/orange), and action buttons: "Try Again" (same puzzle, reset lives and timer), "New Puzzle" (same config, new words), "New Topic" (back to landing page).

6. **Completion (all words found).** Show: time taken, total words found, lives remaining, score for this game, all-time best for this game type + difficulty, fun fact from Claude, and action buttons: "Play Again" (same config, new puzzle), "New Topic" (back to landing page), "Make it Harder" (same topic, bump difficulty up one level).

7. **Pause / Save / Exit.** At any point during gameplay, the user can tap a pause button (hamburger or ⏸ icon in the game bar). This pauses the timer and shows a menu with:
   - "Resume" — close menu, restart timer
   - "Save & Exit" — saves current game state and returns to landing page (requires username, see Section 8)
   - "Quit Without Saving" — returns to landing page, game is lost

---

## 3. Core Architecture

### 3.1 Project Structure

```
lexicon/
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Landing page with input
│   │   ├── puzzle/page.tsx          # Puzzle play screen
│   │   ├── layout.tsx               # Root layout
│   │   └── api/
│   │       ├── generate/route.ts    # API route for puzzle generation
│   │       ├── scores/route.ts      # API route for saving/retrieving scores
│   │       ├── games/route.ts       # API route for saving/loading game state
│   │       └── users/route.ts       # API route for username availability check
│   ├── components/
│   │   ├── TopicInput.tsx           # Natural language input component
│   │   ├── ConfigScreen.tsx         # Difficulty, focus areas, grid size selection
│   │   ├── PuzzleGrid.tsx           # Word search grid (interactive)
│   │   ├── WordBank.tsx             # List of words to find
│   │   ├── GameBar.tsx              # Top bar: score, difficulty, lives, timer
│   │   ├── PauseMenu.tsx           # Pause overlay: resume, save & exit, quit
│   │   ├── GameOverModal.tsx        # Game over (lives lost) screen
│   │   ├── CompletionModal.tsx      # Win screen with stats and actions
│   │   └── UsernamePrompt.tsx       # Simple username entry modal
│   ├── lib/
│   │   ├── claude.ts                # Claude API client and prompt logic
│   │   ├── puzzleGenerator.ts       # Word search grid generation algorithm
│   │   ├── scoring.ts               # Score calculation logic
│   │   ├── types.ts                 # Shared TypeScript types
│   │   ├── validation.ts            # Word list validation and filtering
│   │   └── db.ts                    # Prisma client singleton
│   └── styles/
│       └── globals.css              # Tailwind + any custom styles
├── prisma/
│   └── schema.prisma               # Database schema (source of truth)
├── .env.local                       # ANTHROPIC_API_KEY, DATABASE_URL
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

**Key dependencies:** `next`, `react`, `typescript`, `tailwindcss`, `@anthropic-ai/sdk`, `prisma`, `@prisma/client`

### 3.2 Data Flow

```
User Input (string) + Config (difficulty, focusAreas, gridSize)
    ↓
API Route (/api/generate)
    ↓
Claude API Call → Returns structured JSON:
    {
      title: string,
      words: [{ word: string, clue: string, category: string, difficulty: 1|2|3 }],
      funFact: string
    }
    ↓
Response Parsing & Sanitization (strip markdown fences, validate JSON shape)
    ↓
Validation & Filtering (remove spaces/special chars, check length, deduplicate, enforce word count)
    ↓
Puzzle Generator Algorithm (place words in grid, fill remaining cells)
    ↓
Client receives: { grid: string[][], words: WordEntry[], title: string, metadata: {...} }
```

### 3.3 Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Puzzle generation location | Server-side (API route) | Keeps Claude API key secure, single request returns playable puzzle |
| Grid generation | Custom algorithm in TypeScript | Well-understood problem, no need for external lib. Place words first, then fill with random letters |
| State management | React useState + useReducer | Simple enough for single-page puzzle state, no need for Redux/Zustand |
| Styling | Tailwind CSS | Fast to build, good defaults, responsive out of the box |
| Claude model | claude-sonnet-4-20250514 | Good balance of speed and quality for structured data generation. Haiku is faster but less reliable for nuanced topic knowledge |

---

## 4. Claude API Integration

### 4.1 Prompt Design

The API route sends a system prompt and user message to Claude. The system prompt instructs Claude to act as a word puzzle content generator specialized in music.

**System Prompt:**

```
You are a word puzzle content generator specializing in music knowledge. Given a user's music interest and their configuration preferences, generate a list of relevant words for a word search puzzle.

Rules:
- Generate the number of words specified in the config (default 15-20)
- Each word must be a SINGLE word (no spaces, no hyphens). For multi-word names, use the most recognizable single word (e.g., "Springsteen" not "Bruce Springsteen", "Thriller" not "Thriller Album")
- Words must be 3-12 letters long
- All words must be real, verifiable names, terms, or references
- Only include words from the requested focus categories
- Assign each word a difficulty: 1 (well-known), 2 (moderate), 3 (deep cut)
- Distribute difficulty based on the requested level:
  - Easy: mostly difficulty 1, a few 2s
  - Medium: mix of 1s, 2s, and a few 3s
  - Hard: heavy on 2s and 3s, fewer 1s
- Include a brief, interesting fun fact related to the topic

Respond with ONLY valid JSON in this exact format, with no markdown fences, no preamble, no explanation:
{
  "title": "A catchy title for the puzzle",
  "words": [
    { "word": "METALLICA", "clue": "Thrash metal pioneers from LA", "category": "artist", "difficulty": 1 },
    ...
  ],
  "funFact": "An interesting fact about the topic"
}
```

**User Message Construction:**

The API route builds the user message from the topic and config:

```
Topic: 80s hair metal
Difficulty: medium
Word count: 15-18
Focus categories: artists, songs, albums
```

### 4.2 Response Parsing & Sanitization

Claude's response must be parsed defensively. LLMs sometimes return JSON wrapped in markdown fences, include preamble text, or return subtly malformed structures. The parsing pipeline should handle all of these cases.

```typescript
// lib/claude.ts

function parseClaudeResponse(rawText: string): PuzzleContent {
  // Step 1: Strip markdown code fences if present
  let cleaned = rawText.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "");

  // Step 2: If there's preamble text before the JSON, find the first '{' 
  const jsonStart = cleaned.indexOf("{");
  if (jsonStart > 0) {
    cleaned = cleaned.slice(jsonStart);
  }

  // Step 3: Find the matching closing brace (handle potential trailing text)
  const jsonEnd = cleaned.lastIndexOf("}");
  if (jsonEnd >= 0) {
    cleaned = cleaned.slice(0, jsonEnd + 1);
  }

  // Step 4: Parse JSON
  const parsed = JSON.parse(cleaned);

  // Step 5: Validate shape — check required fields exist and have correct types
  if (!parsed.title || typeof parsed.title !== "string") {
    throw new Error("Missing or invalid 'title' field");
  }
  if (!Array.isArray(parsed.words) || parsed.words.length === 0) {
    throw new Error("Missing or empty 'words' array");
  }
  for (const word of parsed.words) {
    if (!word.word || !word.clue || !word.category || !word.difficulty) {
      throw new Error(`Invalid word entry: ${JSON.stringify(word)}`);
    }
  }

  return parsed as PuzzleContent;
}
```

### 4.3 Word Validation & Filtering

After parsing, the word list must be cleaned for puzzle compatibility:

```typescript
// lib/validation.ts

function validateAndFilterWords(
  words: WordEntry[],
  config: { minWords: number; maxWords: number; focusCategories: string[] }
): WordEntry[] {
  return words
    // Normalize: uppercase, strip anything non-alphabetical
    .map(w => ({ ...w, word: w.word.toUpperCase().replace(/[^A-Z]/g, "") }))
    // Remove words that are too short or too long after cleaning
    .filter(w => w.word.length >= 3 && w.word.length <= 12)
    // Remove duplicates (same word appearing twice)
    .filter((w, i, arr) => arr.findIndex(x => x.word === w.word) === i)
    // Filter to requested categories only
    .filter(w => config.focusCategories.includes(w.category))
    // Cap at max words
    .slice(0, config.maxWords);
}
```

### 4.4 Retry & Fallback Strategy

```
Attempt 1: Standard prompt with user's config
    ↓ If < minWords valid words after filtering
Attempt 2: Broadened prompt — "Include related genres, influences, and associated cultural terms"
    ↓ If still < minWords
Attempt 3: Further broadened — remove category restrictions, just generate music-related words for the era/genre
    ↓ If still < minWords (very unlikely at this point)
Return error to user: "We couldn't generate enough words for that topic. Try something broader?"
```

Maximum 3 API calls per generation request. Each retry modifies the prompt, not just re-sends the same one.

---

## 5. Word Search Generation Algorithm

### 5.1 Grid Generation

```typescript
// lib/puzzleGenerator.ts

interface PlacedWord {
  word: string;
  startRow: number;
  startCol: number;
  direction: Direction;
}

type Direction = "right" | "down" | "downRight" | "downLeft" | "left" | "up" | "upRight" | "upLeft";

function generateGrid(words: string[], gridSize: number = 15): {
  grid: string[][];
  placedWords: PlacedWord[];
} {
  // 1. Sort words by length (longest first — easier to place)
  // 2. For each word, attempt placement:
  //    a. Pick random direction from allowed directions
  //    b. Pick random starting position that fits
  //    c. Check for conflicts (occupied cell with different letter)
  //    d. If conflict, try next position/direction
  //    e. If all positions exhausted, skip word (track skipped words)
  // 3. Fill remaining empty cells with random letters
  //    - Weight letter frequency toward common English letters to avoid
  //      making the puzzle too easy (avoid lots of Q, X, Z)
  // 4. Return grid and placement data
}
```

### 5.2 Difficulty Scaling

| Setting | Grid Size | Word Count | Directions | Fill Letters |
|---------|-----------|------------|------------|--------------|
| Easy | 12×12 | 10-12 | Right, Down only | Common letters (weighted) |
| Medium (default) | 15×15 | 15-18 | All 8 directions | Common letters (weighted) |
| Hard | 18×18 | 18-22 | All 8 directions | Uniform random (more red herrings) |

Default to Medium. User can adjust via "Make it Harder" / "Make it Easier" buttons.

---

## 6. Design System

The visual identity is **bold, gamified, and playful** — inspired by casual mobile game UIs. Think arcade meets trivia night. The aesthetic leans maximalist: rich gradients, glowing accents, rounded shapes, and a sense of energy and reward. This is NOT a minimal productivity app — it should feel fun to look at and satisfying to interact with.

### 6.1 Color Palette

**Primary Gradient (backgrounds, headers, cards):**
```css
--purple-deep: #1A0A2E;       /* Darkest — used for depth, outer edges */
--purple-dark: #2D1B69;       /* Dark purple — primary card/section backgrounds */
--purple-mid: #5B2D8E;        /* Mid purple — gradient midpoint */
--purple-vibrant: #7B3FBF;    /* Vibrant purple — hover states, active areas */
--purple-light: #9D6CD2;      /* Light purple — secondary text, borders */
```

**Accent Colors (buttons, highlights, rewards):**
```css
--gold-primary: #FFD700;      /* Primary CTA buttons, scores, rewards */
--gold-dark: #E5A100;         /* Button pressed/hover state */
--gold-light: #FFF0A0;        /* Button text glow, subtle highlights */
--green-accent: #00E676;      /* Success states, correct answers, "found word" */
--green-dark: #00C853;        /* Green button borders */
--cyan-glow: #00E5FF;         /* Timer, active selection glow on grid */
--pink-accent: #FF4081;       /* Errors, incorrect selection flash */
```

**Neutral / UI:**
```css
--white: #FFFFFF;
--white-soft: rgba(255, 255, 255, 0.9);
--white-muted: rgba(255, 255, 255, 0.6);  /* Secondary text on dark bg */
--overlay-dark: rgba(26, 10, 46, 0.85);   /* Modal overlays */
```

**Usage Rules:**
- Backgrounds always use purple gradients (top-to-bottom or radial), never flat solid colors
- CTAs (primary buttons) are always gold (`--gold-primary`) with dark text
- Secondary buttons use green outline or filled green
- Success/found states use green
- Active/selected states use cyan glow
- Error states use pink flash (brief, not persistent)
- Text on dark backgrounds is white or `--white-muted` for secondary
- Text on light backgrounds (modals, cards) is `--purple-dark`

### 6.2 Typography

```css
/* Display / Logo — bubbly, bold, game-title feel */
--font-display: 'Bungee', 'Luckiest Guy', cursive;

/* Headings — clean but with personality */
--font-heading: 'Fredoka One', 'Nunito', sans-serif;

/* Body — highly readable, rounded, friendly */
--font-body: 'Nunito', 'Quicksand', sans-serif;

/* Grid letters — monospace, bold, clear at small sizes */
--font-grid: 'Space Mono', 'JetBrains Mono', monospace;
```

**Scale:**
| Element | Font | Size | Weight | Notes |
|---------|------|------|--------|-------|
| App logo "LEXICON" | Display | 48px+ | 800 | Uppercase, text-shadow glow, slight rotation/tilt |
| Section headers | Heading | 28-32px | 700 | e.g., "Leaderboard", puzzle title |
| Button labels | Heading | 18-20px | 700 | Uppercase, letter-spacing: 0.05em |
| Body text / clues | Body | 16px | 400-600 | |
| Word bank words | Body | 14-16px | 600 | Uppercase for unfound, strikethrough for found |
| Grid letters | Grid | 18-22px | 700 | Monospace ensures alignment |
| Chip/tag text | Body | 13-14px | 600 | Topic suggestion chips |

**Import via Google Fonts:**
```html
<link href="https://fonts.googleapis.com/css2?family=Bungee&family=Fredoka+One&family=Nunito:wght@400;600;700;800&family=Space+Mono:wght@700&display=swap" rel="stylesheet">
```

### 6.3 Component Styling Patterns

**Buttons (Primary / CTA):**
```css
/* Gold CTA — "Generate Puzzle", "Continue", "Play Again" */
.btn-primary {
  background: linear-gradient(180deg, #FFD700 0%, #E5A100 100%);
  color: #1A0A2E;
  font-family: var(--font-heading);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-radius: 50px;           /* Fully rounded / pill shape */
  padding: 16px 40px;
  border: 3px solid #E5A100;
  box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3);
  transition: transform 0.1s, box-shadow 0.1s;
}
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 215, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3);
}
.btn-primary:active {
  transform: translateY(1px);
}
```

**Buttons (Secondary):**
```css
/* Green outline — "Multiplayer", secondary actions */
.btn-secondary {
  background: transparent;
  color: #00E676;
  border: 3px solid #00E676;
  border-radius: 50px;
  padding: 14px 36px;
  font-family: var(--font-heading);
  font-weight: 700;
  text-transform: uppercase;
}
```

**Cards / Panels:**
```css
.card {
  background: linear-gradient(135deg, #2D1B69 0%, #5B2D8E 100%);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  padding: 24px;
}
```

**Input Fields:**
```css
.input-field {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 16px 20px;
  color: white;
  font-family: var(--font-body);
  font-size: 16px;
  backdrop-filter: blur(10px);
}
.input-field:focus {
  border-color: var(--gold-primary);
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.2);
  outline: none;
}
```

**Topic Chips:**
```css
.chip {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50px;
  padding: 8px 20px;
  color: var(--white-muted);
  font-family: var(--font-body);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.chip:hover {
  background: rgba(255, 215, 0, 0.15);
  border-color: var(--gold-primary);
  color: var(--gold-light);
}
```

### 6.4 Visual Effects & Atmosphere

**Background Treatment:**
- All screens use a full-bleed gradient background: `linear-gradient(180deg, #2D1B69 0%, #1A0A2E 100%)`
- Add subtle floating elements for atmosphere: faint question marks, letter shapes, or sparkle particles (CSS animation, low opacity)
- Consider a subtle noise/grain texture overlay at 2-5% opacity for depth

**Glow Effects:**
- Active/selected puzzle cells: `box-shadow: 0 0 12px rgba(0, 229, 255, 0.6)` (cyan glow)
- Found word highlight: `background: rgba(0, 230, 118, 0.25)` with subtle green glow
- Logo and headings: `text-shadow: 0 0 20px rgba(123, 63, 191, 0.5)`
- Gold buttons always have a warm glow: `box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4)`

**Animations:**
- **Page load:** Staggered fade-in-up for elements (logo → tagline → input → chips). 100ms delays between each.
- **Puzzle grid appear:** Grid cells cascade in from top-left to bottom-right, 10ms stagger per cell.
- **Word found:** Cells flash bright green, then settle to a permanent green highlight. The word in the word bank gets a satisfying strikethrough animation.
- **Completion:** Confetti burst or sparkle explosion. Stats count up numerically (animated number).
- **Button press:** Scale down slightly on `:active` (tactile "press" feel).
- **Loading:** Pulsing purple orb or animated letters spelling "LEXICON" that shuffle.

**Sparkle/Star Decorations:**
- Small ✦ star/sparkle icons scattered near headers and the logo (as in the reference). Use CSS `::before` / `::after` pseudo-elements with absolute positioning. Subtle scale/opacity animation on loop.

### 6.5 Puzzle Grid Specific Styling

```css
.puzzle-grid {
  display: grid;
  gap: 2px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 16px;
  padding: 8px;
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.grid-cell {
  width: 100%;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  font-family: var(--font-grid);
  font-size: 18px;
  font-weight: 700;
  color: white;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s, transform 0.1s;
}

.grid-cell:hover {
  background: rgba(255, 255, 255, 0.15);
}

.grid-cell--selecting {
  background: rgba(0, 229, 255, 0.3);
  box-shadow: 0 0 8px rgba(0, 229, 255, 0.4);
  transform: scale(1.05);
}

.grid-cell--found {
  background: rgba(0, 230, 118, 0.25);
  color: #00E676;
}
```

### 6.6 Layout Principles

- **Mobile-first** — the reference images are mobile screens. Design for 375px width first.
- **Full-screen immersive** — no visible browser chrome feel. The gradient background fills the entire viewport.
- **Centered, vertical flow** — content stacks vertically, centered horizontally. Max content width of ~480px on mobile, ~600px for puzzle grid on desktop.
- **Rounded everything** — border-radius minimum 12px on cards, 50px on buttons/chips, 6px on grid cells. No sharp corners anywhere.
- **Z-depth hierarchy** — use layered shadows and slight overlaps (like the reference's card overlap) to create depth. Foreground elements cast shadows on background.

### 6.7 Spacing System

Use a consistent 4px base unit. All spacing values should be multiples of 4. This keeps everything aligned and prevents the "slightly off" look that AI-generated code tends to produce.

**Spacing scale (Tailwind classes):**

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| xs | 4px | `p-1`, `gap-1` | Between icon and its label, tight inline elements |
| sm | 8px | `p-2`, `gap-2` | Between related items in a group (e.g., chips in a row) |
| md | 12px | `p-3`, `gap-3` | Padding inside small components (chips, badges) |
| base | 16px | `p-4`, `gap-4` | Default padding inside cards, between form fields |
| lg | 20px | `p-5`, `gap-5` | Horizontal page padding on mobile (minimum) |
| xl | 24px | `p-6`, `gap-6` | Between major sections within a screen |
| 2xl | 32px | `p-8`, `gap-8` | Between distinct content blocks (e.g., input area and chips row) |
| 3xl | 48px | `p-12`, `gap-12` | Top/bottom page margins, large section gaps |

**Specific spacing rules:**

**Page-level:**
- Horizontal padding: 20px on mobile (`px-5`), 32px on tablet+  (`px-8`)
- Top padding from viewport: 48px (`pt-12`) on landing page, 0px on puzzle page (game bar is flush to top)
- Between major sections (e.g., logo → input → chips): 32px (`gap-8`)

**Game Bar:**
- Height: 56px (`h-14`)
- Horizontal padding: 16px (`px-4`)
- Items within the bar are spaced with `justify-between` (score left, difficulty center, lives+timer right)
- Gap between lives hearts: 6px (`gap-1.5`)
- Gap between hearts group and timer: 16px (`gap-4`)
- Icon-to-text gap within a game bar item: 6px (`gap-1.5`)
- Vertical centering: all items `items-center`

**Cards and modals:**
- Internal padding: 24px (`p-6`)
- Gap between elements inside a card: 16px (`gap-4`)
- Between title and description text: 8px (`gap-2`)

**Config screen:**
- Gap between difficulty cards: 12px (`gap-3`)
- Gap between focus area chips: 8px (`gap-2`) horizontally, 8px vertically when wrapping
- Section label to controls gap: 12px (`gap-3`)
- Between sections (Difficulty → Focus Areas → Button): 24px (`gap-6`)

**Puzzle grid:**
- Grid gap between cells: 2px (`gap-0.5`)
- Grid container padding: 8px (`p-2`)
- Gap between grid and word bank: 24px on mobile (stacked), 32px on desktop (side by side)

**Word bank:**
- Between word entries: 8px (`gap-2`)
- Between category headers and their words: 8px
- Inside each word entry (word text to clue text): 4px (`gap-1`)
- Category header top margin: 16px (`mt-4`) except first

**Buttons:**
- Internal padding: 12px vertical, 24px horizontal (`py-3 px-6`) for primary buttons
- Internal padding: 8px vertical, 16px horizontal (`py-2 px-4`) for secondary/smaller buttons
- Gap between icon and button text: 8px (`gap-2`)
- Between stacked action buttons (e.g., in completion modal): 12px (`gap-3`)

### 6.8 Iconography

Use **Lucide React** for all icons. Prefer filled/solid variants where available. Consistent sizing is critical — mismatched icon sizes next to text is one of the most common visual bugs.

**Icon sizing rules:**

| Context | Size | Tailwind | Notes |
|---------|------|----------|-------|
| Inline with body text | 16px | `w-4 h-4` | Game bar labels, word bank entries |
| Inline with heading text | 20px | `w-5 h-5` | Section headers, card titles |
| Standalone / button icon | 24px | `w-6 h-6` | Pause button, nav actions |
| Decorative / feature | 32px | `w-8 h-8` | Completion modal icons, empty states |

**Vertical alignment:** Always use `inline-flex items-center` on the parent container when placing an icon next to text. Never rely on default `inline` alignment — icons will sit too high or too low.

**Specific icon assignments:**

| Element | Icon | Lucide name | Notes |
|---------|------|-------------|-------|
| Lives (remaining) | Filled heart | `Heart` with `fill="currentColor"` | Red/pink (`text-red-400`) |
| Lives (lost) | Empty heart | `Heart` without fill | Gray (`text-gray-600`) |
| Timer | Clock | `Clock` | Muted white, 16px |
| Difficulty (Easy) | Shield | `Shield` | Green badge |
| Difficulty (Medium) | Flame | `Flame` | Gold badge |
| Difficulty (Hard) | Skull | `Skull` | Red badge |
| Pause | Pause circle | `PauseCircle` | 24px, top-right of game bar |
| Best score | Trophy | `Trophy` | Gold, 16px, left section of game bar |
| Back/return | Arrow left | `ArrowLeft` | 24px |
| Search/generate | Sparkles | `Sparkles` | On the Generate button |
| Category: Artists | Music | `Music` | Chip and word bank header |
| Category: Songs | Mic | `Mic2` | Chip and word bank header |
| Category: Albums | Disc | `Disc3` | Chip and word bank header |
| Category: Genres | Radio | `Radio` | Chip and word bank header |
| Category: Events | MapPin | `MapPin` | Chip and word bank header |
| Category: Instruments | Guitar | `Guitar` | Chip and word bank header |
| Category: Cultural | Hash | `Hash` | Chip and word bank header |
| Word found (checkmark) | Check circle | `CheckCircle` | Green, in word bank next to found words |
| Close/dismiss | X | `X` | Modal close buttons |

### 6.9 Interactive Element Specs

**Chips (focus area toggles):**
- Height: 36px
- Padding: 8px vertical, 16px horizontal (`py-2 px-4`)
- Icon (16px) + 6px gap + text
- Border-radius: 50px (full pill)
- Unselected: transparent bg, 1px border `rgba(255,255,255,0.2)`, muted text
- Selected: `rgba(255, 215, 0, 0.15)` bg, gold border, bright text
- Hover: slight bg lift
- Transition: `all 0.15s ease`
- Touch target: minimum 44px (add invisible padding if visual height is less)

**Difficulty cards (config screen):**
- Width: equal thirds of container (flex with `gap-3`)
- Padding: 16px (`p-4`)
- Contain: icon (24px) → title (bold, 14px) → description (12px, muted)
- Gap between internal elements: 8px
- Unselected: glassmorphic bg, subtle border
- Selected: brighter bg, gold border, slight scale up (`scale-[1.02]`)
- Border-radius: 16px

**Dropdown / select behavior:**
- The config screen does NOT use traditional HTML `<select>` dropdowns. Everything is chips and tappable cards.
- If any future component needs a dropdown: use a custom-styled listbox with `position: absolute`, matching the glassmorphic style. Never use native browser selects — they break the visual design.
- Dropdown items: 44px min height (touch target), 16px horizontal padding, 12px vertical padding
- Dropdown container: same glassmorphic bg as cards, 12px border-radius, subtle shadow `0 8px 32px rgba(0,0,0,0.3)`

**Text inputs:**
- Height: 52px on landing page (prominent), 44px elsewhere
- Padding: 12px vertical, 16px horizontal (`py-3 px-4`)
- Font size: 16px (prevents iOS zoom on focus)
- Border-radius: 12px
- Background: `rgba(255, 255, 255, 0.08)` (glassmorphic)
- Border: 1px `rgba(255, 255, 255, 0.15)`, focus: gold glow
- Placeholder text: `rgba(255, 255, 255, 0.4)`

**Primary button (Generate Puzzle, etc.):**
- Height: 48px
- Padding: 12px vertical, 32px horizontal
- Font: 14px, bold, uppercase, letter-spacing 1px
- Border-radius: 50px (full pill)
- Background: gold gradient
- Shadow: `0 4px 15px rgba(255, 215, 0, 0.4)`
- Hover: brighten, lift shadow
- Active/press: `scale(0.97)`, shadow reduces
- Disabled: opacity 0.5, no hover effects, cursor `not-allowed`

---

## 7. UI Components

### 7.1 Landing Page (`page.tsx`)

- Full-screen purple gradient background with subtle floating decorative elements
- "LEXICON" logo in display font, centered, with glow effect and sparkle decorations
- Tagline below: *"Turn your interests into word puzzles"* in heading font, `--white-muted`
- Large glassmorphic text input with gold focus glow
- Gold pill-shaped "GENERATE PUZZLE" CTA button below input
- Row of topic suggestion chips: "80s Rock", "Jazz Legends", "K-Pop", "Classic Country", "Hip Hop Golden Era"
- Staggered entrance animation on page load

### 7.2 Config Screen (`ConfigScreen.tsx`)

Appears as a modal or slide-in panel after the user submits their topic from the landing page.

**Layout:**
- Topic displayed at top in an editable text field (pre-filled from landing page input)
- Difficulty: three large, tappable cards (Easy / Medium / Hard) using the glassmorphic card style, with brief descriptions of what each means for the player. Medium is pre-selected.
- Focus Areas: horizontal wrapping row of toggle chips using the `.chip` style. All selected by default. Chips: Artists/Bands, Songs, Albums, Genres/Subgenres, Events/Venues, Instruments/Gear, Cultural Terms/Slang
- Gold "Generate Puzzle" primary button at the bottom
- "Back" link to return to landing page

**Behavior:**
- At least one focus area must be selected. If the user deselects all, show a gentle inline message: *"Select at least one category"* and disable the Generate button.
- Difficulty selection maps directly to grid size and word count — the user doesn't need to think about numbers.
- The config screen should feel fast and lightweight. A user accepting all defaults should be able to tap "Generate Puzzle" immediately.
- **Topic disclaimer:** Display a subtle note below the topic field: *"Tip: If your topic is very niche, we may broaden it to include related artists, genres, or eras to build a great puzzle."* Style this as muted text (`--white-muted`, small font). This sets expectations before generation so users aren't surprised.

### 7.3 Game Bar (`GameBar.tsx`)

Pinned to the top of the puzzle screen. Always visible during gameplay. Compact single-row layout.

**Left section:** All-time best score for this game type + difficulty. Format: "Best: 3,200" or "Best: —" if no prior scores.

**Center section:** Difficulty badge (colored pill: green for Easy, gold for Medium, red for Hard).

**Right section:** Lives display (3 heart icons, filled/empty) and timer (MM:SS).

**Behavior:**
- Timer starts on the user's first interaction with the grid (not on page load).
- When a life is lost: the corresponding heart animates (shrinks, turns gray/empty, brief shake). A subtle screen flash or border pulse reinforces the penalty.
- When timer is paused (pause menu open), the timer text pulses or dims to indicate paused state.
- On mobile, the game bar should be compact enough to not eat into grid space. Use small text and tight spacing.

### 7.4 Pause Menu (`PauseMenu.tsx`)

A semi-transparent overlay that appears when the user taps the pause button in the game bar.

- "Resume" — primary action, prominent button
- "Save & Exit" — triggers the UsernamePrompt if no username is set, then saves game state via `/api/games` and navigates to the landing page
- "Quit Without Saving" — confirmation dialog ("Are you sure? Your progress will be lost."), then navigates to landing page
- Timer is paused while this menu is open
- The puzzle grid is blurred or dimmed behind the overlay to prevent peeking

### 7.5 Game Over Modal (`GameOverModal.tsx`)

Shown when all 3 lives are lost.

- Large "Game Over" heading
- Stats: words found / total, time elapsed, score earned
- The puzzle grid behind should reveal all unfound words highlighted in red/orange
- Action buttons: "Try Again" (reset lives/timer, same puzzle), "New Puzzle" (same config), "New Topic" (landing page)

### 7.6 Username Prompt (`UsernamePrompt.tsx`)

A small modal that appears when the user needs a username (first save, first completion).

- Text: *"Pick a username to save your progress and track your scores"*
- Single text input, 3-20 chars, alphanumeric + underscores
- Real-time availability check (debounced, calls a simple API endpoint)
- "Save" button (disabled until valid + available)
- "Skip" link (plays without persistence, scores won't be tracked)
- Small note: *"Remember your username — you'll need it to access your saves on other devices."*

### 7.7 Puzzle Grid (`PuzzleGrid.tsx`)

This is the most complex component.

**State:**
- `grid: string[][]` — the letter grid
- `selectedCells: {row: number, col: number}[]` — currently being dragged over
- `foundWords: string[]` — successfully found words
- `foundPaths: {row: number, col: number}[][]` — highlight paths for found words

**Interaction:**
- Mouse/touch: press on a cell to start selection, drag in a straight line (horizontal, vertical, diagonal), release to check
- Constrain selection to valid straight lines only (snap to nearest valid direction)
- On release: check if selected letters form a word in the word bank
  - If yes: permanently highlight those cells (distinct color per word or consistent highlight color), mark word as found in word bank
  - If no: clear selection, brief shake animation

**Visual Design:**
- Grid cells are square, sized to fit the viewport (responsive)
- Each cell shows a single uppercase letter
- Unselected cells: white background, dark text
- Currently selecting: light blue background
- Found words: colored highlight (semi-transparent overlay so letters remain readable)
- Grid lines: subtle, light gray

### 7.8 Word Bank (`WordBank.tsx`)

- Displays all words to find, grouped by category (Artists, Songs, Albums, etc.)
- Each word shows: the word itself, and its clue in smaller text below
- Found words get a strikethrough and fade slightly
- Progress indicator: "8 / 15 words found"
- On mobile: collapsible panel below the grid

### 7.9 Puzzle Header (`PuzzleHeader.tsx`)

- Puzzle title (generated by Claude)
- Timer: MM:SS format, starts on first interaction
- Difficulty badge: Easy / Medium / Hard
- "New Puzzle" button (goes back to input)

### 7.10 Completion Modal (`CompletionModal.tsx`)

- Triggered when all words are found
- Shows: completion time, total words, fun fact from Claude
- Action buttons:
  - "Play Again" — regenerate with same topic (new word selection, new grid)
  - "New Topic" — back to landing page
  - "Make it Harder" — same topic, harder difficulty

---

## 8. API Routes

### `POST /api/generate`

**Request Body:**
```json
{
  "topic": "80s hair metal",
  "difficulty": "medium",
  "focusCategories": ["artist", "song", "album"],
  "gridSize": 15
}
```

**Response Body:**
```json
{
  "title": "Hair Metal Mayhem",
  "grid": [["M","E","T","A",...], ...],
  "words": [
    {
      "word": "METALLICA",
      "clue": "Thrash metal pioneers",
      "category": "artist",
      "difficulty": 1,
      "startRow": 3,
      "startCol": 0,
      "direction": "right"
    },
    ...
  ],
  "gridSize": 15,
  "funFact": "Mötley Crüe's 'Dr. Feelgood' was the last #1 album of the 1980s.",
  "difficulty": "medium"
}
```

The API route handles: calling Claude, validating/filtering words, running the grid generator, and returning the complete puzzle state. The client does NOT need to know about the Claude API — it just receives a playable puzzle.

### `POST /api/scores`

Save a completed game score.

**Request Body:**
```json
{
  "username": "rockfan42",
  "gameType": "wordsearch",
  "difficulty": "medium",
  "score": 2850,
  "wordsFound": 15,
  "wordsTotal": 18,
  "livesRemaining": 2,
  "timeSeconds": 134,
  "topic": "80s hair metal"
}
```

### `GET /api/scores?username=rockfan42&gameType=wordsearch&difficulty=medium`

Returns the user's all-time best score for that game type + difficulty combo, plus their recent scores.

**Response Body:**
```json
{
  "allTimeBest": 3200,
  "recentScores": [
    { "score": 2850, "topic": "80s hair metal", "date": "2026-02-05T..." },
    { "score": 3200, "topic": "grunge", "date": "2026-02-04T..." }
  ]
}
```

### `POST /api/games`

Save an in-progress game for later resumption.

**Request Body:**
```json
{
  "username": "rockfan42",
  "gameState": {
    "grid": [["M","E","T","A",...], ...],
    "words": [...],
    "foundWords": ["METALLICA", "RATT"],
    "livesRemaining": 2,
    "elapsedSeconds": 67,
    "title": "Hair Metal Mayhem",
    "difficulty": "medium",
    "topic": "80s hair metal",
    "config": { "focusCategories": ["artist", "song", "album"] }
  }
}
```

### `GET /api/games?username=rockfan42`

Returns the user's saved games (max 5 saved games at a time).

### `DELETE /api/games/:id`

Deletes a saved game (after resumption or manual deletion).

---

## 9. Persistence & User Identity

### 9.1 Username System

No passwords, no email, no OAuth. Just a unique username string, similar to the Waypoint approach.

**How it works:**
- On first visit, the user plays without a username. Everything works except saving games and tracking all-time scores.
- When the user first tries to save a game or when they complete their first puzzle, prompt them: *"Pick a username to save your progress and track your scores"*. Show the `UsernamePrompt` modal.
- Username rules: 3-20 characters, alphanumeric + underscores only. Must be unique. Check availability on blur/submit.
- Once set, the username is stored in `localStorage` and sent as a header or parameter with API requests.
- If the user returns and their username is in localStorage, greet them: *"Welcome back, rockfan42"* and show their saved games and best scores.
- If localStorage is cleared (new device, cleared cache), the user can "reclaim" their username by simply entering it again. There's no password, so anyone can claim any username — this is acceptable for a side project. Add a note on the prompt: *"Remember your username — you'll need it to access your saves on other devices."*

### 9.2 Database Schema

Three tables (defined via Prisma — see Section 9.3 for the full schema):

**users** — just a username and created_at. Exists to reserve usernames and check availability.

**scores** — one row per completed game. Stores username, game type, difficulty, score, words found/total, lives remaining, time, topic, and timestamp. Indexed on (username, game_type, difficulty) for fast best-score lookups.

**saved_games** — one row per saved in-progress game. Stores the full game state as a JSON text blob (grid, words, found words, lives, elapsed time, config). Max 5 per user (enforced in application logic, not DB constraint). Indexed on username.

### 9.3 Database Choice

**PostgreSQL** hosted on **Railway**, deployed via Railway with initial testing through a **Cloudflare tunnel** to minimize setup.

Use **Prisma** as the ORM — it works well with Next.js, has strong TypeScript support, and makes the schema easy to evolve. The schema above translates directly to a Prisma schema.

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Score {
  id             String   @id @default(uuid())
  username       String
  gameType       String   @map("game_type")
  difficulty     String
  score          Int
  wordsFound     Int      @map("words_found")
  wordsTotal     Int      @map("words_total")
  livesRemaining Int      @map("lives_remaining")
  timeSeconds    Int      @map("time_seconds")
  topic          String
  createdAt      DateTime @default(now()) @map("created_at")

  @@index([username, gameType, difficulty])
  @@map("scores")
}

model SavedGame {
  id        String   @id @default(uuid())
  username  String
  gameState String   @map("game_state") @db.Text  // JSON blob
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@index([username])
  @@map("saved_games")
}

model User {
  username  String   @id
  createdAt DateTime @default(now()) @map("created_at")

  @@map("users")
}
```

**Local development:** Connect to the Railway PostgreSQL instance through a Cloudflare tunnel. This avoids needing a local database setup entirely — just point `DATABASE_URL` at the tunneled Railway instance.

### 9.4 Prisma Setup Guide (for Claude Code)

Prisma is the ORM for this project. Here is the complete setup and usage pattern.

**Initial setup:**
```bash
npm install prisma @prisma/client
npx prisma init
```
This creates `prisma/schema.prisma` and adds `DATABASE_URL` to `.env`. Replace the generated schema with the one above.

**Sync schema to database:**
```bash
npx prisma db push        # Quick sync (good for prototyping, no migration files)
# OR
npx prisma migrate dev    # Creates migration files (better for production)
```

**Generate the TypeScript client:**
```bash
npx prisma generate
```
This must be run after every schema change. It generates typed client code in `node_modules/@prisma/client`.

**CRITICAL: Prisma client singleton for Next.js.**
Next.js hot-reloads in development, which creates new Prisma client instances on every reload and exhausts the database connection pool. The `db.ts` file MUST use the singleton pattern:

```typescript
// lib/db.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

**Usage in API routes:**
```typescript
// Example: app/api/scores/route.ts
import { prisma } from "@/lib/db";

// Get best score
const best = await prisma.score.findFirst({
  where: { username, gameType, difficulty },
  orderBy: { score: "desc" },
});

// Save a score
await prisma.score.create({
  data: { username, gameType, difficulty, score, wordsFound, wordsTotal, livesRemaining, timeSeconds, topic },
});

// Check username availability
const exists = await prisma.user.findUnique({ where: { username } });

// Save a game (enforce max 5)
const count = await prisma.savedGame.count({ where: { username } });
if (count >= 5) {
  // Delete the oldest saved game before saving new one
  const oldest = await prisma.savedGame.findFirst({
    where: { username },
    orderBy: { updatedAt: "asc" },
  });
  if (oldest) await prisma.savedGame.delete({ where: { id: oldest.id } });
}
await prisma.savedGame.create({
  data: { username, gameState: JSON.stringify(gameState) },
});
```

**Common gotchas:**
- Always `JSON.stringify()` when writing to the `gameState` field and `JSON.parse()` when reading it back
- The `@updatedAt` decorator on SavedGame auto-updates the timestamp on every write — no manual update needed
- If you see "too many clients" errors in dev, the singleton pattern above isn't working — check the import path
- Run `npx prisma generate` after any schema change or the TypeScript types will be stale

---

## 10. Scoring System

### 10.1 Score Calculation

Score is calculated on game completion (all words found or game over):

```
Base points per word found:
  - Easy word (difficulty 1):    100 points
  - Medium word (difficulty 2):  200 points
  - Hard word (difficulty 3):    350 points

Multipliers:
  - Lives remaining bonus:  livesRemaining × 200 points
  - Time bonus:             max(0, (targetTime - actualTime)) × 2 points
    where targetTime = wordCount × 15 seconds (easy), 12 seconds (medium), 10 seconds (hard)
  - Perfect game bonus:     +500 if all words found with 3 lives remaining

Final score = sum(word points) + lives bonus + time bonus + perfect bonus
```

### 10.2 All-Time Best Display

The game bar shows the all-time best score for the current **game type + difficulty** combination (not per-topic). This gives users a persistent target to beat across different topics at the same difficulty. If the user has no username yet or no prior scores, show "—" for the best score.

---

## 11. Responsive Design

| Breakpoint | Layout |
|------------|--------|
| Mobile (<640px) | Grid stacked above word bank. Grid cells ~24px. Word bank collapsible. |
| Tablet (640-1024px) | Grid left, word bank right in narrow sidebar. Grid cells ~32px. |
| Desktop (>1024px) | Grid centered-left, word bank right. Grid cells ~40px. Comfortable spacing. |

Touch support is critical — most casual puzzle players are on mobile.

---

## 12. Non-Functional Requirements

- **Performance:** Puzzle generation should complete in under 3 seconds (Claude API latency + grid generation). Grid interaction must feel instant (<16ms frame time).
- **Accessibility:** Keyboard navigation for grid (arrow keys to move, Enter to select/deselect). Screen reader support for word bank. Sufficient color contrast for highlights.
- **Error resilience:** Graceful handling of Claude API failures. Retry logic. Never show raw error messages to users.

---

## 13. Environment Variables

```
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=postgresql://user:password@host:port/dbname   # Railway PostgreSQL connection string
```

For local dev with Cloudflare tunnel, `DATABASE_URL` points to the tunneled Railway instance. In production on Railway, it's injected automatically as a Railway service variable.

---

## 14. Future Expansion (Post-V1)

These are explicitly **out of scope** for v1 but inform architecture decisions:

- **Crossword puzzles** — requires clue/answer pairs (Claude already generates clues), plus a crossword grid layout algorithm (significantly more complex than word search)
- **Other puzzle types** — anagrams, fill-in-the-blank, scrambled words, trivia quizzes
- **Domains beyond music** — movies, sports, history, science, food. The Claude prompt is the only thing that needs to change; the puzzle engine is domain-agnostic
- **Full auth system** — v1 uses simple usernames. Future: email/password or OAuth for proper account security
- **Leaderboards** — global leaderboards per game type + difficulty, weekly/monthly rankings
- **Sharing** — generate a shareable link or image of a completed puzzle
- **Print mode** — PDF export of puzzles for offline use
- **Difficulty auto-calibration** — track how fast users solve and adjust
- **Pre-built topic database** — index MusicBrainz, Discogs, or Spotify data for verified word lists. Use Claude as a fallback for niche topics. This improves accuracy and reduces API costs for popular topics.

---

## 15. Development Phases

### Phase 1: Core Engine (Day 1-2)
- Set up Next.js project with TypeScript and Tailwind
- Implement Claude API integration (`lib/claude.ts`) with robust response parsing
- Build word search grid generator (`lib/puzzleGenerator.ts`)
- Create the `/api/generate` route
- Test with hardcoded topics

### Phase 2: UI — Grid & Gameplay (Day 2-3)
- Build the PuzzleGrid component with click/drag interaction (build this standalone first, test thoroughly)
- Build word bank component
- Implement lives system (3 lives, invalid submission detection)
- Build GameBar with timer, lives, difficulty display
- Wire up API calls and loading states

### Phase 3: Config & Flow (Day 3-4)
- Build landing page with topic input and example chips
- Build ConfigScreen with difficulty, focus areas, disclaimer
- Build completion modal and game over modal
- Build pause menu with resume/save/quit flow
- Basic responsive layout

### Phase 4: Persistence (Day 4-5)
- Set up database (Turso, Vercel KV, or SQLite depending on deployment)
- Implement username prompt and localStorage caching
- Build `/api/scores` and `/api/games` routes
- Wire up all-time best score display in GameBar
- Implement save & resume game flow
- Scoring calculation logic

### Phase 5: Polish & Deploy (Day 5-6)
- Animations (word found, life lost, completion celebration, grid cascade)
- Error handling and all edge cases from Section 16
- Mobile touch optimization (touch-action, pointer events)
- Test with variety of topics (niche genres, non-English, ambiguous)
- Deploy to Vercel
- Smoke test on mobile devices

---

## 16. Edge Cases & Input Handling

These are scenarios Claude Code should handle explicitly. Don't leave these to chance.

### 16.1 Topic Input Edge Cases

| Input | Behavior |
|-------|----------|
| Empty string or whitespace only | Disable Generate button. Show inline hint: *"Type a topic to get started"* |
| Very short input (1-2 characters) | Allow it — Claude can interpret "DJ" or "UK" as music topics. Let the API handle it. |
| Very long input (>200 characters) | Truncate at 200 chars. Most users won't hit this, but paste could. |
| Non-music topic ("Italian cooking") | Allow it. V1 focuses on music but the system prompt will attempt to generate relevant content regardless. If Claude can't find enough music-related words, the retry strategy broadens the scope. |
| Nonsensical input ("asdfghjkl") | Let Claude attempt it. It will likely return a helpful error or tangentially related words. If parsing fails after retries, show: *"We couldn't generate a puzzle for that. Try a music topic like '90s hip hop' or 'classical piano'"* |
| Offensive/inappropriate input | Claude's safety filters handle this automatically. If the API returns an error or refusal, show a generic *"Couldn't generate a puzzle for that topic. Try something else?"* message. Don't echo the offensive input back. |
| Non-English input ("musique française") | Allow it. Claude handles multilingual input well. The generated words should still be in English (the system prompt asks for this implicitly). |
| Topic with special characters ("AC/DC", "Guns N' Roses") | Allow it — these are valid music topics. The topic string is only used in the Claude prompt, not in the grid. Claude will extract puzzle-safe words like "ACDC" or "GUNNERS". |

### 16.2 Puzzle Generation Edge Cases

| Scenario | Handling |
|----------|----------|
| Claude returns fewer than minWords after filtering | Trigger retry with broadened prompt (see Section 4.4). After 3 attempts, show error with suggestion to broaden topic. |
| Claude returns words that are all the same length | Valid but suboptimal. The grid generator should still handle it. No special action needed. |
| Claude returns duplicate words with different clues | Deduplication keeps the first occurrence. |
| A word can't be placed in the grid after 100 attempts | Skip it. Log it. If more than 30% of words are skipped, regenerate the entire grid with a larger size or fewer words. |
| All words are very long (>10 chars) and grid is small | This shouldn't happen often since the prompt asks for 3-12 chars, but if placement fails, increase grid size by 2 in each dimension and retry. |
| User selects only one focus category and the topic is narrow | Claude might struggle to find enough words. E.g., "Instruments" + "80s pop" might yield only 5-6 valid words. If the validated word count is below minimum after the first attempt, the retry should suggest Claude include related categories. |

### 16.3 Gameplay Edge Cases

| Scenario | Handling |
|----------|----------|
| User drags in a non-straight line | Snap to the nearest valid 8-direction line from the starting cell. Calculate angle from start cell to current pointer position, round to nearest 45°, constrain selection to that line. |
| User finds a valid word that wasn't in the word bank (coincidental letter sequence) | Ignore it. Only words in the word bank count. No feedback needed for accidental matches. |
| User selects letters in the reverse direction of how a word was placed | This should count as a valid find. When checking selection, compare against both forward and reverse of each remaining word. |
| User's pointer/finger goes off the grid during a drag | Cancel the current selection. Clear highlighting. |
| User on a touch device accidentally scrolls instead of dragging on the grid | Use `touch-action: none` on the grid container to prevent scroll during puzzle interaction. Provide a way to scroll the page outside the grid area. |
| Browser tab goes to background during a timed game | Pause the timer when the tab is hidden (`document.visibilitychange` event). Resume when visible. |

---

## 17. Key Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Claude generates inaccurate words (hallucinated artist names, wrong spellings) | Broken puzzles, bad UX | Prompt engineering to emphasize accuracy. Post-v1: validate against music databases |
| Claude returns words with spaces or special characters | Grid generation fails | Aggressive filtering in validation layer. Strip non-alpha characters. |
| Grid generation fails to place all words | Incomplete puzzle | Allow partial placement (minimum 10 words). Retry with smaller word set. Inform user if some words were dropped. |
| API latency makes generation feel slow | User abandonment | Streaming not useful here (need full response). Use engaging loading animation. Target <3s. |
| Non-music topics submitted | Unexpected results | v1: let it work (Claude handles general topics reasonably). The prompt biases toward music but doesn't hard-block. |
| Drag interaction on puzzle grid is complex | Janky UX, especially on touch | Build PuzzleGrid as a standalone prototype first. Constrain selection to 8 valid directions (snap to nearest). Test on touch devices early — this is the core interaction and must feel snappy. Consider pointer events API over separate mouse/touch handlers. |
