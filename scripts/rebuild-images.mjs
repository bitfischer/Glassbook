/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import Database from 'better-sqlite3';
import { ensureImageDerivatives, originalExtension } from '../src/lib/server/image-derivatives.ts';

const dataDir = path.resolve(process.env.DATA_DIR ?? './data');
const databasePath = path.join(dataDir, 'glassbook.db');
const originals = path.join(dataDir, 'originals');
const gallery = path.join(dataDir, 'gallery');
const thumbnails = path.join(dataDir, 'thumbnails');

await Promise.all([
  fs.mkdir(gallery, { recursive: true }),
  fs.mkdir(thumbnails, { recursive: true })
]);

const database = new Database(databasePath, { readonly: true, fileMustExist: true });
const photos = database
  .prepare('SELECT storage_key AS storageKey, mime_type AS mimeType FROM lens_photos ORDER BY id')
  .all();
database.close();

async function exists(filename) {
  try {
    await fs.access(filename);
    return true;
  } catch (cause) {
    if (cause.code === 'ENOENT') return false;
    throw cause;
  }
}

let rebuilt = 0;
let skipped = 0;
let failed = 0;
for (const photo of photos) {
  const destinations = {
    gallery: path.join(gallery, `${photo.storageKey}.webp`),
    thumbnail: path.join(thumbnails, `${photo.storageKey}.webp`)
  };
  const present = await Promise.all([exists(destinations.gallery), exists(destinations.thumbnail)]);
  skipped += present.filter(Boolean).length;
  const missing = present.filter((value) => !value).length;
  if (!missing) continue;

  try {
    const extension = originalExtension(photo.mimeType);
    const source = await fs.readFile(path.join(originals, `${photo.storageKey}.${extension}`));
    rebuilt += await ensureImageDerivatives(source, destinations);
  } catch (cause) {
    failed += missing;
    const message = cause instanceof Error ? cause.message : String(cause);
    console.error(`Failed ${photo.storageKey}: ${message}`);
  }
}

console.log(
  `Image derivative rebuild complete: ${photos.length} photos scanned, ${rebuilt} rebuilt, ${skipped} already present, ${failed} failed.`
);
if (failed) process.exitCode = 1;
