import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock the repository layer to control data source behavior
vi.mock('../../src/repository/factRepository.js', () => ({
  fetchAllFacts: vi.fn(),
  fetchFactByIndex: vi.fn(),
  getCount: vi.fn(),
  setFetchFn: vi.fn(),
  setApiUrl: vi.fn(),
  reset: vi.fn(),
}));

// Mock localFacts to provide controlled fallback data
vi.mock('../../src/repository/localFacts.js', () => ({
  localFacts: [
    Object.freeze({ id: 1, text: 'Test local fact one', category: 'science', source: 'local' }),
    Object.freeze({ id: 2, text: 'Test local fact two', category: 'history', source: 'local' }),
    Object.freeze({ id: 3, text: 'Test local fact three', category: 'nature', source: 'local' }),
  ],
}));

// Mock localFactsPtBr module
vi.mock('../../src/repository/localFactsPtBr.js', () => ({
  localFactsPtBr: [
    Object.freeze({ id: 1, text: 'Fato local teste um', category: 'science', source: 'local' }),
    Object.freeze({ id: 2, text: 'Fato local teste dois', category: 'history', source: 'local' }),
    Object.freeze({ id: 3, text: 'Fato local teste três', category: 'nature', source: 'local' }),
  ],
}));

import { fetchAllFacts } from '../../src/repository/factRepository.js';
import { localFacts } from '../../src/repository/localFacts.js';
import { displayFact, showLoading, showError, onNewFactRequested } from '../../src/ui/pageUI.js';
import { setCallbacks, initialize, requestRandomFact, resetController } from '../../src/controller/factController.js';
import { resetService } from '../../src/service/factService.js';

/**
 * Sets up a jsdom DOM environment with the required page elements.
 */
function setupDOM() {
  const dom = new JSDOM(`
    <!DOCTYPE html>
    <html>
    <body>
      <div id="fact-display"></div>
      <button id="new-fact-btn" type="button">New Fact</button>
      <div id="loading-indicator" class="hidden"></div>
      <div id="error-message" class="hidden"></div>
      <div id="fallback-notice" class="hidden"></div>
    </body>
    </html>
  `);

  // Set global document and window for the UI modules
  global.document = dom.window.document;
  global.window = dom.window;

  return dom;
}

describe('Integration: Full Flow', () => {
  let dom;

  beforeEach(() => {
    vi.clearAllMocks();
    dom = setupDOM();
    resetController();
    resetService();

    // Wire controller callbacks to UI functions (same as main.js)
    setCallbacks({
      onFact: (factResponse) => displayFact(factResponse),
      onLoading: (isLoading) => { if (isLoading) showLoading(); },
      onError: (message) => showError(message),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Full flow: button click to fact display', () => {
    it('displays a fact in #fact-display when the button is clicked', async () => {
      const apiFacts = [
        Object.freeze({ id: 100, text: 'API fact about space', category: 'science', source: 'api' }),
        Object.freeze({ id: 101, text: 'API fact about history', category: 'history', source: 'api' }),
      ];
      fetchAllFacts.mockResolvedValue(apiFacts);

      // Wire the button
      onNewFactRequested(() => requestRandomFact());

      // Click the button
      const btn = document.getElementById('new-fact-btn');
      btn.click();

      // Wait for async operations
      await vi.waitFor(() => {
        const factDisplay = document.getElementById('fact-display');
        expect(factDisplay.innerHTML).not.toBe('');
      });

      const factDisplay = document.getElementById('fact-display');
      const displayedText = factDisplay.innerHTML;
      const validTexts = apiFacts.map((f) => f.text);
      expect(validTexts).toContain(displayedText);
    });
  });

  describe('Fallback behavior: API failure shows fallback notice', () => {
    it('displays a local fact and shows fallback notice when API fails', async () => {
      fetchAllFacts.mockRejectedValue(new Error('Network error'));

      // Wire the button
      onNewFactRequested(() => requestRandomFact());

      // Click the button
      const btn = document.getElementById('new-fact-btn');
      btn.click();

      // Wait for async operations
      await vi.waitFor(() => {
        const factDisplay = document.getElementById('fact-display');
        expect(factDisplay.innerHTML).not.toBe('');
      });

      const factDisplay = document.getElementById('fact-display');
      const fallbackNotice = document.getElementById('fallback-notice');

      // Fact should be from the local collection
      const validTexts = localFacts.map((f) => f.text);
      expect(validTexts).toContain(factDisplay.innerHTML);

      // Fallback notice should be visible
      expect(fallbackNotice.classList.contains('hidden')).toBe(false);
    });
  });

  describe('Rate limiting: consecutive clicks within 1 second', () => {
    it('ignores a second click within 1 second', async () => {
      vi.useFakeTimers();

      const apiFacts = [
        Object.freeze({ id: 100, text: 'First fact', category: 'science', source: 'api' }),
        Object.freeze({ id: 101, text: 'Second fact', category: 'history', source: 'api' }),
      ];
      fetchAllFacts.mockResolvedValue(apiFacts);

      // Wire the button
      onNewFactRequested(() => requestRandomFact());

      // First click
      const btn = document.getElementById('new-fact-btn');
      btn.click();

      // Flush microtasks for the first request
      await vi.runAllTimersAsync();

      // Record how many times fetchAllFacts was called after first click
      const callCountAfterFirst = fetchAllFacts.mock.calls.length;

      // Second click immediately (within 1 second)
      btn.click();
      await vi.runAllTimersAsync();

      // fetchAllFacts should NOT have been called again
      expect(fetchAllFacts.mock.calls.length).toBe(callCountAfterFirst);
    });
  });

  describe('Page load: displays a fact on initialization', () => {
    it('displays a fact in #fact-display after initialize()', async () => {
      const apiFacts = [
        Object.freeze({ id: 50, text: 'Initial load fact', category: 'technology', source: 'api' }),
      ];
      fetchAllFacts.mockResolvedValue(apiFacts);

      await initialize();

      const factDisplay = document.getElementById('fact-display');
      expect(factDisplay.innerHTML).toBe('Initial load fact');
    });
  });

  describe('Error handling: no facts available shows error', () => {
    it('shows error message when both API and local facts are empty', async () => {
      // API fails
      fetchAllFacts.mockRejectedValue(new Error('API down'));

      // Override localFacts mock to return empty for this test
      const localFactsModule = await import('../../src/repository/localFacts.js');
      // Temporarily replace localFacts with empty array
      const originalFacts = [...localFactsModule.localFacts];
      localFactsModule.localFacts.length = 0;

      await initialize();

      const errorMessage = document.getElementById('error-message');
      expect(errorMessage.classList.contains('hidden')).toBe(false);
      expect(errorMessage.textContent).not.toBe('');

      // Restore localFacts
      originalFacts.forEach((f) => localFactsModule.localFacts.push(f));
    });
  });
});
