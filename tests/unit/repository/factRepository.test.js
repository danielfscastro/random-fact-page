import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  fetchAllFacts,
  fetchFactByIndex,
  getCount,
  setFetchFn,
  setApiUrl,
  reset,
} from '../../../src/repository/factRepository.js';
import { localFacts } from '../../../src/repository/localFacts.js';
import { validateFact } from '../../../src/utils/validateFact.js';

describe('factRepository', () => {
  beforeEach(() => {
    reset();
  });

  describe('fetchAllFacts', () => {
    it('should return local facts when API is unavailable', async () => {
      setFetchFn(() => Promise.reject(new Error('Network error')));

      const facts = await fetchAllFacts();

      expect(facts).toEqual(localFacts);
      expect(facts.length).toBeGreaterThanOrEqual(10);
    });

    it('should return local facts when fetch function is not set', async () => {
      setFetchFn(null);

      const facts = await fetchAllFacts();

      expect(facts).toEqual(localFacts);
    });

    it('should return API facts when API responds successfully', async () => {
      const apiData = [
        { id: 100, text: 'API fact one', category: 'science', source: 'api' },
        { id: 101, text: 'API fact two', category: 'history', source: 'api' },
      ];

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(apiData),
      });
      setFetchFn(mockFetch);

      const facts = await fetchAllFacts();

      expect(facts.length).toBe(2);
      expect(facts[0].id).toBe(100);
      expect(facts[0].source).toBe('api');
      expect(facts[1].id).toBe(101);
    });

    it('should fall back to local facts when API returns non-ok status', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });
      setFetchFn(mockFetch);

      const facts = await fetchAllFacts();

      expect(facts).toEqual(localFacts);
    });

    it('should fall back to local facts when API returns invalid JSON structure', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ notAnArray: true }),
      });
      setFetchFn(mockFetch);

      const facts = await fetchAllFacts();

      expect(facts).toEqual(localFacts);
    });

    it('should enforce 3-second timeout on API requests', async () => {
      const mockFetch = vi.fn().mockImplementation((_url, options) => {
        return new Promise((resolve, reject) => {
          const checkAbort = setInterval(() => {
            if (options?.signal?.aborted) {
              clearInterval(checkAbort);
              reject(new DOMException('Aborted', 'AbortError'));
            }
          }, 10);
        });
      });
      setFetchFn(mockFetch);

      vi.useFakeTimers();

      const factsPromise = fetchAllFacts();

      // Advance time past the 3-second timeout
      await vi.advanceTimersByTimeAsync(3100);

      const facts = await factsPromise;

      expect(facts).toEqual(localFacts);

      vi.useRealTimers();
    });

    it('should reject invalid facts from API response', async () => {
      const apiData = [
        { id: 100, text: 'Valid fact', category: 'science', source: 'api' },
        { id: -1, text: 'Invalid id', category: 'science', source: 'api' }, // invalid id
        { id: 102, text: '', category: 'science', source: 'api' }, // empty text
        { id: 103, text: 'Bad category', category: 'invalid', source: 'api' }, // invalid category
      ];

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(apiData),
      });
      setFetchFn(mockFetch);

      const facts = await fetchAllFacts();

      expect(facts.length).toBe(1);
      expect(facts[0].id).toBe(100);
      expect(facts[0].text).toBe('Valid fact');
    });

    it('should fall back to local facts when all API facts are invalid', async () => {
      const apiData = [
        { id: -1, text: 'Invalid', category: 'science', source: 'api' },
        { id: 0, text: '', category: 'bad', source: 'api' },
      ];

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(apiData),
      });
      setFetchFn(mockFetch);

      const facts = await fetchAllFacts();

      expect(facts).toEqual(localFacts);
    });

    it('should pass abort signal to fetch function', async () => {
      const mockFetch = vi.fn().mockImplementation((_url, options) => {
        expect(options.signal).toBeInstanceOf(AbortSignal);
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: 1, text: 'Test fact', category: 'science', source: 'api' },
          ]),
        });
      });
      setFetchFn(mockFetch);

      await fetchAllFacts();

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('fetchFactByIndex', () => {
    it('should return the fact at the given index', () => {
      const fact = fetchFactByIndex(0);

      expect(fact).toEqual(localFacts[0]);
    });

    it('should return null for negative index', () => {
      const fact = fetchFactByIndex(-1);

      expect(fact).toBeNull();
    });

    it('should return null for index beyond collection size', () => {
      const fact = fetchFactByIndex(999);

      expect(fact).toBeNull();
    });

    it('should return the last fact for the last valid index', () => {
      const lastIndex = localFacts.length - 1;
      const fact = fetchFactByIndex(lastIndex);

      expect(fact).toEqual(localFacts[lastIndex]);
    });
  });

  describe('getCount', () => {
    it('should return the number of local facts', () => {
      const count = getCount();

      expect(count).toBe(localFacts.length);
      expect(count).toBeGreaterThanOrEqual(10);
    });
  });

  describe('caching', () => {
    it('should cache local collection after first load', () => {
      // First call loads the collection
      const count1 = getCount();
      // Second call should use cached version
      const count2 = getCount();

      expect(count1).toBe(count2);
    });

    it('should return same reference for cached local facts', async () => {
      setFetchFn(() => Promise.reject(new Error('fail')));

      const facts1 = await fetchAllFacts();
      const facts2 = await fetchAllFacts();

      // Same cached reference
      expect(facts1).toBe(facts2);
    });
  });

  describe('validation of all returned facts', () => {
    it('should return only valid facts from API', async () => {
      const apiData = [
        { id: 1, text: 'Fact one', category: 'science', source: 'api' },
        { id: 2, text: 'Fact two', category: 'nature', source: 'api' },
      ];

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(apiData),
      });
      setFetchFn(mockFetch);

      const facts = await fetchAllFacts();

      for (const fact of facts) {
        expect(validateFact(fact)).toBe(true);
      }
    });

    it('should have all local fallback facts pass validation', async () => {
      setFetchFn(() => Promise.reject(new Error('fail')));

      const facts = await fetchAllFacts();

      for (const fact of facts) {
        expect(validateFact(fact)).toBe(true);
      }
    });
  });
});
