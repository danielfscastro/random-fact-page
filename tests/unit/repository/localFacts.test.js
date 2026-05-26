import { describe, it, expect } from 'vitest';
import { localFacts } from '../../../src/repository/localFacts.js';
import { VALID_CATEGORIES, VALID_SOURCES } from '../../../src/models/fact.js';
import { validateFact } from '../../../src/utils/validateFact.js';

describe('localFacts', () => {
  it('should contain at least 10 facts', () => {
    expect(localFacts.length).toBeGreaterThanOrEqual(10);
  });

  it('should have all facts with source "local"', () => {
    for (const fact of localFacts) {
      expect(fact.source).toBe('local');
    }
  });

  it('should cover all valid categories', () => {
    const categories = new Set(localFacts.map((f) => f.category));
    for (const category of VALID_CATEGORIES) {
      expect(categories.has(category)).toBe(true);
    }
  });

  it('should have at least 2 facts per category', () => {
    const categoryCounts = {};
    for (const fact of localFacts) {
      categoryCounts[fact.category] = (categoryCounts[fact.category] || 0) + 1;
    }
    for (const category of VALID_CATEGORIES) {
      expect(categoryCounts[category]).toBeGreaterThanOrEqual(2);
    }
  });

  it('should have unique positive integer ids', () => {
    const ids = localFacts.map((f) => f.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toBeGreaterThan(0);
    }
  });

  it('should have all facts pass validation', () => {
    for (const fact of localFacts) {
      expect(validateFact(fact)).toBe(true);
    }
  });

  it('should have all facts be frozen objects', () => {
    for (const fact of localFacts) {
      expect(Object.isFrozen(fact)).toBe(true);
    }
  });
});
