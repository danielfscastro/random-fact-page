import { VALID_CATEGORIES, VALID_SOURCES, MAX_TEXT_LENGTH } from '../models/fact.js';

/**
 * Validates a Fact object against all required constraints.
 *
 * @param {object|null|undefined} fact - The fact object to validate
 * @returns {boolean} true if the fact is valid, false otherwise
 */
export function validateFact(fact) {
  if (fact == null) {
    return false;
  }

  // id must be a positive integer (greater than 0)
  if (typeof fact.id !== 'number' || !Number.isInteger(fact.id) || fact.id <= 0) {
    return false;
  }

  // text must be a non-empty string with max 500 characters
  if (typeof fact.text !== 'string' || fact.text.length === 0 || fact.text.length > MAX_TEXT_LENGTH) {
    return false;
  }

  // category must be one of the valid values
  if (!VALID_CATEGORIES.includes(fact.category)) {
    return false;
  }

  // source must be "local" or "api"
  if (!VALID_SOURCES.includes(fact.source)) {
    return false;
  }

  return true;
}
