/**
 * Slug Generation Utility
 * Generates URL-friendly slugs from text (matches WordPress sanitize_title logic)
 */

/**
 * Generate a slug from a string
 * Mimics WordPress sanitize_title() function
 *
 * @param text - The text to convert to a slug
 * @returns A URL-friendly slug
 */
export const generateSlug = (text: string): string => {
  if (!text) return "";

  return (
    text
      .toLowerCase()
      .trim()
      // Replace spaces and underscores with hyphens
      .replace(/[\s_]+/g, "-")
      // Remove all non-word characters except hyphens. The Unicode property
      // escapes (\p{L} = any letter, \p{N} = any digit) with the `u` flag let
      // non-Latin alphabets through — Cyrillic ("Путешествие"), CJK, Devanagari,
      // Arabic, etc. The previous `\w` shortcut was ASCII-only and stripped
      // every Russian letter, producing an empty slug. WordPress's own
      // sanitize_title() preserves these scripts server-side, so this matches.
      .replace(/[^\p{L}\p{N}-]+/gu, "")
      // Replace multiple consecutive hyphens with a single hyphen
      .replace(/-+/g, "-")
      // Remove leading and trailing hyphens
      .replace(/^-+|-+$/g, "")
  );
};

/**
 * Generate a unique slug by appending a number if needed
 *
 * @param baseSlug - The base slug
 * @param existingSlugs - Array of existing slugs to check against
 * @returns A unique slug
 */
export const generateUniqueSlug = (
  baseSlug: string,
  existingSlugs: string[],
): string => {
  let slug = generateSlug(baseSlug);

  if (!slug) {
    slug = "untitled";
  }

  // If slug is already unique, return it
  if (!existingSlugs.includes(slug)) {
    return slug;
  }

  // Try appending numbers until we find a unique slug
  let counter = 1;
  let uniqueSlug = `${slug}-${counter}`;

  while (existingSlugs.includes(uniqueSlug)) {
    counter++;
    uniqueSlug = `${slug}-${counter}`;
  }

  return uniqueSlug;
};
