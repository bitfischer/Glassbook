/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

import { afterAll, describe, expect, it } from 'vitest';
import { lensEntrySchema, lensSchema } from '../../src/lib/domain';
import { closeDatabase, sqlite } from '../../src/lib/server/db';
import { getDailyChallenge } from '../../src/lib/server/challenges';
import {
  attachLensEntryPhoto,
  createLensEntry,
  deleteLensEntry,
  detachLensEntryPhoto,
  listLensEntries,
  updateLensEntry
} from '../../src/lib/server/lens-entries';
import {
  chooseNewLensOfTheDay,
  createLens,
  getLensOfTheDay,
  listLenses
} from '../../src/lib/server/lenses';

const suiteId = `Collection Test ${Date.now()}`;

function createTestLens(input: Record<string, string>) {
  return createLens(
    lensSchema.parse({
      currency: 'eur',
      condition: 'excellent',
      ownership: 'owned',
      ...input
    })
  );
}

describe('collection filters', () => {
  const primeId = createTestLens({
    manufacturer: 'Codex Optics',
    model: `${suiteId} Prime 50`,
    serialNumber: `${suiteId} SERIAL`,
    focalType: 'prime',
    focalMinMm: '50',
    releaseYear: '1999'
  });
  const zoomWideId = createTestLens({
    manufacturer: 'Codex Optics',
    model: `${suiteId} Zoom 24-70`,
    focalType: 'zoom',
    focalMinMm: '24',
    focalMaxMm: '70',
    releaseYear: '2000'
  });
  const zoomTeleId = createTestLens({
    manufacturer: 'Codex Optics',
    model: `${suiteId} Zoom 70-200`,
    focalType: 'zoom',
    focalMinMm: '70',
    focalMaxMm: '200'
  });
  const insertPhoto = sqlite.prepare(
    `INSERT INTO lens_photos
      (lens_id, storage_key, original_name, mime_type, width, height, position, is_cover, created_at)
     VALUES (?, ?, ?, 'image/jpeg', 100, 100, ?, ?, ?)`
  );
  const firstPhotoId = Number(
    insertPhoto.run(primeId, `${suiteId}-first`, 'first.jpg', 0, 0, Date.now()).lastInsertRowid
  );
  const coverPhotoId = Number(
    insertPhoto.run(primeId, `${suiteId}-cover`, 'cover.jpg', 1, 1, Date.now()).lastInsertRowid
  );

  afterAll(() => {
    closeDatabase();
  });

  it('filters prime lenses by exact focal length', () => {
    const lenses = listLenses(
      new URLSearchParams({
        q: suiteId,
        focalType: 'prime',
        focal: '50'
      })
    );

    expect(lenses.map((lens) => lens.model)).toEqual([`${suiteId} Prime 50`]);
  });

  it('limits quick search to manufacturer and model', () => {
    expect(listLenses(new URLSearchParams({ q: `${suiteId} SERIAL` }))).toEqual([]);
  });

  it('filters zoom lenses by lens type only', () => {
    const lenses = listLenses(
      new URLSearchParams({
        q: suiteId,
        focalType: 'zoom',
        sort: 'name'
      })
    );

    expect(lenses.map((lens) => lens.model)).toEqual([
      `${suiteId} Zoom 24-70`,
      `${suiteId} Zoom 70-200`
    ]);
  });

  it('matches focal lengths that fall within a zoom range', () => {
    const lenses = listLenses(
      new URLSearchParams({
        q: suiteId,
        focal: '50',
        sort: 'name'
      })
    );

    expect(lenses.map((lens) => lens.model)).toEqual([
      `${suiteId} Prime 50`,
      `${suiteId} Zoom 24-70`
    ]);
  });

  it('filters vintage and modern eras without classifying missing years', () => {
    const vintage = listLenses(new URLSearchParams({ q: suiteId, era: 'vintage' }));
    const modern = listLenses(new URLSearchParams({ q: suiteId, era: 'modern' }));

    expect(vintage.map((lens) => lens.id)).toEqual([primeId]);
    expect(modern.map((lens) => lens.id)).toEqual([zoomWideId]);
  });

  it('sorts vintage, modern, then unclassified lenses by era', () => {
    const lenses = listLenses(new URLSearchParams({ q: suiteId, sort: 'era' }));

    expect(lenses.map((lens) => lens.id)).toEqual([primeId, zoomWideId, zoomTeleId]);
  });

  it('returns all photo IDs with the cover first', () => {
    const lens = listLenses(new URLSearchParams({ q: `${suiteId} Prime 50` }))[0];

    expect(lens.photoIds).toEqual([coverPhotoId, firstPhotoId]);
    expect(lens.coverId).toBe(coverPhotoId);
  });

  it('persists one photography challenge per day', () => {
    const day = suiteId + ' challenge day';
    const first = getDailyChallenge(day);
    const second = getDailyChallenge(day);

    expect(second).toEqual(first);
    expect(
      (
        sqlite.prepare('SELECT COUNT(*) AS count FROM daily_challenges WHERE day = ?').get(day) as {
          count: number;
        }
      ).count
    ).toBe(1);
  });

  it('persists one lens selection per day', () => {
    const day = suiteId + ' day';
    const first = getLensOfTheDay(day);
    const second = getLensOfTheDay(day);

    expect(first?.id).toBeDefined();
    expect(second?.id).toBe(first?.id);
    expect(
      (
        sqlite.prepare('SELECT COUNT(*) AS count FROM daily_lenses WHERE day = ?').get(day) as {
          count: number;
        }
      ).count
    ).toBe(1);
  });

  it('can manually advance the daily lens without repeating the current choice', () => {
    const day = suiteId + ' manual day';
    const first = getLensOfTheDay(day);
    const next = chooseNewLensOfTheDay(day);

    expect(next?.id).toBeDefined();
    expect(next?.id).not.toBe(first?.id);
    expect(getLensOfTheDay(day)?.id).toBe(next?.id);
  });

  it('sorts by date added in either direction', () => {
    const setCreatedAt = sqlite.prepare('UPDATE lenses SET created_at = ? WHERE id = ?');
    setCreatedAt.run(1, primeId);
    setCreatedAt.run(2, zoomWideId);
    setCreatedAt.run(3, zoomTeleId);

    const ascending = listLenses(new URLSearchParams({ q: suiteId, sort: 'added', order: 'asc' }));
    const descending = listLenses(
      new URLSearchParams({ q: suiteId, sort: 'added', order: 'desc' })
    );

    expect(ascending.map((lens) => lens.id)).toEqual([primeId, zoomWideId, zoomTeleId]);
    expect(descending.map((lens) => lens.id)).toEqual([zoomTeleId, zoomWideId, primeId]);
  });

  it('creates and groups timeless notes before newest-first memories', () => {
    const parseEntry = (type: 'note' | 'memory', body: string, eventDate?: string) =>
      lensEntrySchema.parse({ type, body, eventDate });
    const olderNote = createLensEntry(primeId, parseEntry('note', 'Older note'));
    const newerNote = createLensEntry(primeId, parseEntry('note', 'Newer note'));
    createLensEntry(primeId, parseEntry('memory', 'Undated memory'));
    createLensEntry(primeId, parseEntry('memory', 'Older memory', '2023-05-01'));
    createLensEntry(primeId, parseEntry('memory', 'Newer memory', '2024-04-02'));
    sqlite.prepare('UPDATE lens_entries SET updated_at = ? WHERE id = ?').run(1, olderNote);
    sqlite.prepare('UPDATE lens_entries SET updated_at = ? WHERE id = ?').run(2, newerNote);

    expect(listLensEntries(primeId).map(({ body }) => body)).toEqual([
      'Newer note',
      'Older note',
      'Newer memory',
      'Older memory',
      'Undated memory'
    ]);
  });

  it('attaches only same-lens photos to memories and can detach them', () => {
    const memoryId = createLensEntry(
      primeId,
      lensEntrySchema.parse({ type: 'memory', body: 'Photographed an event' })
    );
    const noteId = createLensEntry(
      primeId,
      lensEntrySchema.parse({ type: 'note', body: 'Timeless advice' })
    );

    expect(attachLensEntryPhoto(primeId, memoryId, firstPhotoId)).toBe(true);
    expect(attachLensEntryPhoto(primeId, memoryId, firstPhotoId)).toBe(false);
    expect(attachLensEntryPhoto(zoomWideId, memoryId, firstPhotoId)).toBe(false);
    expect(attachLensEntryPhoto(primeId, noteId, firstPhotoId)).toBe(false);
    expect(listLensEntries(primeId).find((entry) => entry.id === memoryId)?.photoIds).toEqual([
      firstPhotoId
    ]);
    expect(detachLensEntryPhoto(primeId, memoryId, firstPhotoId)).toBe(true);
    expect(listLensEntries(primeId).find((entry) => entry.id === memoryId)?.photoIds).toEqual([]);
  });

  it('updates and deletes only entries owned by the supplied lens', () => {
    const original = lensEntrySchema.parse({ type: 'note', body: 'Original' });
    const id = createLensEntry(primeId, original);

    expect(updateLensEntry(zoomWideId, id, { ...original, body: 'Wrong lens' })).toBe(false);
    expect(deleteLensEntry(zoomWideId, id)).toBe(false);
    expect(
      updateLensEntry(
        primeId,
        id,
        lensEntrySchema.parse({ type: 'memory', body: 'Corrected', eventDate: '2024-06-01' })
      )
    ).toBe(true);
    expect(listLensEntries(primeId).find((item) => item.id === id)).toMatchObject({
      type: 'memory',
      eventDate: '2024-06-01',
      body: 'Corrected'
    });
    expect(deleteLensEntry(primeId, id)).toBe(true);
  });

  it('cascade-deletes entries with their lens', () => {
    const temporaryLensId = createTestLens({
      manufacturer: 'Codex Optics',
      model: `${suiteId} Temporary`,
      focalType: 'prime',
      focalMinMm: '35'
    });
    const id = createLensEntry(
      temporaryLensId,
      lensEntrySchema.parse({ type: 'note', body: 'Temporary note' })
    );

    sqlite.prepare('DELETE FROM lenses WHERE id = ?').run(temporaryLensId);

    expect(sqlite.prepare('SELECT 1 FROM lens_entries WHERE id = ?').get(id)).toBeUndefined();
  });
});
