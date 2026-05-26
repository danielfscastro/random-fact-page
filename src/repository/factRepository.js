import { createFact } from '../models/fact.js';
import { validateFact } from '../utils/validateFact.js';
import { localFacts } from './localFacts.js';

/**
 * Default API URL for external fact fetching.
 * Can be overridden via setApiUrl for configuration.
 */
let apiUrl = 'https://api.example.com/facts';

/**
 * Injectable fetch function for testability.
 * Defaults to null in browser (no external API configured).
 * Set via setFetchFn() to enable external API fetching.
 */
let fetchFn = null;

/**
 * Cached local fact collection. Loaded once on first access.
 */
let cachedLocalFacts = null;

/**
 * API request timeout in milliseconds.
 */
const API_TIMEOUT_MS = 3000;

/**
 * Sets the fetch function used for external API calls.
 * Useful for testing or dependency injection.
 *
 * @param {Function} fn - A fetch-compatible function
 */
export function setFetchFn(fn) {
  fetchFn = fn;
}

/**
 * Sets the external API URL.
 *
 * @param {string} url - The API endpoint URL
 */
export function setApiUrl(url) {
  apiUrl = url;
}

/**
 * Resets the repository state (useful for testing).
 */
export function reset() {
  cachedLocalFacts = null;
  fetchFn = null;
  apiUrl = 'https://api.example.com/facts';
}

/**
 * Loads and caches the local fact collection.
 * Returns the cached version on subsequent calls.
 *
 * @returns {Array} The local facts array
 */
function getLocalFacts() {
  if (cachedLocalFacts === null) {
    cachedLocalFacts = localFacts;
  }
  return cachedLocalFacts;
}

/**
 * Fetches facts from the external API with a 3-second timeout.
 * Validates all returned facts before returning them.
 *
 * @returns {Promise<Array>} Array of valid Fact objects from the API
 * @throws {Error} If the API request fails, times out, or returns invalid data
 */
async function fetchFromApi() {
  if (!fetchFn) {
    throw new Error('Fetch function is not available');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetchFn(apiUrl, { signal: controller.signal });

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error('API response is not an array');
    }

    // Create fact objects and validate each one
    const facts = [];
    for (const item of data) {
      const fact = createFact({
        id: item.id,
        text: item.text,
        category: item.category,
        source: 'api',
      });

      if (validateFact(fact)) {
        facts.push(fact);
      }
    }

    if (facts.length === 0) {
      throw new Error('No valid facts in API response');
    }

    return facts;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetches all available facts.
 * Tries the external API first; on failure, falls back to the local collection.
 *
 * @returns {Promise<Array>} Array of Fact objects
 */
export async function fetchAllFacts() {
  try {
    const apiFacts = await fetchFromApi();
    return apiFacts;
  } catch {
    // Fall back to local collection on any API failure
    return getLocalFacts();
  }
}

/**
 * Fetches a fact by its index in the local collection.
 *
 * @param {number} index - Zero-based index into the fact collection
 * @returns {object|null} The Fact at the given index, or null if out of bounds
 */
export function fetchFactByIndex(index) {
  const facts = getLocalFacts();
  if (index < 0 || index >= facts.length) {
    return null;
  }
  return facts[index];
}

/**
 * Returns the count of facts in the local collection.
 *
 * @returns {number} The number of locally available facts
 */
export function getCount() {
  return getLocalFacts().length;
}
