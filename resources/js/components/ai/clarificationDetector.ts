/**
 * Detect when an LLM response is actually a "I need more info" refusal
 * disguised as content, instead of the structured output the prompt
 * asked for. The model occasionally does this when the form has too
 * many empty fields; without detection we'd render the question text
 * as if it were the operator's content (e.g. push the questions into
 * the highlights array, or parse zero days from an itinerary).
 *
 * The detector is intentionally conservative — false positives hide
 * real content from the operator, which is worse than letting the odd
 * clarification slip through. We require BOTH a recognizable phrase
 * AND a low-content-ish shape (short overall, lots of questions, no
 * `Day N:` heads when itinerary was requested, etc.).
 */

/**
 * Phrases the LLM commonly uses when refusing. Lowercased, partial-match.
 * Keep this list short — broader patterns cause false positives on
 * legitimate content that happens to mention "information" or "please".
 */
const CLARIFICATION_PHRASES: string[] = [
  "i don't have enough",
  "i do not have enough",
  "i need more information",
  "i need more details",
  "i need more context",
  "could you provide",
  "could you please provide",
  "can you provide",
  "please provide",
  "please share",
  "to write accurate",
  "to write specific",
  "once i have these details",
  "once you provide",
  "with these details i'll",
  "with these details i can",
  "without more information",
  "without more details",
  "the operator's notes show empty",
  "operator's notes are empty",
  "i'll need to know",
  "to give you a meaningful",
];

export interface ClarificationResult {
  isClarification: boolean;
  /** AI's prose explanation (top of the response, before any questions). */
  message: string;
  /** Individual questions the AI asked, if any (one per array slot). */
  questions: string[];
}

export function detectClarification(
  rawText: string,
  opts: { expectDayHeads?: boolean } = {},
): ClarificationResult {
  const text = (rawText || "").trim();
  if (text === "") {
    return { isClarification: false, message: "", questions: [] };
  }

  const lower = text.toLowerCase();
  const matchedPhrase = CLARIFICATION_PHRASES.find((p) => lower.includes(p));
  if (!matchedPhrase) {
    return { isClarification: false, message: "", questions: [] };
  }

  // If the task expected day heads (itinerary) and we got zero, that's
  // strong evidence — even a partial refusal is unusable. Pair with the
  // phrase match.
  if (opts.expectDayHeads) {
    const hasDayHead = /^\s*(?:#+\s*)?(?:\*+\s*)?day\s+\d+/im.test(text);
    if (hasDayHead) {
      return { isClarification: false, message: "", questions: [] };
    }
  }

  // Otherwise require multiple question marks OR a short response — a
  // long form-letter-style answer that happens to mention "please
  // provide" but actually delivers content shouldn't trip the detector.
  const questionCount = (text.match(/\?/g) || []).length;
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if (!opts.expectDayHeads && questionCount < 2 && wordCount > 80) {
    return { isClarification: false, message: "", questions: [] };
  }

  // Split into a leading prose block (everything before the first
  // question or bullet) and a list of question lines. Tolerates bullet
  // styles: `-`, `*`, `•`.
  const lines = text.split(/\r?\n/);
  const messageLines: string[] = [];
  const questions: string[] = [];
  let pastIntro = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (line === "") {
      if (messageLines.length > 0) pastIntro = true;
      continue;
    }
    const stripped = line.replace(/^[\s\-\*•·●]+/, "").trim();
    const looksLikeQuestion =
      stripped.endsWith("?") ||
      /^(could|can|please|would|will|what|when|where|who|why|how)\b/i.test(
        stripped,
      );
    const isBullet = /^[\s\-\*•·●]/.test(line);
    if (pastIntro || isBullet || looksLikeQuestion) {
      questions.push(stripped);
      pastIntro = true;
    } else {
      messageLines.push(line);
    }
  }

  return {
    isClarification: true,
    message: messageLines.join("\n").trim(),
    questions,
  };
}
