/**
 * Parse the plain-text day-by-day format emitted by the `trip-itinerary`
 * AI task into the shape TripForm's `itinerary_days` state expects.
 *
 * The LLM is instructed (in the prompt template) to emit:
 *
 *   Day 1: Arrive in Kathmandu
 *   Welcome briefing at the hotel, group dinner, and an early night.
 *
 *   Day 2: Fly to Lukla, trek to Phakding
 *   ...
 *
 * In practice models sometimes drift — they may emit "Day 1 -" instead of
 * "Day 1:", wrap with markdown bold, or sneak in a leading preamble. The
 * parser tolerates these by:
 *   - matching `^Day N` with a flexible separator (`:`, `-`, `–`, `—`)
 *   - stripping leading/trailing whitespace + common markdown chars
 *   - dropping anything before the first valid `Day N` block
 *   - de-duping consecutive blank lines inside descriptions
 */

export interface ParsedDay {
  day: number;
  day_title: string;
  description: string;
}

/**
 * Match a "Day N: title" line, tolerant of LLM drift:
 *
 *   - optional leading `#`s (markdown header)
 *   - optional leading `*`s (markdown bold)
 *   - "Day" / "day" / "DAY"
 *   - `:`, `-`, `–` (en dash), `—` (em dash), or nothing-then-newline as separator
 *   - optional trailing `*`s
 *
 * Plain trailing whitespace + control chars are tolerated.
 *
 * NOTE: trailing-asterisk group is `\**?` (ZERO-or-more, lazy), not
 * `\*+?` (one-or-more) — when the model emits a plain "Day 1: Arrive
 * in Kathmandu" with no markdown decoration, a one-or-more match
 * silently rejected every line and the wizard reported "0 days
 * drafted" even though the prose was perfectly valid.
 */
const DAY_HEAD =
  /^\s*(?:#+\s*)?(?:\*+\s*)?day\s+(\d+)\s*(?:[:\-–—]\s*)?(.*?)\s*\**?\s*$/i;

export function parseItineraryText(text: string): ParsedDay[] {
  if (!text) return [];
  const lines = text.replace(/\r\n?/g, "\n").split("\n");

  const days: ParsedDay[] = [];
  let current: ParsedDay | null = null;
  let descriptionBuffer: string[] = [];

  const flush = () => {
    if (current) {
      current.description = cleanDescription(descriptionBuffer);
      days.push(current);
    }
    current = null;
    descriptionBuffer = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const headMatch = DAY_HEAD.exec(line);
    if (headMatch) {
      flush();
      const dayNum = parseInt(headMatch[1], 10);
      const title = (headMatch[2] || "").replace(/[\*_`]+/g, "").trim();
      current = {
        day: Number.isFinite(dayNum) && dayNum > 0 ? dayNum : days.length + 1,
        day_title: title,
        description: "",
      };
      continue;
    }
    if (current) {
      descriptionBuffer.push(line);
    }
    // lines before the first valid "Day N:" header are intentionally dropped
  }

  flush();

  // Renumber if the LLM skipped or duplicated day numbers — preserve the
  // order it produced (callers care about positions, not the original
  // numeric labels).
  return days.map((d, idx) => ({
    day: idx + 1,
    day_title: d.day_title,
    description: d.description,
  }));
}

function cleanDescription(buffer: string[]): string {
  // Drop leading blank lines, collapse runs of blank lines, strip markdown
  // emphasis that the LLM sometimes wraps individual sentences with.
  const trimmed = buffer.join("\n").replace(/\s+$/g, "");
  return trimmed
    .replace(/^\s*\n+/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^[\*_]+|[\*_]+$/gm, "")
    .trim();
}
