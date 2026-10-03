/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

import { describe, expect, it } from 'vitest';
import {
  challengeCatalogue,
  challengeDimensions,
  composeChallenge,
  type MatchingLens
} from '../../src/lib/challenges';

const lenses: MatchingLens[] = [
  { id: 1, name: 'Prime 50', focalMinMm: 50, focalMaxMm: 50 },
  { id: 2, name: 'Zoom 24–70', focalMinMm: 24, focalMaxMm: 70 }
];

describe('photography challenges', () => {
  it('ships a large catalogue across every challenge dimension', () => {
    expect(challengeCatalogue.subject.length).toBeGreaterThanOrEqual(100);
    expect(challengeCatalogue.technique.length).toBeGreaterThanOrEqual(40);
    expect(challengeCatalogue.style.length).toBeGreaterThanOrEqual(30);
    expect(challengeCatalogue.lighting.length).toBeGreaterThanOrEqual(30);
    expect(challengeCatalogue.constraint.length).toBeGreaterThanOrEqual(50);
  });

  it('generates the same challenge for the same seed', () => {
    expect(composeChallenge('repeatable', lenses)).toEqual(composeChallenge('repeatable', lenses));
  });

  it('selects focal lengths covered by owned lenses and suggests matches', () => {
    const challenge = composeChallenge('owned glass', lenses);
    expect(
      lenses.some(
        (lens) =>
          lens.focalMinMm <= challenge.focalLength.mm && lens.focalMaxMm >= challenge.focalLength.mm
      )
    ).toBe(true);
    expect(challenge.matchingLenses.length).toBeGreaterThan(0);
    expect(challenge.usedOwnedFocalLength).toBe(true);
  });

  it('falls back to the full focal library when no lens covers a catalogue length', () => {
    const challenge = composeChallenge('unmatched', [
      { id: 3, name: 'Odd lens', focalMinMm: 17, focalMaxMm: 17 }
    ]);
    expect(challengeCatalogue.focalLength).toContainEqual(challenge.focalLength);
    expect(challenge.matchingLenses).toEqual([]);
    expect(challenge.usedOwnedFocalLength).toBe(false);
  });

  it('preserves every locked dimension while rerolling', () => {
    const first = composeChallenge('first', lenses);
    const locked = Object.fromEntries(
      challengeDimensions.slice(0, 3).map((key) => [key, first[key]])
    );
    const next = composeChallenge('second', lenses, locked);
    expect(next.subject).toEqual(first.subject);
    expect(next.technique).toEqual(first.technique);
    expect(next.style).toEqual(first.style);
  });
});
