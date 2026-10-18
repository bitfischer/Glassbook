/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { lensEntrySchema, lensSchema } from '../../src/lib/domain';
import {
  buildFacets,
  filterLenses,
  ownedChallengeLenses as mirrorOwnedLenses,
  pickStory,
  summarize
} from '../../src/lib/offline/catalogue';

// The mirror's answers must match the server's SQL, so both run against the same throwaway database.
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'glassbook-offline-'));
process.env.DATA_DIR = dataDir;

type Server = {
  lenses: typeof import('../../src/lib/server/lenses');
  entries: typeof import('../../src/lib/server/lens-entries');
  challenges: typeof import('../../src/lib/server/challenges');
  sync: typeof import('../../src/lib/server/sync');
  db: typeof import('../../src/lib/server/db');
};
let server: Server;

function lens(input: Record<string, string>) {
  return server.lenses.createLens(
    lensSchema.parse({ currency: 'eur', condition: 'good', ownership: 'owned', ...input })
  );
}

beforeAll(async () => {
  server = {
    db: await import('../../src/lib/server/db'),
    lenses: await import('../../src/lib/server/lenses'),
    entries: await import('../../src/lib/server/lens-entries'),
    challenges: await import('../../src/lib/server/challenges'),
    sync: await import('../../src/lib/server/sync')
  };
  const prime = lens({
    manufacturer: 'Zeiss',
    mount: 'M42',
    model: 'Planar 50',
    focalType: 'prime',
    focalMinMm: '50',
    releaseYear: '1972',
    purchasePrice: '120',
    weightGrams: '300'
  });
  lens({
    manufacturer: 'zenit',
    model: 'Helios 44-2',
    focalType: 'prime',
    focalMinMm: '58',
    releaseYear: '1985',
    weightGrams: '230'
  });
  lens({
    manufacturer: 'Canon',
    mount: 'EF',
    model: 'EF 24-70mm',
    focalType: 'zoom',
    focalMinMm: '24',
    focalMaxMm: '70',
    releaseYear: '2012',
    purchasePrice: '999.5',
    weightGrams: '805'
  });
  lens({
    manufacturer: 'Canon',
    mount: 'RF',
    model: 'RF 70-200mm',
    focalType: 'zoom',
    focalMinMm: '70',
    focalMaxMm: '200',
    releaseYear: '2019',
    ownership: 'wishlist',
    condition: 'mint',
    weightGrams: '1070'
  });
  lens({
    manufacturer: 'Sigma',
    mount: 'EF',
    model: 'Art 35',
    focalType: 'prime',
    focalMinMm: '35',
    ownership: 'sold',
    weightGrams: '665',
    purchasePrice: '700'
  });
  lens({
    manufacturer: 'Sigma',
    model: 'Mystery 100%_',
    focalType: 'prime',
    focalMinMm: '85',
    weightGrams: '1'
  });
  server.db.sqlite
    .prepare(
      `INSERT INTO lens_photos
        (lens_id, storage_key, original_name, mime_type, width, height, position, is_cover, created_at)
       VALUES (?, 'k1', 'a.jpg', 'image/jpeg', 10, 10, 0, 1, 1)`
    )
    .run(prime);
  for (const [type, eventDate, body] of [
    ['memory', '2020-05-01', 'Older memory'],
    ['memory', '2023-08-09', 'Newest dated   memory'],
    ['memory', '', 'Undated memory'],
    ['note', '', 'A lens note']
  ]) {
    server.entries.createLensEntry(prime, lensEntrySchema.parse({ type, eventDate, body }));
  }
});

afterAll(() => {
  server.db.closeDatabase();
  fs.rmSync(dataDir, { recursive: true, force: true });
});

const queries = [
  '',
  'q=zeiss',
  'q=CANON',
  'q=100%25_',
  'q=ZEN',
  'manufacturer=Canon',
  'mount=EF',
  'mount=RF&ownership=wishlist',
  'condition=mint',
  'ownership=sold',
  'focalType=prime',
  'focalType=zoom',
  'focal=50',
  'focal=58',
  'focal=300',
  'era=vintage',
  'era=modern',
  'photo=has',
  'photo=none',
  'year=2012',
  'year=1700',
  'focalType=zoom&era=modern&sort=name',
  'sort=name',
  'sort=year',
  'sort=era',
  'sort=weight',
  'sort=price',
  'sort=added&order=asc',
  'sort=added&order=desc',
  'sort=unknown'
];

