/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

import { sqlite } from '$lib/server/db';
import { lensSchema, priceToMinor, type LensInput } from '$lib/domain';

export type LensView = {
  id: number;
  manufacturerId: number;
  manufacturer: string;
  mountId: number | null;
  mount: string | null;
  model: string;
  serialNumber: string | null;
  focalType: 'prime' | 'zoom';
  focalMinMm: number | null;
  focalMaxMm: number | null;
  apertureMin: string | null;
  apertureMax: string | null;
  lengthMm: number | null;
  diameterMm: number | null;
  weightGrams: number | null;
  filterThreadMm: number | null;
  elements: number | null;
  groups: number | null;
  releaseYear: number | null;
  purchaseDate: string | null;
  purchasePriceMinor: number | null;
  currency: string;
  condition: string;
  ownership: string;
  notes: string | null;
  createdAt: number;
  updatedAt: number;
  coverId: number | null;
  photoIds: number[];
};

type LensRow = Omit<LensView, 'photoIds'> & { photoIds: string | null };

const selectLens = `
  SELECT l.id, l.manufacturer_id AS manufacturerId, m.name AS manufacturer,
    l.mount_id AS mountId, mt.name AS mount, l.model, l.serial_number AS serialNumber,
    CASE
      WHEN l.focal_min_mm IS NOT NULL AND l.focal_max_mm IS NOT NULL AND l.focal_max_mm > l.focal_min_mm
        THEN 'zoom'
      ELSE 'prime'
    END AS focalType,
    l.focal_min_mm AS focalMinMm, l.focal_max_mm AS focalMaxMm,
    l.aperture_min AS apertureMin, l.aperture_max AS apertureMax,
    l.length_mm AS lengthMm, l.diameter_mm AS diameterMm, l.weight_grams AS weightGrams,
    l.filter_thread_mm AS filterThreadMm, l.elements, l.groups,
    l.release_year AS releaseYear, l.purchase_date AS purchaseDate,
    l.purchase_price_minor AS purchasePriceMinor, l.currency, l.condition, l.ownership,
    l.notes, l.created_at AS createdAt, l.updated_at AS updatedAt,
    (SELECT p.id FROM lens_photos p WHERE p.lens_id = l.id ORDER BY p.is_cover DESC, p.position, p.id LIMIT 1) AS coverId,
    (SELECT GROUP_CONCAT(ordered.id, ',') FROM (
      SELECT p.id FROM lens_photos p
      WHERE p.lens_id = l.id
      ORDER BY p.is_cover DESC, p.position, p.id
    ) AS ordered) AS photoIds
  FROM lenses l
  JOIN manufacturers m ON m.id = l.manufacturer_id
  LEFT JOIN mounts mt ON mt.id = l.mount_id`;

function toLensView(row: LensRow): LensView {
  return {
    ...row,
    photoIds: row.photoIds ? row.photoIds.split(',').map(Number) : []
  };
}

function localDayKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}

function rotationCycle(): number {
  return (
    sqlite
      .prepare(
        'SELECT COALESCE(MAX(cycle), 0) AS cycle FROM (SELECT cycle FROM daily_lenses UNION ALL SELECT cycle FROM daily_lens_history)'
      )
      .get() as { cycle: number }
  ).cycle;
}

function candidateForCycle(cycle: number): LensRow | undefined {
  return sqlite
    .prepare(
      selectLens +
        ' WHERE NOT EXISTS (SELECT 1 FROM (SELECT lens_id, cycle FROM daily_lenses UNION ALL SELECT lens_id, cycle FROM daily_lens_history) history WHERE history.lens_id = l.id AND history.cycle = ?) ORDER BY RANDOM() LIMIT 1'
    )
    .get(cycle) as LensRow | undefined;
}

function randomCandidate(): LensRow | undefined {
  return sqlite.prepare(selectLens + ' ORDER BY RANDOM() LIMIT 1').get() as LensRow | undefined;
}

