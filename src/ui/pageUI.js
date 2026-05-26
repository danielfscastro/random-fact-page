import { sanitizeFact } from '../utils/sanitize.js';

/**
 * Displays a fact in the UI.
 * Sanitizes the fact text before rendering and shows/hides the fallback notice.
 *
 * @param {object} factResponse - A FactResponse object with `fact` and `isFromFallback` fields
 */
export function displayFact(factResponse) {
  const factDisplay = document.getElementById('fact-display');
  const loadingIndicator = document.getElementById('loading-indicator');
  const errorMessage = document.getElementById('error-message');
  const fallbackNotice = document.getElementById('fallback-notice');

  const sanitizedText = sanitizeFact(factResponse.fact.text);
  factDisplay.innerHTML = sanitizedText;

  loadingIndicator.classList.add('hidden');
  errorMessage.classList.add('hidden');

  if (factResponse.isFromFallback) {
    fallbackNotice.classList.remove('hidden');
  } else {
    fallbackNotice.classList.add('hidden');
  }
}

/**
 * Shows the loading indicator and hides error/fallback notices.
 */
export function showLoading() {
  const loadingIndicator = document.getElementById('loading-indicator');
  const errorMessage = document.getElementById('error-message');
  const fallbackNotice = document.getElementById('fallback-notice');

  loadingIndicator.classList.remove('hidden');
  errorMessage.classList.add('hidden');
  fallbackNotice.classList.add('hidden');
}

/**
 * Shows an error message and hides the loading indicator.
 *
 * @param {string} message - The error message to display
 */
export function showError(message) {
  const loadingIndicator = document.getElementById('loading-indicator');
  const errorMessage = document.getElementById('error-message');

  errorMessage.textContent = message;
  errorMessage.classList.remove('hidden');
  loadingIndicator.classList.add('hidden');
}

/**
 * Attaches a click event listener to the "New Fact" button.
 *
 * @param {Function} callback - The function to call when the button is clicked
 */
export function onNewFactRequested(callback) {
  const newFactBtn = document.getElementById('new-fact-btn');
  newFactBtn.addEventListener('click', callback);
}