describe('offline catalogue', () => {
  // SQLite leaves the order of equal sort keys open, so ordering is compared by key.
  const sortKey =
    (sort: string | null) => (l: ReturnType<typeof server.lenses.getLens> & object) => {
      const name = `${l.manufacturer} ${l.model}`.toLowerCase();
      if (sort === 'name') return name;
      if (sort === 'year') return [l.releaseYear, l.manufacturer.toLowerCase()];
      if (sort === 'era')
        return [l.releaseYear === null ? 2 : l.releaseYear < 2000 ? 0 : 1, l.releaseYear, name];
      if (sort === 'weight') return l.weightGrams;
      if (sort === 'price') return l.purchasePriceMinor;
      return l.id;
    };

  it.each(queries)('filters and sorts like the server for "%s"', (query) => {
    const params = new URLSearchParams(query);
    const all = server.lenses.listLenses(new URLSearchParams());
    const mirrored = filterLenses(all, params);
    const expected = server.lenses.listLenses(params);
    expect(mirrored.map((l) => l.id).sort()).toEqual(expected.map((l) => l.id).sort());
    const key = sortKey(params.get('sort'));
    expect(mirrored.map(key)).toEqual(expected.map(key));
  });

  it('summarises and builds facets like the server', () => {
    const all = server.lenses.listLenses(new URLSearchParams());
    expect(summarize(all)).toEqual(
      server.db.sqlite
        .prepare(
          `SELECT COUNT(*) AS total, SUM(CASE WHEN ownership = 'owned' THEN 1 ELSE 0 END) AS owned,
            COUNT(DISTINCT manufacturer_id) AS manufacturers,
            COALESCE(SUM(CASE WHEN ownership = 'owned' THEN purchase_price_minor ELSE 0 END), 0) AS valueMinor
           FROM lenses`
        )
        .get()
    );
    const snapshot = server.sync.buildSnapshot(null);
    expect(buildFacets(snapshot.manufacturers, snapshot.mounts, snapshot.lenses)).toEqual(
      server.lenses.catalogueFacets()
    );
  });

  it('derives the challenge lenses like the server', () => {
    const all = server.lenses.listLenses(new URLSearchParams());
    expect(mirrorOwnedLenses(all)).toEqual(server.challenges.ownedChallengeLenses());
  });

  it('picks the latest dated memory as the story, else the notes', () => {
    const [prime] = server.lenses.listLenses(new URLSearchParams('q=zeiss'));
    const entries = server.entries.listLensEntries(prime.id);
    expect(pickStory(prime, entries)).toEqual({ text: 'Newest dated memory', date: '2023-08-09' });
    expect(pickStory({ notes: '  Only   notes ' }, [])).toEqual({ text: 'Only notes', date: null });
    expect(pickStory({ notes: null }, [])).toBeNull();
  });
});

describe('sync snapshot', () => {
  it('contains the whole readable catalogue and is stable between builds', () => {
    const first = server.sync.buildSnapshot({ id: 1, username: 'me' });
    const second = server.sync.buildSnapshot({ id: 1, username: 'me' });
    expect(first.lenses).toHaveLength(6);
    expect(first.photos).toHaveLength(1);
    expect(first.entries).toHaveLength(4);
    expect(first.dailyLens).not.toBeNull();
    expect(first.dailyChallenge?.challenge).toBeDefined();
    expect(server.sync.snapshotEtag(JSON.stringify(first))).toBe(
      server.sync.snapshotEtag(JSON.stringify(second))
    );
  });

  it('changes its ETag when the catalogue changes', () => {
    const before = server.sync.snapshotEtag(JSON.stringify(server.sync.buildSnapshot(null)));
    lens({ manufacturer: 'Tamron', model: 'SP 90', focalType: 'prime', focalMinMm: '90' });
    const after = server.sync.snapshotEtag(JSON.stringify(server.sync.buildSnapshot(null)));
    expect(after).not.toBe(before);
  });
});
