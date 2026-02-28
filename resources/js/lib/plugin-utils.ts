/**
 * Plugin utility functions
 */

/**
 * Check if the Pro plugin is active
 * @returns {boolean} True if Pro plugin is active, false otherwise
 */
export const isProPluginActive = (): boolean => {
  const raw = (window as any).yatraAdmin?.isPro;
  let isPro = false;

  if (
    raw === true ||
    raw === "true" ||
    raw === 1 ||
    raw === "1" ||
    raw === "yes"
  ) {
    isPro = true;
  } else if (
    raw === false ||
    raw === "false" ||
    raw === 0 ||
    raw === "0" ||
    raw === "no"
  ) {
    isPro = false;
  }
  return isPro;
};

/**
 * Check if a specific module is active
 * @param moduleName - The name of the module to check (e.g., 'email_automation')
 * @returns {boolean} True if the module is active, false otherwise
 */
export const isModuleActive = (moduleName: string): boolean => {
  if (!isProPluginActive()) {
    return false;
  }
  if (!moduleName || typeof moduleName !== "string") {
    return false;
  }

  // Convert module name to camelCase with 'Enabled' suffix (e.g., 'email_automation' -> 'emailAutomationEnabled')
  const camelCaseName = moduleName.replace(/_([a-z])/g, (_, letter) =>
    letter.toUpperCase(),
  );
  const localizedKey = camelCaseName + "Enabled";

  const raw = (window as any).yatraAdmin?.[localizedKey];
  let isActive = false;

  if (
    raw === true ||
    raw === "true" ||
    raw === 1 ||
    raw === "1" ||
    raw === "yes"
  ) {
    isActive = true;
  } else if (
    raw === false ||
    raw === "false" ||
    raw === 0 ||
    raw === "0" ||
    raw === "no"
  ) {
    isActive = false;
  }
  return isActive;
};
