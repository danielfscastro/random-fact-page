/**
 * Valid categories for a Fact.
 */
export const VALID_CATEGORIES = ['science', 'history', 'nature', 'technology', 'general'];

/**
 * Valid sources for a Fact.
 */
export const VALID_SOURCES = ['local', 'api'];

/**
 * Maximum allowed length for fact text.
 */
export const MAX_TEXT_LENGTH = 500;

/**
 * Factory function to create a Fact instance.
 *
 * @param {object} params
 * @param {number} params.id - Positive integer identifier
 * @param {string} params.text - Fact text (max 500 characters)
 * @param {string} params.category - One of: science, history, nature, technology, general
 * @param {string} params.source - Either "local" or "api"
 * @returns {{ id: number, text: string, category: string, source: string }}
 */
export function createFact({ id, text, category, source }) {
  return Object.freeze({
    id,
    text,
    category,
    source,
  });
}
