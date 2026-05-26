import { fetchAllFacts } from '../repository/factRepository.js';
import { validateFact } from '../utils/validateFact.js';
import { createFactResponse } from '../models/factResponse.js';
import { localFacts } from '../repository/localFacts.js';
import { localFactsPtBr } from '../repository/localFactsPtBr.js';

/**
 * Module-level variable to track the last displayed fact id
 * to avoid consecutive duplicates.
 */
let lastDisplayedFactId = null;

/**
 * Current language for fact display.
 * @type {'en' | 'pt-br'}
 */
let currentLanguage = 'en';

/**
 * Sets the current language for facts.
 * @param {'en' | 'pt-br'} lang
 */
export function setLanguage(lang) {
  currentLanguage = lang;
}

/**
 * Gets the current language.
 * @returns {'en' | 'pt-br'}
 */
export function getLanguage() {
  return currentLanguage;
}

/**
 * Returns the local facts collection for the current language.
 * @returns {Array}
 */
function getLocalFactsForLanguage() {
  return currentLanguage === 'pt-br' ? localFactsPtBr : localFacts;
}

/**
 * Resets the service state (useful for testing).
 */
export function resetService() {
  lastDisplayedFactId = null;
  currentLanguage = 'en';
}

/**
 * Gets the currently displayed fact translated to the current language.
 * If the fact id is not found in the current language collection, returns a random fact.
 *
 * @returns {Promise<{fact: object, isFromFallback: boolean, timestamp: Date}>} A FactResponse
 */
export async function getCurrentFactInLanguage() {
  const facts = getLocalFactsForLanguage().filter(validateFact);

  if (lastDisplayedFactId != null) {
    const translatedFact = facts.find((f) => f.id === lastDisplayedFactId);
    if (translatedFact) {
      return createFactResponse({
        fact: translatedFact,
        isFromFallback: false,
      });
    }
  }

  // If no current fact or id not found in new language, get a random one
  return getRandomFact();
}

/**
 * Retrieves a random fact, attempting the primary repository first
 * and falling back to the local collection on failure.
 *
 * - Filters out invalid facts using validateFact
 * - Avoids consecutive duplicates using lastDisplayedFactId
 * - Sets isFromFallback to true only when the primary source failed
 * - Uses the language-appropriate local collection
 * - Throws an error if no valid facts are available from any source
 *
 * @returns {Promise<{fact: object, isFromFallback: boolean, timestamp: Date}>} A FactResponse
 * @throws {Error} If no valid facts are available from any source
 */
export async function getRandomFact() {
  let facts;
  let isFromFallback = false;

  // Step 1: Attempt to fetch from primary source (repository/API)
  try {
    const repoFacts = await fetchAllFacts();
    // Filter out invalid facts
    const validRepoFacts = repoFacts.filter(validateFact);

    // Check if the repo returned any API-sourced facts
    const hasApiFacts = repoFacts.some((f) => f.source === 'api');

    if (hasApiFacts) {
      // Repo fetched from external API
      facts = validRepoFacts; // may be empty if all API facts were invalid
    } else {
      // Repo fell back to its own local collection — use language-appropriate collection instead
      facts = getLocalFactsForLanguage().filter(validateFact);
    }
  } catch {
    // Primary source failed entirely
    facts = [];
  }

  // Step 2: If no valid facts yet, fall back to local collection for current language
  if (!facts || facts.length === 0) {
    isFromFallback = true;
    facts = getLocalFactsForLanguage().filter(validateFact);
  }

  // Step 3: If no valid facts from any source, throw an error
  if (facts.length === 0) {
    throw new Error('No valid facts are available from any source');
  }

  // Step 4: Select a random fact avoiding consecutive duplicates
  const selectedFact = selectRandomFact(facts, lastDisplayedFactId);

  // Step 5: Update the last displayed fact id
  lastDisplayedFactId = selectedFact.id;

  // Step 6: Build and return the response
  return createFactResponse({
    fact: selectedFact,
    isFromFallback,
  });
}

/**
 * Selects a random fact from the provided list, optionally excluding a specific fact id.
 *
 * @param {Array} facts - Non-empty array of Fact objects
 * @param {number|null|undefined} excludeId - Id of a fact to exclude from selection (optional)
 * @returns {object} A randomly selected Fact from the list
 * @throws {Error} If facts array is empty
 */
export function selectRandomFact(facts, excludeId) {
  if (!Array.isArray(facts) || facts.length === 0) {
    throw new Error('Facts array must be non-empty');
  }

  let availableFacts = facts;

  // Filter out the excluded fact only if there's more than one option
  if (excludeId != null && facts.length > 1) {
    availableFacts = facts.filter((fact) => fact.id !== excludeId);
  }

  // Select uniformly at random from the eligible facts
  const randomIndex = Math.floor(Math.random() * availableFacts.length);
  return availableFacts[randomIndex];
}
