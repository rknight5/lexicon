import Anthropic from "@anthropic-ai/sdk";
import type { CategorySuggestion, Difficulty, WordEntry, TriviaQuestion } from "./types";
import { parseClaudeResponse, validateAndFilterWords } from "./validation";
import { DIFFICULTY_CONFIG, CROSSWORD_DIFFICULTY_CONFIG, ANAGRAM_DIFFICULTY_CONFIG, TRIVIA_DIFFICULTY_CONFIG } from "./types";

const anthropic = new Anthropic();

// ============================================
// Category suggestion (Haiku — fast + cheap)
// ============================================

export async function suggestCategories(
  topic: string
): Promise<CategorySuggestion[]> {
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system: `You suggest word puzzle categories. Given a topic, return 5-7 relevant categories of words/terms that could appear in a word puzzle about that topic.

Respond with ONLY valid JSON, no markdown fences:
{
  "categories": [
    { "name": "Category Name", "description": "Brief description of what words this includes" }
  ]
}`,
    messages: [
      {
        role: "user",
        content: `Topic: ${topic}`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  let cleaned = text.trim();
  cleaned = cleaned
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "");
  const jsonStart = cleaned.indexOf("{");
  if (jsonStart > 0) cleaned = cleaned.slice(jsonStart);
  const jsonEnd = cleaned.lastIndexOf("}");
  if (jsonEnd >= 0) cleaned = cleaned.slice(0, jsonEnd + 1);

  const parsed = JSON.parse(cleaned);
  return parsed.categories;
}

// ============================================
// Puzzle word generation (Sonnet — quality)
// ============================================

const SYSTEM_PROMPT = `You are a word puzzle content generator. Given a user's topic of interest and their configuration preferences, generate a list of relevant words for a word search puzzle.

Rules:
- Generate the number of words specified in the config
- Each word must be a SINGLE word (no spaces, no hyphens). For multi-word names, use the most recognizable single word (e.g., "Springsteen" not "Bruce Springsteen", "Risotto" not "Mushroom Risotto")
- Words must be 3-12 letters long
- All words must be real, verifiable names, terms, or references
- Only include words from the requested focus categories
- Assign each word a difficulty: 1 (well-known), 2 (moderate), 3 (deep cut)
- Distribute difficulty based on the requested level:
  - Easy: mostly difficulty 1, a few 2s
  - Medium: mix of 1s, 2s, and a few 3s
  - Hard: heavy on 2s and 3s, fewer 1s
- Provide a fun fact in 1-2 sentences, maximum 40 words
- Vary your selections: prioritize surprising, lesser-known, and creative word choices over the most obvious ones. Each generation should feel fresh, not formulaic.

Respond with ONLY valid JSON in this exact format, with no markdown fences, no preamble, no explanation:
{
  "title": "A catchy title for the puzzle",
  "words": [
    { "word": "EXAMPLE", "clue": "Brief description", "category": "Category Name", "difficulty": 1 }
  ],
  "funFact": "An interesting fact about the topic (1-2 sentences, max 40 words)"
}`;

function buildUserMessage(
  topic: string,
  difficulty: Difficulty,
  focusCategories: string[],
  attempt: number
): string {
  const config = DIFFICULTY_CONFIG[difficulty];
  let message = `Topic: ${topic}
Difficulty: ${difficulty}
Word count: ${config.minWords}-${config.maxWords}
Focus categories: ${focusCategories.join(", ")}`;

  if (attempt === 2) {
    message +=
      "\n\nNote: If the topic is narrow, broaden to include related topics, influences, and cultural references.";
  }
  if (attempt === 3) {
    message +=
      "\n\nNote: Generate any words broadly related to this topic area. Ignore category restrictions — just produce enough valid puzzle words.";
  }

  return message;
}

export async function generatePuzzleWords(
  topic: string,
  difficulty: Difficulty,
  focusCategories: string[]
): Promise<{ title: string; words: WordEntry[]; funFact: string }> {
  const config = DIFFICULTY_CONFIG[difficulty];

  for (let attempt = 1; attempt <= 3; attempt++) {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      temperature: 0.9,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildUserMessage(topic, difficulty, focusCategories, attempt),
        },
      ],
    });

    if (response.stop_reason === "max_tokens") {
      throw new Error(
        "Response was truncated. The topic may be too broad — try a more specific topic."
      );
    }

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    try {
      const parsed = parseClaudeResponse(text);
      const categoriesToFilter =
        attempt === 3 ? parsed.words.map((w) => w.category) : focusCategories;
      const validated = validateAndFilterWords(parsed.words, {
        minWords: config.minWords,
        maxWords: config.maxWords,
        focusCategories: categoriesToFilter,
      });

      if (validated.length >= config.minWords) {
        return {
          title: parsed.title,
          words: validated,
          funFact: parsed.funFact,
        };
      }
      // Not enough words — continue to next attempt with broadened prompt
    } catch {
      if (attempt === 3) throw new Error("Failed to parse puzzle data after 3 attempts");
    }
  }

  throw new Error(
    "Couldn't generate enough words for that topic. Try something broader."
  );
}

