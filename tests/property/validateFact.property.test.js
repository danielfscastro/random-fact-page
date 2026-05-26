import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateFact } from '../../src/utils/validateFact.js';
import { VALID_CATEGORIES, VALID_SOURCES, MAX_TEXT_LENGTH } from '../../src/models/fact.js';

/**
 * Property 4: Fact validation correctness
 *
 * For any Fact structure, validateFact(fact) SHALL return TRUE if and only if
 * the fact has an id greater than zero, a non-empty text field of at most 500
 * characters, a category in {"science", "history", "nature", "technology", "general"},
 * and a source in {"local", "api"}.
 *
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.4**
 */
describe('Property 4: Fact validation correctness', () => {
  // Arbitrary for valid facts - all fields meet constraints
  const validFactArb = fc.record({
    id: fc.integer({ min: 1, max: Number.MAX_SAFE_INTEGER }),
    text: fc.string({ minLength: 1, maxLength: MAX_TEXT_LENGTH }),
    category: fc.constantFrom(...VALID_CATEGORIES),
    source: fc.constantFrom(...VALID_SOURCES),
  });

  // Arbitrary for invalid id values (zero, negative, non-integer, non-number)
  const invalidIdArb = fc.oneof(
    fc.constant(0),
    fc.integer({ min: -1000, max: -1 }),
    fc.double({ min: 0.1, max: 100, noInteger: true }),
    fc.string(),
    fc.constant(null),
    fc.constant(undefined)
  );

  // Arbitrary for invalid text values (empty, too long, non-string)
  const invalidTextArb = fc.oneof(
    fc.constant(''),
    fc.string({ minLength: MAX_TEXT_LENGTH + 1, maxLength: MAX_TEXT_LENGTH + 100 }),
    fc.integer(),
    fc.constant(null),
    fc.constant(undefined)
  );

  // Arbitrary for invalid category values
  const invalidCategoryArb = fc.string().filter(s => !VALID_CATEGORIES.includes(s));

  // Arbitrary for invalid source values
  const invalidSourceArb = fc.string().filter(s => !VALID_SOURCES.includes(s));

  it('returns true for any fact with all valid fields', () => {
    fc.assert(
      fc.property(validFactArb, (fact) => {
        expect(validateFact(fact)).toBe(true);
      }),
      { numRuns: 200 }
    );
  });

  it('returns false for any fact with an invalid id', () => {
    fc.assert(
      fc.property(
        invalidIdArb,
        fc.string({ minLength: 1, maxLength: MAX_TEXT_LENGTH }),
        fc.constantFrom(...VALID_CATEGORIES),
        fc.constantFrom(...VALID_SOURCES),
        (id, text, category, source) => {
          const fact = { id, text, category, source };
          expect(validateFact(fact)).toBe(false);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('returns false for any fact with invalid text', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: Number.MAX_SAFE_INTEGER }),
        invalidTextArb,
        fc.constantFrom(...VALID_CATEGORIES),
        fc.constantFrom(...VALID_SOURCES),
        (id, text, category, source) => {
          const fact = { id, text, category, source };
          expect(validateFact(fact)).toBe(false);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('returns false for any fact with an invalid category', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: Number.MAX_SAFE_INTEGER }),
        fc.string({ minLength: 1, maxLength: MAX_TEXT_LENGTH }),
        invalidCategoryArb,
        fc.constantFrom(...VALID_SOURCES),
        (id, text, category, source) => {
          const fact = { id, text, category, source };
          expect(validateFact(fact)).toBe(false);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('returns false for any fact with an invalid source', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: Number.MAX_SAFE_INTEGER }),
        fc.string({ minLength: 1, maxLength: MAX_TEXT_LENGTH }),
        fc.constantFrom(...VALID_CATEGORIES),
        invalidSourceArb,
        (id, text, category, source) => {
          const fact = { id, text, category, source };
          expect(validateFact(fact)).toBe(false);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('returns false for null or undefined input', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(null, undefined),
        (fact) => {
          expect(validateFact(fact)).toBe(false);
        }
      )
    );
  });
});
