import { describe, it, expect } from 'vitest';
import { validateFact } from '../../../src/utils/validateFact.js';

describe('validateFact', () => {
  const validFact = {
    id: 1,
    text: 'Water is wet.',
    category: 'science',
    source: 'local',
  };

  it('returns true for a valid fact', () => {
    expect(validateFact(validFact)).toBe(true);
  });

  it('returns true for all valid categories', () => {
    const categories = ['science', 'history', 'nature', 'technology', 'general'];
    for (const category of categories) {
      expect(validateFact({ ...validFact, category })).toBe(true);
    }
  });

  it('returns true for all valid sources', () => {
    expect(validateFact({ ...validFact, source: 'local' })).toBe(true);
    expect(validateFact({ ...validFact, source: 'api' })).toBe(true);
  });

  it('returns false for null input', () => {
    expect(validateFact(null)).toBe(false);
  });

  it('returns false for undefined input', () => {
    expect(validateFact(undefined)).toBe(false);
  });

  it('returns false when id is 0', () => {
    expect(validateFact({ ...validFact, id: 0 })).toBe(false);
  });

  it('returns false when id is negative', () => {
    expect(validateFact({ ...validFact, id: -1 })).toBe(false);
  });

  it('returns false when id is not an integer', () => {
    expect(validateFact({ ...validFact, id: 1.5 })).toBe(false);
  });

  it('returns false when id is not a number', () => {
    expect(validateFact({ ...validFact, id: '1' })).toBe(false);
  });

  it('returns false when text is empty', () => {
    expect(validateFact({ ...validFact, text: '' })).toBe(false);
  });

  it('returns false when text exceeds 500 characters', () => {
    expect(validateFact({ ...validFact, text: 'a'.repeat(501) })).toBe(false);
  });

  it('returns true when text is exactly 500 characters', () => {
    expect(validateFact({ ...validFact, text: 'a'.repeat(500) })).toBe(true);
  });

  it('returns false when text is not a string', () => {
    expect(validateFact({ ...validFact, text: 123 })).toBe(false);
  });

  it('returns false when category is invalid', () => {
    expect(validateFact({ ...validFact, category: 'sports' })).toBe(false);
  });

  it('returns false when category is missing', () => {
    expect(validateFact({ ...validFact, category: undefined })).toBe(false);
  });

  it('returns false when source is invalid', () => {
    expect(validateFact({ ...validFact, source: 'database' })).toBe(false);
  });

  it('returns false when source is missing', () => {
    expect(validateFact({ ...validFact, source: undefined })).toBe(false);
  });
});
