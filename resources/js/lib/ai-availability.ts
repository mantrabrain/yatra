/**
 * Single-source check for "should the AI sparkle button render here?".
 *
 * Three independent gates must all be true:
 *   1. `isAiEligible` — license tier is Growth or Agency (set by Pro).
 *   2. `aiAssistantEnabled` — module toggle on (set by Pro).
 *   3. `aiAssistantConfigured` — at least one provider has an API key
 *      (set by Pro's AiModule::boot → LocalizedData::register).
 *
 * Components import this so the rule lives in one place — flipping it
 * later (e.g. allowing per-user opt-in) is a single edit.
 */

export interface AiAdminWindow {
  isAiEligible?: boolean;
  aiAssistantEnabled?: boolean;
  aiAssistantConfigured?: boolean;
}

function readAdmin(): AiAdminWindow {
  return ((window as any).yatraAdmin ?? {}) as AiAdminWindow;
}

/** Is the AI module fully ready (eligible + enabled + at least one key)? */
export function isAiReady(): boolean {
  const a = readAdmin();
  return Boolean(
    a.isAiEligible && a.aiAssistantEnabled && a.aiAssistantConfigured,
  );
}

/**
 * Looser check: the operator's license tier qualifies and the module is
 * enabled, but no key is configured yet. Used by the Settings page to
 * show the "add your API key to start" state.
 */
export function isAiActiveButUnconfigured(): boolean {
  const a = readAdmin();
  return Boolean(
    a.isAiEligible && a.aiAssistantEnabled && !a.aiAssistantConfigured,
  );
}

/** Did the operator's license tier even unlock AI Assistant? */
export function isAiEligible(): boolean {
  return Boolean(readAdmin().isAiEligible);
}

/** Is the AI Assistant module toggle on? */
export function isAiModuleEnabled(): boolean {
  return Boolean(readAdmin().aiAssistantEnabled);
}
