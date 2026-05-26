import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { selectRandomFact } from '../../src/service/factService.js';
import { VALID_CATEGORIES, VALID_SOURCES, MAX_TEXT_LENGTH } from '../../src/models/fact.js';

/**
 * Arbitrary for generating a valid fact with a given id.
 */
const factArb = (id) =>
  fc.record({
    id: fc.constant(id),
    text: fc.string({ minLength: 1, maxLength: MAX_TEXT_LENGTH }),
    category: fc.constantFrom(...VALID_CATEGORIES),
    source: fc.constantFrom(...VALID_SOURCES),
  });

/**
 * Property 1: No consecutive duplicates
 *
 * For any generated list of facts (size > 1) and any previousId present in the list,
 * verify selectRandomFact(facts, previousId) returns a fact with a different id.
 *
 * **Validates: Requirement 3.1**
 */
describe('Property 1: No consecutive duplicates', () => {
  // Arbitrary for generating a list of facts with unique positive integer ids
  const factsWithPreviousIdArb = fc
    .integer({ min: 2, max: 20 })
    .chain((size) =>
      fc
        .uniqueArray(fc.integer({ min: 1, max: 10000 }), { minLength: size, maxLength: size })
        .chain((ids) =>
          fc.tuple(
            fc.tuple(
              ...ids.map((id) =>
                fc.record({
                  id: fc.constant(id),
                  text: fc.string({ minLength: 1, maxLength: MAX_TEXT_LENGTH }),
                  category: fc.constantFrom(...VALID_CATEGORIES),
                  source: fc.constantFrom(...VALID_SOURCES),
                })
              )
            ),
            fc.constantFrom(...ids)
          )
        )
    )
    .map(([facts, previousId]) => ({ facts, previousId }));

  it('selectRandomFact never returns a fact with the same id as previousId when list size > 1', () => {
    fc.assert(
      fc.property(factsWithPreviousIdArb, ({ facts, previousId }) => {
        const result = selectRandomFact(facts, previousId);
        expect(result.id).not.toBe(previousId);
      }),
      { numRuns: 500 }
    );
  });
});


/**
 * Property 2: Selection always returns a collection member
 *
 * For any non-empty list of valid facts and any excludeId value,
 * verify the returned fact is a member of the input list.
 *
 * **Validates: Requirements 3.1, 3.2**
 */
describe('Property 2: Selection always returns a collection member', () => {
  // Arbitrary for generating a non-empty list of valid facts with unique ids
  const factsArb = fc
    .integer({ min: 1, max: 20 })
    .chain((size) =>
      fc
        .uniqueArray(fc.integer({ min: 1, max: 10000 }), { minLength: size, maxLength: size })
        .chain((ids) => fc.tuple(...ids.map((id) => factArb(id))))
    );

  // Arbitrary for excludeId: either null, undefined, or a random integer (may or may not be in the list)
  const excludeIdArb = fc.oneof(
    fc.constant(null),
    fc.constant(undefined),
    fc.integer({ min: 1, max: 10000 })
  );

  it('selectRandomFact always returns a fact that exists in the input list', () => {
    fc.assert(
      fc.property(factsArb, excludeIdArb, (facts, excludeId) => {
        const result = selectRandomFact(facts, excludeId);

        // The returned fact must be a member of the input list (by reference or by id)
        const isInList = facts.some((f) => f.id === result.id);
        expect(isInList).toBe(true);
      }),
      { numRuns: 500 }
    );
  });
});
