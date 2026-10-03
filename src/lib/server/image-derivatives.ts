/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

export const imageFormats = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
} as const;

export type StoredImageMime = keyof typeof imageFormats;

export function originalExtension(mimeType: string): string {
  const extension = imageFormats[mimeType as StoredImageMime];
  if (!extension) throw new Error('Unsupported stored image type');
  return extension;
}

export async function buildImageDerivatives(source: Buffer): Promise<{
  gallery: Buffer;
  thumbnail: Buffer;
}> {
  const [gallery, thumbnail] = await Promise.all([
    sharp(source)
      .rotate()
      .resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 86 })
      .toBuffer(),
    sharp(source)
      .rotate()
      .resize({ width: 640, height: 480, fit: 'cover' })
      .webp({ quality: 78 })
      .toBuffer()
  ]);
  return { gallery, thumbnail };
}

async function missing(filename: string): Promise<boolean> {
  try {
    await fs.access(filename);
    return false;
  } catch (cause) {
    if ((cause as NodeJS.ErrnoException).code === 'ENOENT') return true;
    throw cause;
  }
}

async function writeAtomicallyIfMissing(filename: string, contents: Buffer): Promise<boolean> {
  if (!(await missing(filename))) return false;
  await fs.mkdir(path.dirname(filename), { recursive: true });
  const temporary = `${filename}.${randomUUID()}.tmp`;
  await fs.writeFile(temporary, contents, { flag: 'wx' });
  try {
    await fs.link(temporary, filename);
    return true;
  } catch (cause) {
    if ((cause as NodeJS.ErrnoException).code === 'EEXIST') return false;
    throw cause;
  } finally {
    await fs.rm(temporary, { force: true });
  }
}

export async function ensureImageDerivatives(
  source: Buffer,
  destinations: { gallery: string; thumbnail: string }
): Promise<number> {
  const [galleryMissing, thumbnailMissing] = await Promise.all([
    missing(destinations.gallery),
    missing(destinations.thumbnail)
  ]);
  if (!galleryMissing && !thumbnailMissing) return 0;
  const derivatives = await buildImageDerivatives(source);
  const written = await Promise.all([
    galleryMissing ? writeAtomicallyIfMissing(destinations.gallery, derivatives.gallery) : false,
    thumbnailMissing
      ? writeAtomicallyIfMissing(destinations.thumbnail, derivatives.thumbnail)
      : false
  ]);
  return written.filter(Boolean).length;
}
