import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { selectRandomFact, getRandomFact, resetService } from '../../../src/service/factService.js';

describe('selectRandomFact', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const facts = [
    { id: 1, text: 'Fact one', category: 'science', source: 'local' },
    { id: 2, text: 'Fact two', category: 'history', source: 'local' },
    { id: 3, text: 'Fact three', category: 'nature', source: 'local' },
  ];

  it('throws an error if facts array is empty', () => {
    expect(() => selectRandomFact([])).toThrow('Facts array must be non-empty');
  });

  it('throws an error if facts is not an array', () => {
    expect(() => selectRandomFact(null)).toThrow('Facts array must be non-empty');
    expect(() => selectRandomFact(undefined)).toThrow('Facts array must be non-empty');
  });

  it('returns the only fact when list has one item, regardless of excludeId', () => {
    const singleFact = [{ id: 5, text: 'Only fact', category: 'general', source: 'local' }];
    const result = selectRandomFact(singleFact, 5);
    expect(result).toEqual(singleFact[0]);
  });

  it('returns a fact from the list', () => {
    const result = selectRandomFact(facts);
    expect(facts).toContainEqual(result);
  });

  it('excludes the fact with excludeId when list has more than one item', () => {
    // Mock Math.random to always return 0 (first element)
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const result = selectRandomFact(facts, 1);
    expect(result.id).not.toBe(1);
  });

  it('does not exclude when excludeId is null', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const result = selectRandomFact(facts, null);
    // With Math.random() = 0, should pick first element (id: 1)
    expect(result.id).toBe(1);
  });

  it('does not exclude when excludeId is undefined', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const result = selectRandomFact(facts, undefined);
    expect(result.id).toBe(1);
  });

  it('selects uniformly from eligible facts based on Math.random', () => {
    // Math.random() = 0.99 should pick the last element
    vi.spyOn(Math, 'random').mockReturnValue(0.99);

    const result = selectRandomFact(facts);
    expect(result.id).toBe(3);
  });

  it('returns a fact from the original list even when excludeId does not match any fact', () => {
    const result = selectRandomFact(facts, 999);
    expect(facts).toContainEqual(result);
  });
});


// Mock the repository module
vi.mock('../../../src/repository/factRepository.js', () => ({
  fetchAllFacts: vi.fn(),
}));

// Mock localFacts module
vi.mock('../../../src/repository/localFacts.js', () => ({
  localFacts: [
    { id: 101, text: 'Local fact one', category: 'science', source: 'local' },
    { id: 102, text: 'Local fact two', category: 'history', source: 'local' },
    { id: 103, text: 'Local fact three', category: 'nature', source: 'local' },
  ],
}));

// Mock localFactsPtBr module
vi.mock('../../../src/repository/localFactsPtBr.js', () => ({
  localFactsPtBr: [
    { id: 101, text: 'Fato local um', category: 'science', source: 'local' },
    { id: 102, text: 'Fato local dois', category: 'history', source: 'local' },
    { id: 103, text: 'Fato local três', category: 'nature', source: 'local' },
  ],
}));

