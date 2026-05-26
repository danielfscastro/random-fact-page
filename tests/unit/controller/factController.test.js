import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { requestRandomFact, initialize, setCallbacks, resetController } from '../../../src/controller/factController.js';

vi.mock('../../../src/service/factService.js', () => ({
  getRandomFact: vi.fn(),
  setLanguage: vi.fn(),
  getLanguage: vi.fn(() => 'en'),
  getCurrentFactInLanguage: vi.fn(),
}));

import { getRandomFact } from '../../../src/service/factService.js';

describe('factController', () => {
  let onFact;
  let onLoading;
  let onError;

  beforeEach(() => {
    vi.clearAllMocks();
    resetController();
    onFact = vi.fn();
    onLoading = vi.fn();
    onError = vi.fn();
    setCallbacks({ onFact, onLoading, onError });
  });

  describe('requestRandomFact', () => {
    it('should call onLoading(true) before fetching and onLoading(false) after success', async () => {
      const mockResponse = { fact: { id: 1, text: 'Test fact' }, isFromFallback: false, timestamp: new Date() };
      getRandomFact.mockResolvedValue(mockResponse);

      await requestRandomFact();

      expect(onLoading).toHaveBeenCalledTimes(2);
      expect(onLoading).toHaveBeenNthCalledWith(1, true);
      expect(onLoading).toHaveBeenNthCalledWith(2, false);
    });

    it('should call onFact with the fact response on success', async () => {
      const mockResponse = { fact: { id: 1, text: 'Test fact' }, isFromFallback: false, timestamp: new Date() };
      getRandomFact.mockResolvedValue(mockResponse);

      const result = await requestRandomFact();

      expect(onFact).toHaveBeenCalledWith(mockResponse);
      expect(result).toBe(mockResponse);
    });

    it('should call onError with the error message on failure', async () => {
      getRandomFact.mockRejectedValue(new Error('No valid facts are available from any source'));

      const result = await requestRandomFact();

      expect(onError).toHaveBeenCalledWith('No valid facts are available from any source');
      expect(result).toBeUndefined();
    });

    it('should call onLoading(false) even when the service throws', async () => {
      getRandomFact.mockRejectedValue(new Error('Service error'));

      await requestRandomFact();

      expect(onLoading).toHaveBeenNthCalledWith(1, true);
      expect(onLoading).toHaveBeenNthCalledWith(2, false);
    });

    it('should not throw if no callbacks are registered', async () => {
      setCallbacks({ onFact: null, onLoading: null, onError: null });
      const mockResponse = { fact: { id: 1, text: 'Test fact' }, isFromFallback: false, timestamp: new Date() };
      getRandomFact.mockResolvedValue(mockResponse);

      const result = await requestRandomFact();

      expect(result).toBe(mockResponse);
    });

    it('should not call onFact when the service throws', async () => {
      getRandomFact.mockRejectedValue(new Error('fail'));

      await requestRandomFact();

      expect(onFact).not.toHaveBeenCalled();
    });

    it('should use a default error message when error has no message', async () => {
      getRandomFact.mockRejectedValue({});

      await requestRandomFact();

      expect(onError).toHaveBeenCalledWith('Unable to load a new fact.');
    });
  });

  describe('initialize', () => {
    it('should fetch the first fact on initialization', async () => {
      const mockResponse = { fact: { id: 2, text: 'Init fact' }, isFromFallback: false, timestamp: new Date() };
      getRandomFact.mockResolvedValue(mockResponse);

      const result = await initialize();

      expect(getRandomFact).toHaveBeenCalledTimes(1);
      expect(onFact).toHaveBeenCalledWith(mockResponse);
      expect(result).toBe(mockResponse);
    });

    it('should handle errors during initialization', async () => {
      getRandomFact.mockRejectedValue(new Error('Unable to load a fact. Please try again.'));

      const result = await initialize();

      expect(onError).toHaveBeenCalledWith('Unable to load a fact. Please try again.');
      expect(result).toBeUndefined();
    });
  });

  describe('setCallbacks', () => {
    it('should allow partial callback registration', async () => {
      setCallbacks({ onFact: onFact, onLoading: undefined, onError: undefined });
      const mockResponse = { fact: { id: 1, text: 'Test' }, isFromFallback: false, timestamp: new Date() };
      getRandomFact.mockResolvedValue(mockResponse);

      const result = await requestRandomFact();

      expect(onFact).toHaveBeenCalledWith(mockResponse);
      expect(result).toBe(mockResponse);
    });
  });

  describe('rate limiting', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return undefined for a second call within 1 second without calling the service', async () => {
      const mockResponse = { fact: { id: 1, text: 'First fact' }, isFromFallback: false, timestamp: new Date() };
      getRandomFact.mockResolvedValue(mockResponse);

      const first = await requestRandomFact();
      expect(first).toBe(mockResponse);
      expect(getRandomFact).toHaveBeenCalledTimes(1);

      const second = await requestRandomFact();
      expect(second).toBeUndefined();
      expect(getRandomFact).toHaveBeenCalledTimes(1);
    });

    it('should allow a call after 1 second has elapsed', async () => {
      const mockResponse1 = { fact: { id: 1, text: 'First fact' }, isFromFallback: false, timestamp: new Date() };
      const mockResponse2 = { fact: { id: 2, text: 'Second fact' }, isFromFallback: false, timestamp: new Date() };
      getRandomFact.mockResolvedValueOnce(mockResponse1).mockResolvedValueOnce(mockResponse2);

      const first = await requestRandomFact();
      expect(first).toBe(mockResponse1);

      vi.advanceTimersByTime(1000);

      const second = await requestRandomFact();
      expect(second).toBe(mockResponse2);
      expect(getRandomFact).toHaveBeenCalledTimes(2);
    });

    it('should not trigger any callbacks when rate-limited', async () => {
      const mockResponse = { fact: { id: 1, text: 'Test fact' }, isFromFallback: false, timestamp: new Date() };
      getRandomFact.mockResolvedValue(mockResponse);

      await requestRandomFact();
      vi.clearAllMocks();

      await requestRandomFact();

      expect(onLoading).not.toHaveBeenCalled();
      expect(onFact).not.toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
    });

    it('should not rate-limit initialize() since it resets the timer', async () => {
      const mockResponse1 = { fact: { id: 1, text: 'First' }, isFromFallback: false, timestamp: new Date() };
      const mockResponse2 = { fact: { id: 2, text: 'Second' }, isFromFallback: false, timestamp: new Date() };
      getRandomFact.mockResolvedValueOnce(mockResponse1).mockResolvedValueOnce(mockResponse2);

      await requestRandomFact();
      expect(getRandomFact).toHaveBeenCalledTimes(1);

      const result = await initialize();
      expect(result).toBe(mockResponse2);
      expect(getRandomFact).toHaveBeenCalledTimes(2);
    });
  });
});
