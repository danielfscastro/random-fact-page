import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { sanitizeFact } from '../../src/utils/sanitize.js';

/**
 * Property 6: XSS sanitization
 *
 * For any fact text containing HTML tags or JavaScript event handlers,
 * the sanitization function SHALL produce output that contains no
 * executable script content.
 *
 * **Validates: Requirement 6.1**
 */
describe('Property 6: XSS sanitization', () => {
  // Arbitrary for generating strings with <script> blocks
  const scriptBlockArb = fc.tuple(
    fc.string(),
    fc.string({ minLength: 0, maxLength: 200 }),
    fc.string()
  ).map(([before, content, after]) => `${before}<script>${content}</script>${after}`);

  // Arbitrary for generating strings with script tags with attributes
  const scriptWithAttrsArb = fc.tuple(
    fc.string(),
    fc.constantFrom('type="text/javascript"', 'src="evil.js"', 'defer', 'async'),
    fc.string({ minLength: 0, maxLength: 200 }),
    fc.string()
  ).map(([before, attr, content, after]) => `${before}<script ${attr}>${content}</script>${after}`);

  // Arbitrary for event handler attribute names
  const eventHandlerArb = fc.constantFrom(
    'onclick', 'onload', 'onerror', 'onmouseover', 'onfocus',
    'onblur', 'onsubmit', 'onkeydown', 'onkeyup', 'onchange',
    'ondblclick', 'onmouseout', 'onmousedown', 'onmouseup'
  );

  // Arbitrary for HTML tags with event handlers
  const tagWithEventHandlerArb = fc.tuple(
    fc.string(),
    fc.constantFrom('div', 'img', 'a', 'span', 'input', 'body', 'p'),
    eventHandlerArb,
    fc.string({ minLength: 1, maxLength: 100 }),
    fc.string()
  ).map(([before, tag, handler, handlerValue, after]) =>
    `${before}<${tag} ${handler}="${handlerValue}">${after}`
  );

  // Arbitrary for completely arbitrary unicode strings
  const arbitraryUnicodeArb = fc.string({ minLength: 0, maxLength: 500 });

  // Arbitrary for strings with javascript: protocol URLs
  const javascriptProtocolArb = fc.tuple(
    fc.string(),
    fc.constantFrom('a', 'iframe', 'embed', 'object'),
    fc.constantFrom('href', 'src', 'action'),
    fc.string({ minLength: 0, maxLength: 100 }),
    fc.string()
  ).map(([before, tag, attr, code, after]) =>
    `${before}<${tag} ${attr}="javascript:${code}">${after}`
  );

  it('output does not contain <script tags after sanitization of script blocks', () => {
    fc.assert(
      fc.property(
        fc.oneof(scriptBlockArb, scriptWithAttrsArb),
        (input) => {
          const output = sanitizeFact(input);
          const lowerOutput = output.toLowerCase();
          expect(lowerOutput).not.toContain('<script');
          expect(lowerOutput).not.toContain('</script');
        }
      ),
      { numRuns: 200 }
    );
  });

  it('output does not contain event handler attributes (on[event]=)', () => {
    fc.assert(
      fc.property(tagWithEventHandlerArb, (input) => {
        const output = sanitizeFact(input);
        // Event handlers follow the pattern on[a-z]+=
        expect(output).not.toMatch(/on[a-z]+\s*=/i);
      }),
      { numRuns: 200 }
    );
  });

  it('output does not contain unescaped < or > characters for arbitrary unicode input', () => {
    fc.assert(
      fc.property(arbitraryUnicodeArb, (input) => {
        const output = sanitizeFact(input);
        // After sanitization, no raw < or > should remain
        expect(output).not.toContain('<');
        expect(output).not.toContain('>');
      }),
      { numRuns: 200 }
    );
  });

  it('output does not contain executable javascript: protocol URLs', () => {
    fc.assert(
      fc.property(javascriptProtocolArb, (input) => {
        const output = sanitizeFact(input);
        // After sanitization, all < and > are escaped so no tags can form
        // and no javascript: protocol can be in an executable context
        expect(output).not.toContain('<');
        expect(output).not.toContain('>');
        // Additionally verify no raw javascript: in a tag context
        expect(output).not.toMatch(/<[^>]*javascript:/i);
      }),
      { numRuns: 200 }
    );
  });
});
