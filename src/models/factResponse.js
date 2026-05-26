/**
 * Factory function to create a FactResponse instance.
 *
 * @param {object} params
 * @param {object} params.fact - A valid Fact object
 * @param {boolean} params.isFromFallback - Whether the fact came from the fallback source
 * @param {Date} [params.timestamp] - Timestamp of the response (defaults to now)
 * @returns {{ fact: object, isFromFallback: boolean, timestamp: Date }}
 */
export function createFactResponse({ fact, isFromFallback, timestamp = new Date() }) {
  return Object.freeze({
    fact,
    isFromFallback,
    timestamp,
  });
}
