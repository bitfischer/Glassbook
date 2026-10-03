/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

import { describe, expect, it } from 'vitest';
import { lensEntrySchema, lensSchema, priceFromMinor, priceToMinor } from '../../src/lib/domain';

const valid = {
  manufacturer: 'Nikon',
  model: 'Nikkor 50mm f/1.4',
  currency: 'eur',
  condition: 'excellent',
  ownership: 'owned'
};

describe('lens validation', () => {
  it('normalizes valid input', () => {
    const result = lensSchema.parse({ ...valid, focalType: 'prime', focalMinMm: '50' });
    expect(result.currency).toBe('EUR');
    expect(result.focalMinMm).toBe(50);
    expect(result.focalMaxMm).toBe(50);
  });

  it('keeps both bounds for a valid zoom lens', () => {
    const result = lensSchema.parse({
      ...valid,
      focalType: 'zoom',
      focalMinMm: '24',
      focalMaxMm: '70'
    });
    expect(result.focalMinMm).toBe(24);
    expect(result.focalMaxMm).toBe(70);
  });

  it('rejects reversed focal ranges', () => {
    const result = lensSchema.safeParse({
      ...valid,
      focalType: 'zoom',
      focalMinMm: '70',
      focalMaxMm: '24'
    });
    expect(result.success).toBe(false);
  });

  it('requires both focal lengths for a zoom lens', () => {
    const result = lensSchema.safeParse({ ...valid, focalType: 'zoom', focalMinMm: '24' });
    expect(result.success).toBe(false);
  });

  it('requires a focal length for a prime lens', () => {
    const result = lensSchema.safeParse({ ...valid, focalType: 'prime' });
    expect(result.success).toBe(false);
  });

  it('rejects implausible release years', () => {
    expect(
      lensSchema.safeParse({ ...valid, focalType: 'prime', focalMinMm: '50', releaseYear: '1700' })
        .success
    ).toBe(false);
  });
});

describe('money conversion', () => {
  it('rounds decimal prices to integer minor units', () => {
    expect(priceToMinor(12.345)).toBe(1235);
    expect(priceFromMinor(1235)).toBe('12.35');
  });
});

describe('lens entry validation', () => {
  it('accepts dated and undated memories', () => {
    expect(
      lensEntrySchema.parse({ type: 'memory', eventDate: '2024-04-02', body: ' Wedding ' })
    ).toEqual({
      type: 'memory',
      eventDate: '2024-04-02',
      body: 'Wedding'
    });
    expect(
      lensEntrySchema.parse({ type: 'memory', eventDate: '', body: 'A day out' }).eventDate
    ).toBeUndefined();
  });

  it('rejects empty entries, invalid dates, and dates on timeless notes', () => {
    expect(lensEntrySchema.safeParse({ type: 'note', body: '   ' }).success).toBe(false);
    expect(
      lensEntrySchema.safeParse({ type: 'memory', eventDate: '2024-02-31', body: 'Event' }).success
    ).toBe(false);
    expect(
      lensEntrySchema.safeParse({
        type: 'note',
        eventDate: '2024-04-02',
        body: 'Sharp stopped down'
      }).success
    ).toBe(false);
  });
});
