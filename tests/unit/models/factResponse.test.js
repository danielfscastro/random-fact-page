import { describe, it, expect } from 'vitest';
import { createFactResponse } from '../../../src/models/factResponse.js';
import { createFact } from '../../../src/models/fact.js';

describe('createFactResponse', () => {
  const sampleFact = createFact({
    id: 1,
    text: 'Honey never spoils.',
    category: 'nature',
    source: 'local',
  });

  it('creates a fact response with all fields', () => {
    const timestamp = new Date('2024-01-01T00:00:00Z');
    const response = createFactResponse({
      fact: sampleFact,
      isFromFallback: false,
      timestamp,
    });

    expect(response.fact).toEqual(sampleFact);
    expect(response.isFromFallback).toBe(false);
    expect(response.timestamp).toEqual(timestamp);
  });

  it('defaults timestamp to current time when not provided', () => {
    const before = new Date();
    const response = createFactResponse({
      fact: sampleFact,
      isFromFallback: true,
    });
    const after = new Date();

    expect(response.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(response.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('creates a frozen (immutable) object', () => {
    const response = createFactResponse({
      fact: sampleFact,
      isFromFallback: false,
    });

    expect(Object.isFrozen(response)).toBe(true);
  });

  it('correctly sets isFromFallback to true', () => {
    const response = createFactResponse({
      fact: sampleFact,
      isFromFallback: true,
    });

    expect(response.isFromFallback).toBe(true);
  });

  it('correctly sets isFromFallback to false', () => {
    const response = createFactResponse({
      fact: sampleFact,
      isFromFallback: false,
    });

    expect(response.isFromFallback).toBe(false);
  });
});