function recordDailySelection(day: string, candidate: LensRow, cycle: number): LensView {
  sqlite
    .prepare('INSERT INTO daily_lens_history (day, lens_id, cycle, created_at) VALUES (?, ?, ?, ?)')
    .run(day, candidate.id, cycle, Date.now());
  sqlite
    .prepare(
      'INSERT INTO daily_lenses (day, lens_id, cycle, created_at) VALUES (?, ?, ?, ?) ON CONFLICT(day) DO UPDATE SET lens_id = excluded.lens_id, cycle = excluded.cycle, created_at = excluded.created_at'
    )
    .run(day, candidate.id, cycle, Date.now());
  return toLensView(candidate);
}

export function getLensOfTheDay(day = localDayKey()): LensView | undefined {
  return sqlite.transaction(() => {
    const existing = sqlite
      .prepare(selectLens + ' WHERE l.id = (SELECT lens_id FROM daily_lenses WHERE day = ?)')
      .get(day) as LensRow | undefined;
    if (existing) return toLensView(existing);
    let cycle = rotationCycle();
    let candidate = candidateForCycle(cycle);
    if (!candidate) {
      cycle += 1;
      candidate = randomCandidate();
    }
    return candidate ? recordDailySelection(day, candidate, cycle) : undefined;
  })();
}

export function chooseNewLensOfTheDay(day = localDayKey()): LensView | undefined {
  return sqlite.transaction(() => {
    const current = sqlite
      .prepare('SELECT lens_id AS lensId, cycle FROM daily_lenses WHERE day = ?')
      .get(day) as { lensId: number; cycle: number } | undefined;
    if (!current) return undefined;
    let cycle = rotationCycle();
    let candidate = candidateForCycle(cycle);
    if (!candidate) {
      cycle += 1;
      candidate = randomCandidate();
    }
    if (!candidate) return undefined;
    sqlite
      .prepare(
        'INSERT OR IGNORE INTO daily_lens_history (day, lens_id, cycle, created_at) VALUES (?, ?, ?, ?)'
      )
      .run(day, current.lensId, current.cycle, Date.now());
    return recordDailySelection(day, candidate, cycle);
  })();
}
export function listLenses(params: URLSearchParams): LensView[] {
  const where: string[] = [];
  const values: Array<string | number> = [];
  const q = params.get('q')?.trim();
  if (q) {
    where.push("(m.name || ' ' || l.model) LIKE ? ESCAPE '\\'");
    values.push(`%${q.replaceAll('%', '\\%').replaceAll('_', '\\_')}%`);
  }
  for (const [param, column] of [
    ['manufacturer', 'm.name'],
    ['mount', 'mt.name'],
    ['condition', 'l.condition'],
    ['ownership', 'l.ownership']
  ]) {
    const value = params.get(param);
    if (value) {
      where.push(`${column} = ?`);
      values.push(value);
    }
  }
  const focalType = params.get('focalType');
  if (focalType === 'prime') {
    where.push('l.focal_min_mm IS NOT NULL AND l.focal_max_mm = l.focal_min_mm');
  } else if (focalType === 'zoom') {
    where.push(
      'l.focal_min_mm IS NOT NULL AND l.focal_max_mm IS NOT NULL AND l.focal_max_mm > l.focal_min_mm'
    );
  }
  const era = params.get('era');
  if (era === 'vintage') {
    where.push('l.release_year IS NOT NULL AND l.release_year < 2000');
  } else if (era === 'modern') {
    where.push('l.release_year IS NOT NULL AND l.release_year >= 2000');
  }
  const focalLength = Number(params.get('focal'));
  if (Number.isFinite(focalLength) && focalLength > 0) {
    where.push(
      'l.focal_min_mm IS NOT NULL AND l.focal_max_mm IS NOT NULL AND l.focal_min_mm <= ? AND l.focal_max_mm >= ?'
    );
    values.push(focalLength, focalLength);
  }
  const year = Number(params.get('year'));
  if (Number.isInteger(year) && year >= 1800 && year <= 2200) {
    where.push('l.release_year = ?');
    values.push(year);
  }
  const dateDirection = params.get('order') === 'asc' ? 'ASC' : 'DESC';
  const orderBy: Record<string, string> = {
    name: 'm.name COLLATE NOCASE, l.model COLLATE NOCASE',
    year: 'l.release_year DESC, m.name COLLATE NOCASE',
    era: `CASE
        WHEN l.release_year < 2000 THEN 0
        WHEN l.release_year >= 2000 THEN 1
        ELSE 2
      END, l.release_year DESC,
      m.name COLLATE NOCASE, l.model COLLATE NOCASE`,
    added: `l.created_at ${dateDirection}, l.id ${dateDirection}`,
    weight: 'l.weight_grams DESC',
    price: 'l.purchase_price_minor DESC'
  };
  const sort = orderBy[params.get('sort') ?? 'added'] ?? orderBy.added;
  const sql = `${selectLens} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY ${sort}`;
  return (sqlite.prepare(sql).all(...values) as LensRow[]).map(toLensView);
}

