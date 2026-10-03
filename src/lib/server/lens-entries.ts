/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

import { lensEntrySchema, type LensEntryInput } from '$lib/domain';
import { sqlite } from '$lib/server/db';

export type LensEntryView = {
  id: number;
  lensId: number;
  type: 'note' | 'memory';
  eventDate: string | null;
  body: string;
  createdAt: number;
  updatedAt: number;
  photoIds: number[];
};

type LensEntryRow = Omit<LensEntryView, 'photoIds'> & { photoIds: string | null };

export function listLensEntries(lensId: number): LensEntryView[] {
  return (
    sqlite
      .prepare(
        `SELECT e.id, e.lens_id AS lensId, e.type, e.event_date AS eventDate, e.body,
        e.created_at AS createdAt, e.updated_at AS updatedAt,
        (SELECT GROUP_CONCAT(ep.photo_id, ',') FROM lens_entry_photos ep WHERE ep.entry_id = e.id) AS photoIds
       FROM lens_entries e
       WHERE e.lens_id = ?
       ORDER BY
         CASE e.type WHEN 'note' THEN 0 ELSE 1 END,
         CASE WHEN e.type = 'note' THEN e.updated_at END DESC,
         CASE WHEN e.type = 'memory' AND e.event_date IS NOT NULL THEN 0 ELSE 1 END,
         e.event_date DESC,
         e.created_at DESC,
         e.id DESC`
      )
      .all(lensId) as LensEntryRow[]
  ).map((entry) => ({
    ...entry,
    photoIds: entry.photoIds ? entry.photoIds.split(',').map(Number) : []
  }));
}

export function createLensEntry(lensId: number, input: LensEntryInput): number {
  const now = Date.now();
  const result = sqlite
    .prepare(
      `INSERT INTO lens_entries (lens_id, type, event_date, body, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(lensId, input.type, input.eventDate ?? null, input.body, now, now);
  return Number(result.lastInsertRowid);
}

export function updateLensEntry(lensId: number, entryId: number, input: LensEntryInput): boolean {
  return sqlite.transaction(() => {
    const result = sqlite
      .prepare(
        `UPDATE lens_entries SET type = ?, event_date = ?, body = ?, updated_at = ?
         WHERE id = ? AND lens_id = ?`
      )
      .run(input.type, input.eventDate ?? null, input.body, Date.now(), entryId, lensId);
    if (result.changes === 1 && input.type === 'note') {
      sqlite.prepare('DELETE FROM lens_entry_photos WHERE entry_id = ?').run(entryId);
    }
    return result.changes === 1;
  })();
}

export function attachLensEntryPhoto(lensId: number, entryId: number, photoId: number): boolean {
  const result = sqlite
    .prepare(
      `INSERT OR IGNORE INTO lens_entry_photos (entry_id, photo_id, created_at)
       SELECT e.id, p.id, ?
       FROM lens_entries e
       JOIN lens_photos p ON p.lens_id = e.lens_id
       WHERE e.id = ? AND e.lens_id = ? AND e.type = 'memory' AND p.id = ?`
    )
    .run(Date.now(), entryId, lensId, photoId);
  return result.changes === 1;
}

export function detachLensEntryPhoto(lensId: number, entryId: number, photoId: number): boolean {
  const result = sqlite
    .prepare(
      `DELETE FROM lens_entry_photos
       WHERE entry_id = ? AND photo_id = ?
         AND EXISTS (SELECT 1 FROM lens_entries WHERE id = ? AND lens_id = ?)`
    )
    .run(entryId, photoId, entryId, lensId);
  return result.changes === 1;
}

export function deleteLensEntry(lensId: number, entryId: number): boolean {
  return (
    sqlite.prepare('DELETE FROM lens_entries WHERE id = ? AND lens_id = ?').run(entryId, lensId)
      .changes === 1
  );
}

export function parseLensEntryForm(formData: FormData) {
  return lensEntrySchema.safeParse(Object.fromEntries(formData));
}
