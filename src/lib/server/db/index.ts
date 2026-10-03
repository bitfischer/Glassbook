/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { paths } from '$lib/server/config';
import * as schema from './schema';

for (const directory of [
  paths.database.substring(0, paths.database.lastIndexOf('/')),
  paths.originals,
  paths.thumbnails,
  paths.gallery,
  paths.backups
]) {
  fs.mkdirSync(directory, { recursive: true });
}

export const sqlite = new Database(paths.database);
sqlite.pragma('foreign_keys = ON');
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('busy_timeout = 5000');

export const db = drizzle(sqlite, { schema });
migrate(db, { migrationsFolder: path.resolve('drizzle') });

export function isInitialized(): boolean {
  return Boolean(sqlite.prepare('SELECT 1 FROM users WHERE id = 1').get());
}

export function closeDatabase(): void {
  sqlite.close();
}