describe('getRandomFact', () => {
  let fetchAllFacts;

  beforeEach(async () => {
    resetService();
    const repo = await import('../../../src/repository/factRepository.js');
    fetchAllFacts = repo.fetchAllFacts;
    fetchAllFacts.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns a fact from the primary source when available', async () => {
    const apiFacts = [
      { id: 1, text: 'API fact one', category: 'science', source: 'api' },
      { id: 2, text: 'API fact two', category: 'history', source: 'api' },
    ];
    fetchAllFacts.mockResolvedValue(apiFacts);

    const result = await getRandomFact();

    expect(result.fact).toBeDefined();
    expect(apiFacts).toContainEqual(result.fact);
    expect(result.isFromFallback).toBe(false);
    expect(result.timestamp).toBeInstanceOf(Date);
  });

  it('falls back to local facts when primary source throws', async () => {
    fetchAllFacts.mockRejectedValue(new Error('Network error'));

    const result = await getRandomFact();

    expect(result.fact).toBeDefined();
    expect(result.isFromFallback).toBe(true);
    expect([101, 102, 103]).toContain(result.fact.id);
  });

  it('falls back to local facts when primary source returns no valid facts', async () => {
    // Return facts that fail validation (empty text)
    const invalidFacts = [
      { id: 1, text: '', category: 'science', source: 'api' },
      { id: 2, text: '', category: 'history', source: 'api' },
    ];
    fetchAllFacts.mockResolvedValue(invalidFacts);

    const result = await getRandomFact();

    expect(result.isFromFallback).toBe(true);
    expect([101, 102, 103]).toContain(result.fact.id);
  });

  it('filters out invalid facts from primary source', async () => {
    const mixedFacts = [
      { id: 1, text: '', category: 'science', source: 'api' }, // invalid: empty text
      { id: 2, text: 'Valid fact', category: 'history', source: 'api' }, // valid
    ];
    fetchAllFacts.mockResolvedValue(mixedFacts);

    const result = await getRandomFact();

    expect(result.fact.id).toBe(2);
    expect(result.isFromFallback).toBe(false);
  });

  it('avoids consecutive duplicates', async () => {
    const apiFacts = [
      { id: 1, text: 'Fact one', category: 'science', source: 'api' },
      { id: 2, text: 'Fact two', category: 'history', source: 'api' },
      { id: 3, text: 'Fact three', category: 'nature', source: 'api' },
    ];
    fetchAllFacts.mockResolvedValue(apiFacts);

    const first = await getRandomFact();
    // Mock Math.random to force selection of a different fact
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const second = await getRandomFact();

    // With more than one fact, consecutive calls should not return the same id
    if (apiFacts.length > 1) {
      expect(second.fact.id).not.toBe(first.fact.id);
    }
  });

  it('throws an error when no valid facts are available from any source', async () => {
    fetchAllFacts.mockRejectedValue(new Error('Network error'));

    // Override the localFacts mock to return empty for this test
    const localFactsModule = await import('../../../src/repository/localFacts.js');
    const originalLocalFacts = localFactsModule.localFacts;
    localFactsModule.localFacts.length = 0;

    await expect(getRandomFact()).rejects.toThrow('No valid facts are available from any source');

    // Restore
    originalLocalFacts.push(
      { id: 101, text: 'Local fact one', category: 'science', source: 'local' },
      { id: 102, text: 'Local fact two', category: 'history', source: 'local' },
      { id: 103, text: 'Local fact three', category: 'nature', source: 'local' },
    );
  });

  it('sets isFromFallback to false when primary source succeeds', async () => {
    const apiFacts = [
      { id: 1, text: 'API fact', category: 'science', source: 'api' },
    ];
    fetchAllFacts.mockResolvedValue(apiFacts);

    const result = await getRandomFact();

    expect(result.isFromFallback).toBe(false);
  });
});

describe('resetService', () => {
  beforeEach(async () => {
    const repo = await import('../../../src/repository/factRepository.js');
    repo.fetchAllFacts.mockReset();
  });

  it('resets lastDisplayedFactId so next call does not exclude any id', async () => {
    const { fetchAllFacts } = await import('../../../src/repository/factRepository.js');
    const apiFacts = [
      { id: 1, text: 'Fact one', category: 'science', source: 'api' },
      { id: 2, text: 'Fact two', category: 'history', source: 'api' },
    ];
    fetchAllFacts.mockResolvedValue(apiFacts);

    // Get a fact to set lastDisplayedFactId
    await getRandomFact();

    // Reset the service
    resetService();

    // Mock Math.random to return 0 (first element)
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const result = await getRandomFact();
    // After reset, any fact can be returned (no exclusion)
    expect(result.fact.id).toBe(1);
  });
});
