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
import { config, paths } from '$lib/server/config';
import { sqlite } from '$lib/server/db';
import {
  buildImageDerivatives,
  ensureImageDerivatives,
  originalExtension
} from '$lib/server/image-derivatives';

const formats = {
  jpeg: { mime: 'image/jpeg', extension: 'jpg' },
  png: { mime: 'image/png', extension: 'png' },
  webp: { mime: 'image/webp', extension: 'webp' }
} as const;

export async function addPhoto(lensId: number, file: File): Promise<number> {
  if (!file.size) throw new Error('Choose an image to upload.');
  if (file.size > config.maxUploadBytes) {
    throw new Error(
      `Images must be smaller than ${Math.round(config.maxUploadBytes / 1024 / 1024)} MB.`
    );
  }
  const count = (
    sqlite.prepare('SELECT COUNT(*) AS count FROM lens_photos WHERE lens_id = ?').get(lensId) as {
      count: number;
    }
  ).count;
  if (count >= config.maxPhotosPerLens) {
    throw new Error(`A lens can have at most ${config.maxPhotosPerLens} photos.`);
  }

  const source = Buffer.from(await file.arrayBuffer());
  const image = sharp(source, { failOn: 'warning', limitInputPixels: 80_000_000 });
  const metadata = await image.metadata();
  const type = formats[metadata.format as keyof typeof formats];
  if (!type || !metadata.width || !metadata.height) {
    throw new Error('Only valid JPEG, PNG, and WebP images are accepted.');
  }

  const key = randomUUID();
  const originalName = `${key}.${type.extension}`;
  const thumbnailName = `${key}.webp`;
  const originalPath = path.join(paths.originals, originalName);
  const galleryPath = path.join(paths.gallery, thumbnailName);
  const thumbnailPath = path.join(paths.thumbnails, thumbnailName);
  const { gallery, thumbnail } = await buildImageDerivatives(source);

  const written: string[] = [];
  try {
    await fs.writeFile(originalPath, source, { flag: 'wx' });
    written.push(originalPath);
    await fs.writeFile(galleryPath, gallery, { flag: 'wx' });
    written.push(galleryPath);
    await fs.writeFile(thumbnailPath, thumbnail, { flag: 'wx' });
    written.push(thumbnailPath);
    const transaction = sqlite.transaction(() => {
      if (count === 0) {
        sqlite.prepare('UPDATE lens_photos SET is_cover = 0 WHERE lens_id = ?').run(lensId);
      }
      const result = sqlite
        .prepare(
          `INSERT INTO lens_photos
            (lens_id, storage_key, original_name, mime_type, width, height, position, is_cover, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          lensId,
          key,
          file.name.slice(0, 255) || originalName,
          type.mime,
          metadata.width,
          metadata.height,
          count,
          count === 0 ? 1 : 0,
          Date.now()
        );
      return Number(result.lastInsertRowid);
    });
    return transaction();
  } catch (cause) {
    await Promise.all(written.map((filename) => fs.rm(filename, { force: true })));
    throw cause;
  }
}

export function photoPath(
  photo: { storageKey: string; mimeType: string },
  variant: 'original' | 'gallery' | 'thumbnail'
): { filename: string; mime: string } {
  if (variant === 'original') {
    return {
      filename: path.join(
        paths.originals,
        `${photo.storageKey}.${originalExtension(photo.mimeType)}`
      ),
      mime: photo.mimeType
    };
  }
  return {
    filename: path.join(
      variant === 'gallery' ? paths.gallery : paths.thumbnails,
      `${photo.storageKey}.webp`
    ),
    mime: 'image/webp'
  };
}

export async function ensurePhotoDerivatives(photo: {
  storageKey: string;
  mimeType: string;
}): Promise<number> {
  const source = await fs.readFile(photoPath(photo, 'original').filename);
  return ensureImageDerivatives(source, {
    gallery: photoPath(photo, 'gallery').filename,
    thumbnail: photoPath(photo, 'thumbnail').filename
  });
}

export async function deletePhoto(photoId: number, lensId: number): Promise<void> {
  const photo = sqlite
    .prepare(
      'SELECT id, storage_key AS storageKey, mime_type AS mimeType, is_cover AS isCover FROM lens_photos WHERE id = ? AND lens_id = ?'
    )
    .get(photoId, lensId) as
    { id: number; storageKey: string; mimeType: string; isCover: number } | undefined;
  if (!photo) return;
  sqlite.transaction(() => {
    sqlite.prepare('DELETE FROM lens_photos WHERE id = ?').run(photo.id);
    if (photo.isCover) {
      sqlite
        .prepare(
          'UPDATE lens_photos SET is_cover = 1 WHERE id = (SELECT id FROM lens_photos WHERE lens_id = ? ORDER BY position, id LIMIT 1)'
        )
        .run(lensId);
    }
  })();
  await Promise.all(
    (['original', 'gallery', 'thumbnail'] as const).map(async (variant) => {
      try {
        await fs.rm(photoPath(photo, variant).filename, { force: true });
      } catch {
        // The database remains authoritative; orphan cleanup can retry filesystem removal.
      }
    })
  );
}
