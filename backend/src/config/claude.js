// backend/src/config/claude.js
// Thin wrapper around the Anthropic (Claude) SDK with a helper to generate quiz Qs.
import Anthropic from "@anthropic-ai/sdk";

const {
  CLAUDE_API_KEY,
  CLAUDE_MODEL = "claude-3-5-sonnet-20240620",
  NODE_ENV = "development",
} = process.env;

if (!CLAUDE_API_KEY && NODE_ENV !== "test") {
  console.warn(
    "[Claude] CLAUDE_API_KEY not set. Quiz generation will fail until you configure it."
  );
}

export const claude = new Anthropic({
  apiKey: CLAUDE_API_KEY,
});

/**
 * Extract the first JSON block from a text response (handles ```json fences).
 */
function extractJSON(text) {
  if (!text) return null;
  const fenced = text.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fenced) {
    return fenced[1];
  }
  // Fallback: try to find the first { or [ and parse to the matching end
  const idx = Math.min(
    ...[text.indexOf("{"), text.indexOf("[")].filter((i) => i >= 0)
  );
  if (Number.isFinite(idx) && idx >= 0) {
    return text.slice(idx);
  }
  return null;
}

/**
 * Ask Claude to generate quiz questions in a strict JSON format.
 * Returns: Array<{id, question, type, difficulty, options?, answer, explanation, tags[]}>
 */
export async function generateQuizQuestions({
  topic,
  count = 10,
  difficulty = "mixed", // easy | medium | hard | mixed
}) {
  if (!topic || typeof topic !== "string") {
    throw new Error("Topic is required for quiz generation.");
  }

  const sysPrompt = `You are an educational content generator.
Return ONLY valid JSON (no markdown fences unless asked).
Each question must include: id, question, type, difficulty, answer, explanation, tags[].
For type "mcq", include "options" (2-6 choices) and "answer" must be one of the options.
Keep explanations concise and accurate. No profanity, no private data.`;

  const userPrompt = `
Generate ${count} quiz questions about "${topic}" at ${difficulty} difficulty.
Mix types among: "mcq", "true_false", "fill_blank".
Respond as a JSON array ONLY, e.g.:

[
  {
    "id": "q1",
    "question": "…",
    "type": "mcq",
    "difficulty": "medium",
    "options": ["A", "B", "C", "D"],
    "answer": "B",
    "explanation": "…",
    "tags": ["topic", "subtopic"]
  }
]
`;

  const resp = await claude.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    temperature: 0.2,
    system: sysPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = resp?.content?.find?.((c) => c.type === "text");
  const raw = textBlock?.text?.trim();
  let jsonText = extractJSON(raw) || raw;

  if (!jsonText) {
    throw new Error("Claude returned an empty response.");
  }

  // Try to parse strictly; if fenced code sneaks in, extractJSON should have handled it
  let data;
  try {
    data = JSON.parse(jsonText);
  } catch (err) {
    // Last-ditch cleanup (remove leading/trailing junk)
    const cleaned = jsonText.replace(/^[^\[{]+/, "").replace(/[^\]}]+$/, "");
    data = JSON.parse(cleaned);
  }

  if (!Array.isArray(data)) {
    throw new Error("Claude did not return a JSON array of questions.");
  }

  // Minimal schema sanity check
  const normalized = data.map((q, i) => {
    if (!q || typeof q !== "object") {
      throw new Error(`Question ${i} is not an object.`);
    }
    const base = {
      id: q.id ?? `q${i + 1}`,
      question: q.question,
      type: q.type, // mcq | true_false | fill_blank
      difficulty: q.difficulty ?? difficulty,
      options: Array.isArray(q.options) ? q.options : undefined,
      answer: q.answer,
      explanation: q.explanation,
      tags: Array.isArray(q.tags) ? q.tags : [],
    };
    if (!base.question || !base.type || !base.answer || !base.explanation) {
      throw new Error(`Question ${base.id} missing required fields.`);
    }
    if (base.type === "mcq" && (!base.options || base.options.length < 2)) {
      throw new Error(`MCQ ${base.id} must include at least two options.`);
    }
    return base;
  });

  return normalized;
}