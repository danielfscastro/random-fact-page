import { getRandomFact, setLanguage, getLanguage, getCurrentFactInLanguage } from '../service/factService.js';

/**
 * Module-level callbacks registered by the UI layer.
 */
let callbacks = {
  onFact: null,
  onLoading: null,
  onError: null,
};

/**
 * Timestamp of the last successful request start for rate limiting.
 * Requests within 1 second of the last request are ignored.
 */
let lastRequestTime = 0;

/**
 * Registers UI callbacks for the controller to invoke.
 *
 * @param {object} cbs
 * @param {function} cbs.onFact - Called with a FactResponse when a fact is successfully retrieved
 * @param {function} cbs.onLoading - Called with a boolean indicating loading state
 * @param {function} cbs.onError - Called with an error message string
 */
export function setCallbacks({ onFact, onLoading, onError }) {
  callbacks.onFact = onFact ?? null;
  callbacks.onLoading = onLoading ?? null;
  callbacks.onError = onError ?? null;
}

/**
 * Requests a new random fact from the Fact Service.
 * Manages loading and error states via registered callbacks.
 * Rate-limited: ignores requests within 1 second of the last request.
 *
 * @returns {Promise<object|undefined>} The FactResponse on success, undefined on error or rate-limited
 */
export async function requestRandomFact() {
  const now = Date.now();
  if (now - lastRequestTime < 1000) {
    return undefined;
  }
  lastRequestTime = now;

  if (callbacks.onLoading) {
    callbacks.onLoading(true);
  }

  try {
    const factResponse = await getRandomFact();

    if (callbacks.onLoading) {
      callbacks.onLoading(false);
    }

    if (callbacks.onFact) {
      callbacks.onFact(factResponse);
    }

    return factResponse;
  } catch (error) {
    if (callbacks.onLoading) {
      callbacks.onLoading(false);
    }

    const message = error?.message || 'Unable to load a new fact.';
    if (callbacks.onError) {
      callbacks.onError(message);
    }

    return undefined;
  }
}

/**
 * Initializes the controller by fetching the first fact on page load.
 * This is NOT rate-limited — it always fetches immediately.
 *
 * @returns {Promise<object|undefined>} The FactResponse on success, or undefined on error
 */
export async function initialize() {
  // Reset the rate limit timer so initialize is never blocked
  lastRequestTime = 0;
  return requestRandomFact();
}

/**
 * Resets the controller state (useful for testing).
 * Clears the rate limit timer and all registered callbacks.
 */
export function resetController() {
  lastRequestTime = 0;
  callbacks = {
    onFact: null,
    onLoading: null,
    onError: null,
  };
}

/**
 * Changes the language and displays the current fact in the new language.
 * Bypasses rate limiting to ensure immediate response.
 *
 * @param {'en' | 'pt-br'} lang - The language to switch to
 * @returns {Promise<object|undefined>} The FactResponse on success, or undefined on error
 */
export async function changeLanguage(lang) {
  setLanguage(lang);
  lastRequestTime = 0; // Bypass rate limit for language change

  if (callbacks.onLoading) {
    callbacks.onLoading(true);
  }

  try {
    const factResponse = await getCurrentFactInLanguage();

    if (callbacks.onLoading) {
      callbacks.onLoading(false);
    }

    if (callbacks.onFact) {
      callbacks.onFact(factResponse);
    }

    return factResponse;
  } catch (error) {
    if (callbacks.onLoading) {
      callbacks.onLoading(false);
    }

    const message = error?.message || 'Unable to load a new fact.';
    if (callbacks.onError) {
      callbacks.onError(message);
    }

    return undefined;
  }
}
