/**
 * Migrate legacy comma-separated numeric ID strings into block attribute ID arrays.
 * Returns [] if the string contains any non‑numeric token (e.g. old slug-based values).
 */
export function migrateNumericCsvPairToIds(
  legacyA?: string,
  legacyB?: string,
): number[] {
  const raw = [legacyA ?? "", legacyB ?? ""].find(
    (s) => String(s).trim() !== "",
  );
  if (raw === undefined) {
    return [];
  }
  const parts = String(raw)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const ids: number[] = [];
  for (const p of parts) {
    if (!/^\d+$/.test(p)) {
      return [];
    }
    const n = parseInt(p, 10);
    if (n > 0) {
      ids.push(n);
    }
  }
  return [...new Set(ids)];
}
