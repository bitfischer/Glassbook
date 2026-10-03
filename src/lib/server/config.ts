/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

import path from 'node:path';

function positiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export const config = {
  dataDir: path.resolve(process.env.DATA_DIR ?? './data'),
  sessionDays: positiveInt(process.env.SESSION_DAYS, 30),
  maxUploadBytes: positiveInt(process.env.MAX_UPLOAD_MB, 15) * 1024 * 1024,
  maxPhotosPerLens: positiveInt(process.env.MAX_PHOTOS_PER_LENS, 10),
  maxRestoreBytes: positiveInt(process.env.MAX_RESTORE_MB, 1024) * 1024 * 1024,
  defaultCurrency: (process.env.DEFAULT_CURRENCY ?? 'EUR').toUpperCase(),
  secureCookies: (process.env.ORIGIN ?? '').startsWith('https://'),
  authEnabledByDefault: process.env.AUTH_ENABLED === 'true'
};

export const paths = {
  database: path.join(config.dataDir, 'glassbook.db'),
  originals: path.join(config.dataDir, 'originals'),
  thumbnails: path.join(config.dataDir, 'thumbnails'),
  gallery: path.join(config.dataDir, 'gallery'),
  backups: path.join(config.dataDir, 'backups')
};
