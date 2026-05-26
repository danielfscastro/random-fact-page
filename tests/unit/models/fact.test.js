import { describe, it, expect } from 'vitest';
import { createFact, VALID_CATEGORIES, VALID_SOURCES, MAX_TEXT_LENGTH } from '../../../src/models/fact.js';

describe('createFact', () => {
  it('creates a fact with all valid fields', () => {
    const fact = createFact({
      id: 1,
      text: 'Water boils at 100°C at sea level.',
      category: 'science',
      source: 'local',
    });

    expect(fact.id).toBe(1);
    expect(fact.text).toBe('Water boils at 100°C at sea level.');
    expect(fact.category).toBe('science');
    expect(fact.source).toBe('local');
  });

  it('creates a frozen (immutable) object', () => {
    const fact = createFact({
      id: 2,
      text: 'The Great Wall of China is visible from space.',
      category: 'history',
      source: 'api',
    });

    expect(Object.isFrozen(fact)).toBe(true);
  });

  it('supports all valid categories', () => {
    VALID_CATEGORIES.forEach((category) => {
      const fact = createFact({ id: 1, text: 'Test', category, source: 'local' });
      expect(fact.category).toBe(category);
    });
  });

  it('supports all valid sources', () => {
    VALID_SOURCES.forEach((source) => {
      const fact = createFact({ id: 1, text: 'Test', category: 'general', source });
      expect(fact.source).toBe(source);
    });
  });
});

describe('constants', () => {
  it('VALID_CATEGORIES contains expected values', () => {
    expect(VALID_CATEGORIES).toEqual(['science', 'history', 'nature', 'technology', 'general']);
  });

  it('VALID_SOURCES contains expected values', () => {
    expect(VALID_SOURCES).toEqual(['local', 'api']);
  });

  it('MAX_TEXT_LENGTH is 500', () => {
    expect(MAX_TEXT_LENGTH).toBe(500);
  });
});
