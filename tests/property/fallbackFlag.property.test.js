import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { VALID_CATEGORIES, VALID_SOURCES, MAX_TEXT_LENGTH } from '../../src/models/fact.js';

/**
 * Property 3: Fallback flag accuracy
 *
 * For any call to getRandomFact(), the isFromFallback field in the returned
 * FactResponse SHALL be TRUE if and only if the primary source was unavailable
 * and the fact was retrieved from the Local_Collection.
 *
 * **Validates: Requirements 4.1, 4.2, 4.3**
 */

// Mock the repository module before importing the service
vi.mock('../../src/repository/factRepository.js', () => ({
  fetchAllFacts: vi.fn(),
}));

// Mock localFacts to provide a controlled fallback source
vi.mock('../../src/repository/localFacts.js', () => ({
  localFacts: [
    Object.freeze({ id: 999, text: 'Fallback fact for testing', category: 'general', source: 'local' }),
    Object.freeze({ id: 998, text: 'Another fallback fact for testing', category: 'science', source: 'local' }),
  ],
}));

// Mock localFactsPtBr module
vi.mock('../../src/repository/localFactsPtBr.js', () => ({
  localFactsPtBr: [
    Object.freeze({ id: 999, text: 'Fato de fallback para teste', category: 'general', source: 'local' }),
    Object.freeze({ id: 998, text: 'Outro fato de fallback para teste', category: 'science', source: 'local' }),
  ],
}));

// Import after mocks are set up
const { fetchAllFacts } = await import('../../src/repository/factRepository.js');
const { getRandomFact, resetService } = await import('../../src/service/factService.js');

/**
 * Arbitrary for generating a non-empty array of valid facts with unique ids.
 */
const validFactsArrayArb = fc
  .integer({ min: 1, max: 10 })
  .chain((size) =>
    fc
      .uniqueArray(fc.integer({ min: 1, max: 10000 }), { minLength: size, maxLength: size })
      .chain((ids) =>
        fc.tuple(
          ...ids.map((id) =>
            fc.record({
              id: fc.constant(id),
              text: fc.string({ minLength: 1, maxLength: MAX_TEXT_LENGTH }),
              category: fc.constantFrom(...VALID_CATEGORIES),
              source: fc.constantFrom(...VALID_SOURCES),
            }).map((fact) => Object.freeze(fact))
          )
        )
      )
  );

describe('Property 3: Fallback flag accuracy', () => {
  beforeEach(() => {
    resetService();
    vi.clearAllMocks();
  });

  it('isFromFallback is FALSE when primary source (fetchAllFacts) succeeds with valid facts', async () => {
    await fc.assert(
      fc.asyncProperty(validFactsArrayArb, async (facts) => {
        fetchAllFacts.mockResolvedValue(facts);

        const response = await getRandomFact();

        expect(response.isFromFallback).toBe(false);

        // Reset state for next iteration
        resetService();
      }),
      { numRuns: 100 }
    );
  });

  it('isFromFallback is TRUE when primary source (fetchAllFacts) throws an error', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (errorMessage) => {
          fetchAllFacts.mockRejectedValue(new Error(errorMessage));

          const response = await getRandomFact();

          expect(response.isFromFallback).toBe(true);

          // Reset state for next iteration
          resetService();
        }
      ),
      { numRuns: 100 }
    );
  });
});
