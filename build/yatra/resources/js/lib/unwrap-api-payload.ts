/**
 * Normalize REST JSON that may be either a plain payload (e.g. settings)
 * or wrapped as { success: true, data: T } (e.g. Email Automation).
 */
export function unwrapApiPayload<T>(raw: unknown): T {
  if (raw !== null && typeof raw === "object") {
    const r = raw as Record<string, unknown>;
    if (r.success === true && "data" in r) {
      return r.data as T;
    }
  }
  return raw as T;
}