// ============================================
// Crossword word generation (Sonnet — quality)
// ============================================

const CROSSWORD_SYSTEM_PROMPT = `You are a crossword puzzle content generator. Given a user's topic of interest, generate a list of words with clues for a mini crossword puzzle.

Rules:
- Generate the number of words specified in the config
- Each word must be a SINGLE word (no spaces, no hyphens), ALL UPPERCASE
- Words must be 3-10 letters long
- Prefer words with common letters (E, A, R, S, T, N) to maximize intersection opportunities
- All words must be real, verifiable names, terms, or references
- Only include words from the requested focus categories
- Each clue should be a concise definition or reference
- Assign each word a difficulty: 1 (well-known), 2 (moderate), 3 (deep cut)
- Clue difficulty should match the requested level:
  - Easy: direct, obvious clues (e.g., "Six-string instrument" for GUITAR)
  - Medium: moderate clues, some require topic knowledge (e.g., "Cobain's band" for NIRVANA)
  - Hard: obscure or indirect clues that require deep knowledge (e.g., "Sub Pop label's hometown sound" for GRUNGE)
- Provide a fun fact in 1-2 sentences, maximum 40 words
- Vary your selections: prioritize surprising, lesser-known, and creative word choices over the most obvious ones. Each generation should feel fresh, not formulaic.

Respond with ONLY valid JSON in this exact format, with no markdown fences, no preamble, no explanation:
{
  "title": "A catchy title for the puzzle",
  "words": [
    { "word": "EXAMPLE", "clue": "Brief clue", "category": "Category Name", "difficulty": 1 }
  ],
  "funFact": "An interesting fact about the topic (1-2 sentences, max 40 words)"
}`;

function buildCrosswordUserMessage(
  topic: string,
  difficulty: Difficulty,
  focusCategories: string[],
  attempt: number
): string {
  const config = CROSSWORD_DIFFICULTY_CONFIG[difficulty];
  let message = `Topic: ${topic}
Difficulty: ${difficulty}
Word count: ${config.candidateWords} (generate extra candidates — the grid algorithm will select the best fitting subset)
Max word length: ${config.gridSize} letters
Focus categories: ${focusCategories.join(", ")}`;

  if (attempt === 2) {
    message +=
      "\n\nNote: If the topic is narrow, broaden to include related topics, influences, and cultural references. Prioritize shorter words (3-5 letters) with common letters.";
  }
  if (attempt === 3) {
    message +=
      "\n\nNote: Generate any words broadly related to this topic area. Ignore category restrictions — just produce enough valid puzzle words. Keep words short (3-5 letters).";
  }

  return message;
}

export async function generateCrosswordWords(
  topic: string,
  difficulty: Difficulty,
  focusCategories: string[]
): Promise<{ title: string; words: WordEntry[]; funFact: string }> {
  const config = CROSSWORD_DIFFICULTY_CONFIG[difficulty];

  for (let attempt = 1; attempt <= 3; attempt++) {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      temperature: 0.9,
      system: CROSSWORD_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildCrosswordUserMessage(topic, difficulty, focusCategories, attempt),
        },
      ],
    });

    if (response.stop_reason === "max_tokens") {
      throw new Error(
        "Response was truncated. The topic may be too broad — try a more specific topic."
      );
    }

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    try {
      const parsed = parseClaudeResponse(text);
      const categoriesToFilter =
        attempt === 3 ? parsed.words.map((w) => w.category) : focusCategories;
      const validated = validateAndFilterWords(parsed.words, {
        minWords: config.minWords,
        maxWords: config.candidateWords,
        maxWordLength: config.gridSize,
        focusCategories: categoriesToFilter,
      });

      if (validated.length >= config.minWords) {
        return {
          title: parsed.title,
          words: validated,
          funFact: parsed.funFact,
        };
      }
    } catch {
      if (attempt === 3) throw new Error("Failed to parse crossword data after 3 attempts");
    }
  }

  throw new Error(
    "Couldn't generate enough words for that topic. Try something broader."
  );
}

