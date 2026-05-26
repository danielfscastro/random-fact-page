/**
 * Sanitizes fact text by removing script content, event handlers,
 * and escaping HTML special characters to prevent XSS attacks.
 *
 * @param {string|null|undefined} text - The raw fact text to sanitize
 * @returns {string} Sanitized text safe for DOM insertion
 */
export function sanitizeFact(text) {
  if (text == null) {
    return '';
  }

  if (typeof text !== 'string') {
    return '';
  }

  let result = text;

  // Remove <script>...</script> blocks entirely (including content)
  // Handle nested and malformed script tags with case-insensitive matching
  result = result.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '');

  // Remove any remaining unclosed <script> tags and everything after them
  result = result.replace(/<script\b[^>]*>[\s\S]*/gi, '');

  // Remove stray closing script tags
  result = result.replace(/<\/script\s*>/gi, '');

  // Remove HTML event handler attributes (on* attributes)
  // This handles tags that contain event handlers like onclick, onload, onerror, etc.
  result = result.replace(/<([a-z][a-z0-9]*)\b([^>]*?)\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)([^>]*)>/gi, '<$1$2$3>');

  // Repeat to catch multiple event handlers on the same tag
  while (/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/i.test(result)) {
    result = result.replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  }

  // Escape HTML special characters
  result = result.replace(/&/g, '&amp;');
  result = result.replace(/</g, '&lt;');
  result = result.replace(/>/g, '&gt;');
  result = result.replace(/"/g, '&quot;');
  result = result.replace(/'/g, '&#x27;');

  return result;
}
