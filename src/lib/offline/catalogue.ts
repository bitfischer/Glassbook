/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

// Pure, browser-safe counterparts of the SQL in `$lib/server/lenses`. They let the offline mirror
// answer the same questions as the server; tests/unit/offline.test.ts keeps both in step.

import type { CollectionSummary, Facets, LensEntryView, LensView } from '$lib/catalogue-types';
import type { MatchingLens } from '$lib/challenges';

const STORY_LENGTH = 280;

// SQLite's NOCASE only folds ASCII letters.
function fold(value: string): string {
  return value.replace(/[A-Z]/g, (letter) => letter.toLowerCase());
}

function compareText(a: string, b: string): number {
  const left = fold(a);
  const right = fold(b);
  return left < right ? -1 : left > right ? 1 : 0;
}

// SQLite sorts NULL below every value, so DESC puts it last.
function compareNumberDesc(a: number | null, b: number | null): number {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return b - a;
}

function eraGroup(lens: LensView): number {
  if (lens.releaseYear === null) return 2;
  return lens.releaseYear < 2000 ? 0 : 1;
}

function byName(a: LensView, b: LensView): number {
  return compareText(a.manufacturer, b.manufacturer) || compareText(a.model, b.model);
}

const sorters: Record<string, (a: LensView, b: LensView, direction: 1 | -1) => number> = {
  name: (a, b) => byName(a, b),
  year: (a, b) =>
    compareNumberDesc(a.releaseYear, b.releaseYear) || compareText(a.manufacturer, b.manufacturer),
  era: (a, b) =>
    eraGroup(a) - eraGroup(b) || compareNumberDesc(a.releaseYear, b.releaseYear) || byName(a, b),
  added: (a, b, direction) => direction * (a.createdAt - b.createdAt || a.id - b.id),
  weight: (a, b) => compareNumberDesc(a.weightGrams, b.weightGrams),
  price: (a, b) => compareNumberDesc(a.purchasePriceMinor, b.purchasePriceMinor)
};

export function filterLenses(all: LensView[], params: URLSearchParams): LensView[] {
  const q = params.get('q')?.trim().toLowerCase();
  const manufacturer = params.get('manufacturer');
  const mount = params.get('mount');
  const condition = params.get('condition');
  const ownership = params.get('ownership');
  const focalType = params.get('focalType');
  const era = params.get('era');
  const photo = params.get('photo');
  const focalLength = Number(params.get('focal'));
  const year = Number(params.get('year'));

  const matches = all.filter((lens) => {
    if (q && !`${lens.manufacturer} ${lens.model}`.toLowerCase().includes(q)) return false;
    if (manufacturer && lens.manufacturer !== manufacturer) return false;
    if (mount && lens.mount !== mount) return false;
    if (condition && lens.condition !== condition) return false;
    if (ownership && lens.ownership !== ownership) return false;
    if (focalType === 'prime') {
      if (lens.focalMinMm === null || lens.focalMaxMm !== lens.focalMinMm) return false;
    } else if (focalType === 'zoom') {
      if (
        lens.focalMinMm === null ||
        lens.focalMaxMm === null ||
        lens.focalMaxMm <= lens.focalMinMm
      )
        return false;
    }
    if (era === 'vintage' && !(lens.releaseYear !== null && lens.releaseYear < 2000)) return false;
    if (era === 'modern' && !(lens.releaseYear !== null && lens.releaseYear >= 2000)) return false;
    if (photo === 'none' && lens.photoIds.length) return false;
    if (photo === 'has' && !lens.photoIds.length) return false;
    if (Number.isFinite(focalLength) && focalLength > 0) {
      if (
        lens.focalMinMm === null ||
        lens.focalMaxMm === null ||
        lens.focalMinMm > focalLength ||
        lens.focalMaxMm < focalLength
      )
        return false;
    }
    if (Number.isInteger(year) && year >= 1800 && year <= 2200 && lens.releaseYear !== year)
      return false;
    return true;
  });

  const sorter = sorters[params.get('sort') ?? 'added'] ?? sorters.added;
  const direction = params.get('order') === 'asc' ? 1 : -1;
  // Ties keep insertion order, which is what SQLite's scan gives the server.
  return matches.sort((a, b) => sorter(a, b, direction) || a.id - b.id);
}

export function summarize(lenses: LensView[]): CollectionSummary {
  const owned = lenses.filter((lens) => lens.ownership === 'owned');
  return {
    total: lenses.length,
    owned: owned.length,
    manufacturers: new Set(lenses.map((lens) => lens.manufacturerId)).size,
    valueMinor: owned.reduce((sum, lens) => sum + (lens.purchasePriceMinor ?? 0), 0)
  };
}

export function buildFacets(manufacturers: string[], mounts: string[], lenses: LensView[]): Facets {
  const years = [
    ...new Set(lenses.flatMap((lens) => (lens.releaseYear === null ? [] : [lens.releaseYear])))
  ];
  return {
    manufacturers: manufacturers.map((name) => ({ name })),
    mounts: mounts.map((name) => ({ name })),
    years: years.sort((a, b) => b - a).map((year) => ({ year }))
  };
}

export function ownedChallengeLenses(lenses: LensView[]): MatchingLens[] {
  return lenses
    .filter((lens) => lens.ownership === 'owned' && lens.focalMinMm !== null)
    .sort(byName)
    .map((lens) => ({
      id: lens.id,
      name: `${lens.manufacturer} ${lens.model}`,
      focalMinMm: lens.focalMinMm as number,
      focalMaxMm: lens.focalMaxMm ?? (lens.focalMinMm as number)
    }));
}

function clip(text: string) {
  const trimmed = text.trim().replace(/\s+/g, ' ');
  return trimmed.length > STORY_LENGTH
    ? trimmed.slice(0, STORY_LENGTH).replace(/\s+\S*$/, '') + '…'
    : trimmed;
}

// The latest dated memory, or else the lens's own notes: the reason to open its page.
export function pickStory(
  lens: Pick<LensView, 'notes'>,
  entries: Pick<LensEntryView, 'type' | 'body' | 'eventDate' | 'createdAt'>[]
): { text: string; date: string | null } | null {
  const latest = entries
    .filter((entry) => entry.type === 'memory')
    .sort((a, b) => {
      const left = a.eventDate ?? '';
      const right = b.eventDate ?? '';
      return left === right ? b.createdAt - a.createdAt : left < right ? 1 : -1;
    })[0];
  if (latest?.body.trim()) return { text: clip(latest.body), date: latest.eventDate };
  if (lens.notes?.trim()) return { text: clip(lens.notes), date: null };
  return null;
}