// ============================================
// Anagram word generation (Sonnet — quality)
// ============================================

const ANAGRAM_SYSTEM_PROMPT = `You are an anagram puzzle content generator. Given a user's topic of interest, generate a list of words that will be scrambled into anagrams for the player to solve.

Rules:
- Generate the number of words specified in the config
- Each word must be a SINGLE word (no spaces, no hyphens), ALL UPPERCASE
- Words must be within the specified length range
- All words must be real, verifiable names, terms, or references
- Only include words from the requested focus categories
- Each word needs a clue — the clue style varies by difficulty level
- Assign each word a difficulty: 1 (well-known), 2 (moderate), 3 (deep cut)
- Distribute word difficulty and clue style based on the requested level:
  - Easy: mostly difficulty 1, a few 2s. Clues should be clear and direct — obvious hints that help the player (e.g., "A stringed instrument played with a bow" for VIOLIN)
  - Medium: mix of 1s, 2s, and a few 3s. Clues should be slightly vague and indirect — they relate to the answer but require some thought (e.g., "Found in an orchestra pit" for VIOLIN)
  - Hard: heavy on 2s and 3s, fewer 1s. No clues will be shown to the player, but still include a clue in the JSON for consistency
- Provide a fun fact in 1-2 sentences, maximum 40 words
- Vary your selections: prioritize surprising, lesser-known, and creative word choices over the most obvious ones. Each generation should feel fresh, not formulaic.

Respond with ONLY valid JSON in this exact format, with no markdown fences, no preamble, no explanation:
{
  "title": "A catchy title for the puzzle",
  "words": [
    { "word": "EXAMPLE", "clue": "Brief clue", "category": "Category Name", "difficulty": 1 }
  ],
  "funFact": "An interesting fact about the topic (1-2 sentences, max 40 words)"
}`;

function buildAnagramUserMessage(
  topic: string,
  difficulty: Difficulty,
  focusCategories: string[],
  attempt: number
): string {
  const config = ANAGRAM_DIFFICULTY_CONFIG[difficulty];
  let message = `Topic: ${topic}
Difficulty: ${difficulty}
Word count: ${config.minWords}-${config.maxWords}
Word length: ${config.minWordLength}-${config.maxWordLength} letters
Focus categories: ${focusCategories.join(", ")}`;

  if (attempt === 2) {
    message +=
      "\n\nNote: If the topic is narrow, broaden to include related topics, influences, and cultural references.";
  }
  if (attempt === 3) {
    message +=
      "\n\nNote: Generate any words broadly related to this topic area. Ignore category restrictions — just produce enough valid puzzle words.";
  }

  return message;
}

export async function generateAnagramWords(
  topic: string,
  difficulty: Difficulty,
  focusCategories: string[]
): Promise<{ title: string; words: WordEntry[]; funFact: string }> {
  const config = ANAGRAM_DIFFICULTY_CONFIG[difficulty];

  for (let attempt = 1; attempt <= 3; attempt++) {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      temperature: 0.9,
      system: ANAGRAM_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildAnagramUserMessage(topic, difficulty, focusCategories, attempt),
        },
      ],
    });

    if (response.stop_reason === "max_tokens") {
      throw new Error(
        "Response was truncated. The topic may be too broad — try a more specific topic."
      );
    }

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    try {
      const parsed = parseClaudeResponse(text);
      const categoriesToFilter =
        attempt === 3 ? parsed.words.map((w) => w.category) : focusCategories;
      const validated = validateAndFilterWords(parsed.words, {
        minWords: config.minWords,
        maxWords: config.maxWords,
        minWordLength: config.minWordLength,
        maxWordLength: config.maxWordLength,
        focusCategories: categoriesToFilter,
      });

      if (validated.length >= config.minWords) {
        return {
          title: parsed.title,
          words: validated,
          funFact: parsed.funFact,
        };
      }
    } catch {
      if (attempt === 3) throw new Error("Failed to parse anagram data after 3 attempts");
    }
  }

  throw new Error(
    "Couldn't generate enough words for that topic. Try something broader."
  );
}

// ============================================
// Trivia question generation (Sonnet — quality)
// ============================================

