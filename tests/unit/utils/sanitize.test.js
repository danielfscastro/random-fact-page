import { describe, it, expect } from 'vitest';
import { sanitizeFact } from '../../../src/utils/sanitize.js';

describe('sanitizeFact', () => {
  describe('null/undefined handling', () => {
    it('returns empty string for null input', () => {
      expect(sanitizeFact(null)).toBe('');
    });

    it('returns empty string for undefined input', () => {
      expect(sanitizeFact(undefined)).toBe('');
    });

    it('returns empty string for non-string input', () => {
      expect(sanitizeFact(123)).toBe('');
      expect(sanitizeFact({})).toBe('');
      expect(sanitizeFact([])).toBe('');
    });
  });

  describe('plain text passthrough', () => {
    it('returns plain text unchanged except for escaping', () => {
      expect(sanitizeFact('Hello world')).toBe('Hello world');
    });

    it('returns empty string for empty input', () => {
      expect(sanitizeFact('')).toBe('');
    });
  });

  describe('script tag removal', () => {
    it('removes script tags with content', () => {
      const input = 'Hello<script>alert("xss")</script>World';
      const result = sanitizeFact(input);
      expect(result).not.toContain('script');
      expect(result).not.toContain('alert');
      expect(result).toContain('Hello');
      expect(result).toContain('World');
    });

    it('removes script tags case-insensitively', () => {
      const input = 'Hello<SCRIPT>alert("xss")</SCRIPT>World';
      const result = sanitizeFact(input);
      expect(result).not.toContain('SCRIPT');
      expect(result).not.toContain('alert');
    });

    it('removes script tags with attributes', () => {
      const input = 'Text<script type="text/javascript">evil()</script>More';
      const result = sanitizeFact(input);
      expect(result).not.toContain('script');
      expect(result).not.toContain('evil');
    });

    it('removes unclosed script tags', () => {
      const input = 'Hello<script>alert("xss")';
      const result = sanitizeFact(input);
      expect(result).not.toContain('script');
      expect(result).not.toContain('alert');
    });
  });

  describe('event handler removal', () => {
    it('removes onclick handlers', () => {
      const input = '<div onclick="alert(1)">Click me</div>';
      const result = sanitizeFact(input);
      expect(result).not.toContain('onclick');
      expect(result).not.toContain('alert');
    });

    it('removes onload handlers', () => {
      const input = '<img onload="evil()" src="x">';
      const result = sanitizeFact(input);
      expect(result).not.toContain('onload');
      expect(result).not.toContain('evil');
    });

    it('removes onerror handlers', () => {
      const input = '<img onerror="alert(1)" src="x">';
      const result = sanitizeFact(input);
      expect(result).not.toContain('onerror');
      expect(result).not.toContain('alert');
    });

    it('removes onmouseover handlers', () => {
      const input = '<span onmouseover="hack()">hover</span>';
      const result = sanitizeFact(input);
      expect(result).not.toContain('onmouseover');
      expect(result).not.toContain('hack');
    });

    it('removes multiple event handlers on same element', () => {
      const input = '<div onclick="a()" onmouseover="b()">text</div>';
      const result = sanitizeFact(input);
      expect(result).not.toContain('onclick');
      expect(result).not.toContain('onmouseover');
    });
  });

  describe('HTML escaping', () => {
    it('escapes ampersands', () => {
      expect(sanitizeFact('A & B')).toBe('A &amp; B');
    });

    it('escapes less-than signs', () => {
      expect(sanitizeFact('A < B')).toBe('A &lt; B');
    });

    it('escapes greater-than signs', () => {
      expect(sanitizeFact('A > B')).toBe('A &gt; B');
    });

    it('escapes double quotes', () => {
      expect(sanitizeFact('He said "hello"')).toBe('He said &quot;hello&quot;');
    });

    it('escapes single quotes', () => {
      expect(sanitizeFact("It's fine")).toBe("It&#x27;s fine");
    });
  });

  describe('combined scenarios', () => {
    it('handles script tags and HTML entities together', () => {
      const input = 'Facts & <script>alert("xss")</script>figures';
      const result = sanitizeFact(input);
      expect(result).toBe('Facts &amp; figures');
    });

    it('produces output with no executable content', () => {
      const input = '<img src=x onerror=alert(1)><script>document.cookie</script>';
      const result = sanitizeFact(input);
      expect(result).not.toContain('<script');
      expect(result).not.toContain('onerror');
      expect(result).not.toContain('document.cookie');
    });
  });
});