export function getLens(id: number): LensView | undefined {
  const row = sqlite.prepare(`${selectLens} WHERE l.id = ?`).get(id) as LensRow | undefined;
  return row ? toLensView(row) : undefined;
}

function lookupId(table: 'manufacturers' | 'mounts', name?: string): number | null {
  if (!name) return null;
  sqlite.prepare(`INSERT INTO ${table} (name) VALUES (?) ON CONFLICT(name) DO NOTHING`).run(name);
  const row = sqlite.prepare(`SELECT id FROM ${table} WHERE name = ?`).get(name) as { id: number };
  return row.id;
}

function values(input: LensInput) {
  return [
    lookupId('manufacturers', input.manufacturer),
    lookupId('mounts', input.mount),
    input.model,
    input.serialNumber ?? null,
    input.focalMinMm ?? null,
    input.focalMaxMm ?? null,
    input.apertureMin ?? null,
    input.apertureMax ?? null,
    input.lengthMm ?? null,
    input.diameterMm ?? null,
    input.weightGrams ?? null,
    input.filterThreadMm ?? null,
    input.elements ?? null,
    input.groups ?? null,
    input.releaseYear ?? null,
    input.purchaseDate ?? null,
    priceToMinor(input.purchasePrice),
    input.currency,
    input.condition,
    input.ownership
  ];
}

export function createLens(input: LensInput): number {
  const now = Date.now();
  const result = sqlite
    .prepare(
      `INSERT INTO lenses (
        manufacturer_id, mount_id, model, serial_number, focal_min_mm, focal_max_mm,
        aperture_min, aperture_max, length_mm, diameter_mm, weight_grams, filter_thread_mm,
        elements, groups, release_year, purchase_date, purchase_price_minor, currency,
        condition, ownership, created_at, updated_at
      ) VALUES (${Array(22).fill('?').join(',')})`
    )
    .run(...values(input), now, now);
  return Number(result.lastInsertRowid);
}

export function updateLens(id: number, input: LensInput): void {
  sqlite
    .prepare(
      `UPDATE lenses SET
        manufacturer_id=?, mount_id=?, model=?, serial_number=?, focal_min_mm=?, focal_max_mm=?,
        aperture_min=?, aperture_max=?, length_mm=?, diameter_mm=?, weight_grams=?, filter_thread_mm=?,
        elements=?, groups=?, release_year=?, purchase_date=?, purchase_price_minor=?, currency=?,
        condition=?, ownership=?, updated_at=?
      WHERE id=?`
    )
    .run(...values(input), Date.now(), id);
}

export function parseLensForm(formData: FormData) {
  return lensSchema.safeParse(Object.fromEntries(formData));
}

export function catalogueFacets() {
  return {
    manufacturers: sqlite
      .prepare('SELECT name FROM manufacturers ORDER BY name COLLATE NOCASE')
      .all() as { name: string }[],
    mounts: sqlite.prepare('SELECT name FROM mounts ORDER BY name COLLATE NOCASE').all() as {
      name: string;
    }[],
    years: sqlite
      .prepare(
        'SELECT DISTINCT release_year AS year FROM lenses WHERE release_year IS NOT NULL ORDER BY release_year DESC'
      )
      .all() as { year: number }[]
  };
}