const TRIVIA_SYSTEM_PROMPT = `You are a trivia question generator. Given a user's topic of interest, generate a set of trivia questions mixing multiple choice and true/false formats.

Rules:
- Generate the number of questions specified in the config
- Mix of question types: roughly 70% multiple choice ("mc") and 30% true/false ("tf")
- Multiple choice questions MUST have exactly 4 options. correctIndex is 0-based (0, 1, 2, or 3)
- True/false questions MUST have exactly 2 options: ["True", "False"]. correctIndex is 0 (True) or 1 (False)
- All questions must be factually accurate and verifiable
- Only include questions related to the requested focus categories
- Question difficulty should match the requested level:
  - Easy: straightforward, common knowledge about the topic
  - Medium: requires moderate topic knowledge, some tricky options
  - Hard: deep trivia, obscure facts, closely similar answer options
- Shuffle the position of the correct answer among the options (don't always put it first or last)
- Provide a fun fact in 1-2 sentences, maximum 40 words
- Vary your questions: prioritize surprising facts and lesser-known trivia over the most obvious questions

Respond with ONLY valid JSON in this exact format, with no markdown fences, no preamble, no explanation:
{
  "title": "A catchy title for the trivia set",
  "questions": [
    { "question": "What is...?", "type": "mc", "options": ["A", "B", "C", "D"], "correctIndex": 2, "category": "Category Name" },
    { "question": "True or false: ...", "type": "tf", "options": ["True", "False"], "correctIndex": 0, "category": "Category Name" }
  ],
  "funFact": "An interesting fact about the topic (1-2 sentences, max 40 words)"
}`;

function buildTriviaUserMessage(
  topic: string,
  difficulty: Difficulty,
  focusCategories: string[],
  attempt: number
): string {
  const config = TRIVIA_DIFFICULTY_CONFIG[difficulty];
  let message = `Topic: ${topic}
Difficulty: ${difficulty}
Question count: ${config.questionCount}
Focus categories: ${focusCategories.join(", ")}`;

  if (attempt === 2) {
    message +=
      "\n\nNote: If the topic is narrow, broaden to include related topics, influences, and cultural references.";
  }
  if (attempt === 3) {
    message +=
      "\n\nNote: Generate any questions broadly related to this topic area. Ignore category restrictions — just produce enough valid trivia questions.";
  }

  return message;
}

function validateTriviaQuestions(questions: TriviaQuestion[], minCount: number): TriviaQuestion[] {
  return questions.filter((q) => {
    if (!q.question || typeof q.question !== "string") return false;
    if (q.type === "mc") {
      if (!Array.isArray(q.options) || q.options.length !== 4) return false;
      if (typeof q.correctIndex !== "number" || q.correctIndex < 0 || q.correctIndex > 3) return false;
    } else if (q.type === "tf") {
      if (!Array.isArray(q.options) || q.options.length !== 2) return false;
      if (typeof q.correctIndex !== "number" || q.correctIndex < 0 || q.correctIndex > 1) return false;
    } else {
      return false;
    }
    return true;
  }).slice(0, minCount + 5);
}

export async function generateTriviaQuestions(
  topic: string,
  difficulty: Difficulty,
  focusCategories: string[]
): Promise<{ title: string; questions: TriviaQuestion[]; funFact: string }> {
  const config = TRIVIA_DIFFICULTY_CONFIG[difficulty];

  for (let attempt = 1; attempt <= 3; attempt++) {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      temperature: 0.9,
      system: TRIVIA_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildTriviaUserMessage(topic, difficulty, focusCategories, attempt),
        },
      ],
    });

    if (response.stop_reason === "max_tokens") {
      throw new Error(
        "Response was truncated. The topic may be too broad — try a more specific topic."
      );
    }

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    try {
      let cleaned = text.trim();
      cleaned = cleaned
        .replace(/^```(?:json)?\s*\n?/i, "")
        .replace(/\n?```\s*$/i, "");
      const jsonStart = cleaned.indexOf("{");
      if (jsonStart > 0) cleaned = cleaned.slice(jsonStart);
      const jsonEnd = cleaned.lastIndexOf("}");
      if (jsonEnd >= 0) cleaned = cleaned.slice(0, jsonEnd + 1);

      const parsed = JSON.parse(cleaned);
      const validated = validateTriviaQuestions(parsed.questions ?? [], config.questionCount);

      if (validated.length >= config.questionCount) {
        return {
          title: parsed.title || `${topic} Trivia`,
          questions: validated.slice(0, config.questionCount),
          funFact: parsed.funFact || "",
        };
      }
    } catch {
      if (attempt === 3) throw new Error("Failed to parse trivia data after 3 attempts");
    }
  }

  throw new Error(
    "Couldn't generate enough questions for that topic. Try something broader."
  );
}
