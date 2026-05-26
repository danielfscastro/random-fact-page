import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { VALID_CATEGORIES, VALID_SOURCES, MAX_TEXT_LENGTH } from '../../src/models/fact.js';
import { validateFact } from '../../src/utils/validateFact.js';

/**
 * Property 5: Invalid facts are never returned
 *
 * For any fact collection containing a mix of valid and invalid facts,
 * `getRandomFact()` SHALL only return facts that pass validation, skipping invalid entries.
 *
 * **Validates: Requirement 5.5**
 */

// Mock the repository module before importing the service
vi.mock('../../src/repository/factRepository.js', () => ({
  fetchAllFacts: vi.fn(),
}));

// Mock localFacts with known valid facts as fallback
vi.mock('../../src/repository/localFacts.js', () => ({
  localFacts: [
    Object.freeze({ id: 901, text: 'Valid fallback fact one', category: 'science', source: 'local' }),
    Object.freeze({ id: 902, text: 'Valid fallback fact two', category: 'history', source: 'local' }),
    Object.freeze({ id: 903, text: 'Valid fallback fact three', category: 'nature', source: 'local' }),
  ],
}));

// Mock localFactsPtBr module
vi.mock('../../src/repository/localFactsPtBr.js', () => ({
  localFactsPtBr: [
    Object.freeze({ id: 901, text: 'Fato válido um', category: 'science', source: 'local' }),
    Object.freeze({ id: 902, text: 'Fato válido dois', category: 'history', source: 'local' }),
    Object.freeze({ id: 903, text: 'Fato válido três', category: 'nature', source: 'local' }),
  ],
}));

// Import after mocks are set up
const { fetchAllFacts } = await import('../../src/repository/factRepository.js');
const { getRandomFact, resetService } = await import('../../src/service/factService.js');

/**
 * Arbitrary for generating a valid fact object.
 */
const validFactArb = fc
  .record({
    id: fc.integer({ min: 1, max: 10000 }),
    text: fc.string({ minLength: 1, maxLength: MAX_TEXT_LENGTH }),
    category: fc.constantFrom(...VALID_CATEGORIES),
    source: fc.constantFrom(...VALID_SOURCES),
  })
  .map((fact) => Object.freeze(fact));

/**
 * Arbitrary for generating an invalid fact object.
 * Each invalid fact violates at least one validation rule.
 */
const invalidFactArb = fc.oneof(
  // Invalid id: zero or negative
  fc.record({
    id: fc.integer({ min: -1000, max: 0 }),
    text: fc.string({ minLength: 1, maxLength: MAX_TEXT_LENGTH }),
    category: fc.constantFrom(...VALID_CATEGORIES),
    source: fc.constantFrom(...VALID_SOURCES),
  }),
  // Invalid text: empty string
  fc.record({
    id: fc.integer({ min: 1, max: 10000 }),
    text: fc.constant(''),
    category: fc.constantFrom(...VALID_CATEGORIES),
    source: fc.constantFrom(...VALID_SOURCES),
  }),
  // Invalid text: exceeds 500 characters
  fc.record({
    id: fc.integer({ min: 1, max: 10000 }),
    text: fc.string({ minLength: MAX_TEXT_LENGTH + 1, maxLength: MAX_TEXT_LENGTH + 50 }),
    category: fc.constantFrom(...VALID_CATEGORIES),
    source: fc.constantFrom(...VALID_SOURCES),
  }),
  // Invalid category
  fc.record({
    id: fc.integer({ min: 1, max: 10000 }),
    text: fc.string({ minLength: 1, maxLength: MAX_TEXT_LENGTH }),
    category: fc.constantFrom('invalid', 'unknown', 'fiction', 'sports'),
    source: fc.constantFrom(...VALID_SOURCES),
  }),
  // Invalid source
  fc.record({
    id: fc.integer({ min: 1, max: 10000 }),
    text: fc.string({ minLength: 1, maxLength: MAX_TEXT_LENGTH }),
    category: fc.constantFrom(...VALID_CATEGORIES),
    source: fc.constantFrom('unknown', 'web', 'database', ''),
  })
).map((fact) => Object.freeze(fact));

/**
 * Arbitrary for generating a mixed array with at least one invalid fact.
 * Returns arrays containing both valid and invalid facts.
 */
const mixedFactsArb = fc
  .tuple(
    fc.array(validFactArb, { minLength: 0, maxLength: 5 }),
    fc.array(invalidFactArb, { minLength: 1, maxLength: 5 })
  )
  .map(([validFacts, invalidFacts]) => fc.shuffledSubarray([...validFacts, ...invalidFacts], { minLength: validFacts.length + invalidFacts.length, maxLength: validFacts.length + invalidFacts.length }))
  .chain((arb) => arb);

describe('Property 5: Invalid facts are never returned', () => {
  beforeEach(() => {
    resetService();
    vi.clearAllMocks();
  });

  it('getRandomFact() never returns a fact that fails validateFact()', async () => {
    await fc.assert(
      fc.asyncProperty(mixedFactsArb, async (mixedFacts) => {
        fetchAllFacts.mockResolvedValue(mixedFacts);

        const response = await getRandomFact();

        // The returned fact must always pass validation
        expect(validateFact(response.fact)).toBe(true);

        // Reset state for next iteration
        resetService();
      }),
      { numRuns: 100 }
    );
  });

  it('when all primary facts are invalid, falls back to valid local facts', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(invalidFactArb, { minLength: 1, maxLength: 10 }),
        async (invalidFacts) => {
          fetchAllFacts.mockResolvedValue(invalidFacts);

          const response = await getRandomFact();

          // Must still return a valid fact regardless of source
          expect(validateFact(response.fact)).toBe(true);

          // Reset state for next iteration
          resetService();
        }
      ),
      { numRuns: 100 }
    );
  });
});
