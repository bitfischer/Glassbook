/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

import fs from 'node:fs/promises';
import { error } from '@sveltejs/kit';
import { sqlite } from '$lib/server/db';
import { ensurePhotoDerivatives, photoPath } from '$lib/server/images';

export const GET = async ({ params }) => {
  const id = Number(params.id);
  const variant = params.variant;
  if (!Number.isSafeInteger(id) || !['original', 'gallery', 'thumbnail'].includes(variant)) {
    throw error(404, 'Image not found');
  }
  const photo = sqlite
    .prepare(
      'SELECT storage_key AS storageKey, mime_type AS mimeType FROM lens_photos WHERE id = ?'
    )
    .get(id) as { storageKey: string; mimeType: string } | undefined;
  if (!photo) throw error(404, 'Image not found');
  const stored = photoPath(photo, variant as 'original' | 'gallery' | 'thumbnail');
  try {
    return new Response(await fs.readFile(stored.filename), {
      headers: {
        'Content-Type': stored.mime,
        'Cache-Control': 'private, max-age=86400',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch (cause) {
    if (variant !== 'original' && (cause as NodeJS.ErrnoException).code === 'ENOENT') {
      try {
        await ensurePhotoDerivatives(photo);
        return new Response(await fs.readFile(stored.filename), {
          headers: {
            'Content-Type': stored.mime,
            'Cache-Control': 'private, max-age=86400',
            'X-Content-Type-Options': 'nosniff'
          }
        });
      } catch {
        // Missing or invalid originals cannot be repaired on demand.
      }
    }
    throw error(404, 'Image file not found');
  }
};
