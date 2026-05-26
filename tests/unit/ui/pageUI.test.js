import { describe, it, expect, beforeEach, vi } from 'vitest';
import { displayFact, showLoading, showError, onNewFactRequested } from '../../../src/ui/pageUI.js';

vi.mock('../../../src/utils/sanitize.js', () => ({
  sanitizeFact: vi.fn((text) => `sanitized:${text}`),
}));

import { sanitizeFact } from '../../../src/utils/sanitize.js';

function setupDOM() {
  document.body.innerHTML = `
    <div id="fact-display"></div>
    <button id="new-fact-btn">New Fact</button>
    <div id="loading-indicator" class="hidden"></div>
    <div id="error-message" class="hidden"></div>
    <div id="fallback-notice" class="hidden"></div>
  `;
}

describe('pageUI', () => {
  beforeEach(() => {
    setupDOM();
    vi.clearAllMocks();
  });

  describe('displayFact', () => {
    it('renders sanitized fact text to #fact-display', () => {
      const factResponse = {
        fact: { text: 'Honey never spoils.' },
        isFromFallback: false,
      };

      displayFact(factResponse);

      expect(sanitizeFact).toHaveBeenCalledWith('Honey never spoils.');
      expect(document.getElementById('fact-display').innerHTML).toBe('sanitized:Honey never spoils.');
    });

    it('hides loading indicator and error message', () => {
      document.getElementById('loading-indicator').classList.remove('hidden');
      document.getElementById('error-message').classList.remove('hidden');

      const factResponse = {
        fact: { text: 'A fact.' },
        isFromFallback: false,
      };

      displayFact(factResponse);

      expect(document.getElementById('loading-indicator').classList.contains('hidden')).toBe(true);
      expect(document.getElementById('error-message').classList.contains('hidden')).toBe(true);
    });

    it('shows fallback notice when isFromFallback is true', () => {
      const factResponse = {
        fact: { text: 'A cached fact.' },
        isFromFallback: true,
      };

      displayFact(factResponse);

      expect(document.getElementById('fallback-notice').classList.contains('hidden')).toBe(false);
    });

    it('hides fallback notice when isFromFallback is false', () => {
      document.getElementById('fallback-notice').classList.remove('hidden');

      const factResponse = {
        fact: { text: 'A fresh fact.' },
        isFromFallback: false,
      };

      displayFact(factResponse);

      expect(document.getElementById('fallback-notice').classList.contains('hidden')).toBe(true);
    });
  });

  describe('showLoading', () => {
    it('shows loading indicator', () => {
      showLoading();

      expect(document.getElementById('loading-indicator').classList.contains('hidden')).toBe(false);
    });

    it('hides error message and fallback notice', () => {
      document.getElementById('error-message').classList.remove('hidden');
      document.getElementById('fallback-notice').classList.remove('hidden');

      showLoading();

      expect(document.getElementById('error-message').classList.contains('hidden')).toBe(true);
      expect(document.getElementById('fallback-notice').classList.contains('hidden')).toBe(true);
    });
  });

  describe('showError', () => {
    it('displays the error message text', () => {
      showError('Unable to load a fact. Please try again.');

      const errorEl = document.getElementById('error-message');
      expect(errorEl.textContent).toBe('Unable to load a fact. Please try again.');
    });

    it('shows error message element', () => {
      showError('Something went wrong.');

      expect(document.getElementById('error-message').classList.contains('hidden')).toBe(false);
    });

    it('hides loading indicator', () => {
      document.getElementById('loading-indicator').classList.remove('hidden');

      showError('Error occurred.');

      expect(document.getElementById('loading-indicator').classList.contains('hidden')).toBe(true);
    });
  });

  describe('onNewFactRequested', () => {
    it('attaches click listener to #new-fact-btn that calls the callback', () => {
      const callback = vi.fn();

      onNewFactRequested(callback);

      document.getElementById('new-fact-btn').click();

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('calls callback on each click', () => {
      const callback = vi.fn();

      onNewFactRequested(callback);

      const btn = document.getElementById('new-fact-btn');
      btn.click();
      btn.click();
      btn.click();

      expect(callback).toHaveBeenCalledTimes(3);
    });
  });
});
