/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

import { randomUUID } from 'node:crypto';
import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import { createGunzip } from 'node:zlib';
import path from 'node:path';
import { PassThrough, Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import tar from 'tar-stream';
import { originalExtension } from '$lib/server/image-derivatives';

const restoreTables = [
  'users',
  'manufacturers',
  'mounts',
  'lenses',
  'sessions',
  'daily_lenses',
  'daily_lens_history',
  'daily_challenges',
  'lens_photos',
  'lens_entries',
  'lens_entry_photos'
] as const;

const deleteOrder = [...restoreTables].reverse();

type RestorePaths = {
  database: string;
  originals: string;
  gallery: string;
  thumbnails: string;
  backups: string;
};

type RestoreOptions = {
  sqlite: Database.Database;
  paths: RestorePaths;
  maxBytes: number;
  migrationsFolder: string;
};

type RestoreStats = { lenses: number; photos: number };

function archiveEntryName(name: string): string {
  if (name.includes('\\') || name.startsWith('/'))
    throw new Error('The backup contains an unsafe path.');
  const parts = name.split('/');
  if (parts.some((part) => part === '..' || part === '.')) {
    throw new Error('The backup contains an unsafe path.');
  }
  return name;
}

async function isGzip(file: File): Promise<boolean> {
  const signature = new Uint8Array(await file.slice(0, 2).arrayBuffer());
  return signature[0] === 0x1f && signature[1] === 0x8b;
}

async function extractBackupArchive(
  file: File,
  stage: string,
  maxBytes: number
): Promise<{ database: string; originals: string }> {
  if (!file.size) throw new Error('Choose a backup archive to restore.');
  if (file.size > maxBytes) {
    throw new Error(
      `Backup archives must be smaller than ${Math.round(maxBytes / 1024 / 1024)} MB.`
    );
  }

  const database = path.join(stage, 'glassbook.db');
  const originals = path.join(stage, 'originals');
  const manifest = path.join(stage, 'manifest.json');
  await fs.mkdir(originals, { recursive: true });

  const seen = new Set<string>();
  let extractedBytes = 0;
  const extract = tar.extract();
  extract.on('entry', (header, stream, next) => {
    void (async () => {
      const name = archiveEntryName(header.name);
      if (header.type === 'directory' && (name === 'originals' || name === 'originals/')) {
        stream.resume();
        return;
      }
      if (header.type !== 'file') throw new Error('The backup contains an unsupported entry type.');
      if (seen.has(name)) throw new Error(`The backup contains duplicate entry ${name}.`);
      seen.add(name);
      extractedBytes += header.size ?? 0;
      if (extractedBytes > maxBytes) throw new Error('The expanded backup is too large.');

      let destination: string;
      if (name === 'glassbook.db') destination = database;
      else if (name === 'manifest.json') destination = manifest;
      else if (
        name.startsWith('originals/') &&
        name.slice('originals/'.length) &&
        !name.slice('originals/'.length).includes('/')
      ) {
        destination = path.join(originals, name.slice('originals/'.length));
      } else {
        throw new Error(`The backup contains unexpected entry ${name}.`);
      }

      await pipeline(stream, fsSync.createWriteStream(destination, { flags: 'wx', mode: 0o600 }));
    })().then(next, (cause) => extract.destroy(cause as Error));
  });

  const source = Readable.fromWeb(file.stream() as never);
  await pipeline(source, (await isGzip(file)) ? createGunzip() : new PassThrough(), extract);

  try {
    await fs.access(database);
  } catch {
    throw new Error('The archive does not contain glassbook.db.');
  }

  try {
    const parsed = JSON.parse(await fs.readFile(manifest, 'utf8')) as {
      format?: string;
      version?: number;
    };
    if (parsed.format !== 'glassbook-backup' || parsed.version !== 1) {
      throw new Error('The backup manifest is not supported.');
    }
  } catch (cause) {
    if ((cause as NodeJS.ErrnoException).code !== 'ENOENT') throw cause;
    // Legacy .tar backups predate the manifest and remain supported.
  }

  return { database, originals };
}

function tableColumns(database: Database.Database, table: string): string[] {
  return (database.prepare(`PRAGMA table_info("${table}")`).all() as { name: string }[]).map(
    ({ name }) => name
  );
}

function validateDatabase(
  databasePath: string,
  originals: string,
  current: Database.Database,
  migrationsFolder: string
): RestoreStats {
  const restored = new Database(databasePath);
  try {
    restored.pragma('foreign_keys = ON');
    migrate(drizzle(restored), { migrationsFolder });

    const integrity = restored.pragma('quick_check') as { quick_check: string }[];
    if (integrity.length !== 1 || integrity[0]?.quick_check !== 'ok') {
      throw new Error('The backup database failed its integrity check.');
    }
    if ((restored.pragma('foreign_key_check') as unknown[]).length) {
      throw new Error('The backup database contains invalid relationships.');
    }

    for (const table of restoreTables) {
      const expected = tableColumns(current, table);
      const actual = tableColumns(restored, table);
      if (!expected.length || expected.join('\0') !== actual.join('\0')) {
        throw new Error(`The backup has an incompatible ${table} table.`);
      }
    }

    const photos = restored
      .prepare('SELECT storage_key AS storageKey, mime_type AS mimeType FROM lens_photos')
      .all() as { storageKey: string; mimeType: string }[];
    for (const photo of photos) {
      const filename = path.join(
        originals,
        `${photo.storageKey}.${originalExtension(photo.mimeType)}`
      );
      try {
        fsSync.accessSync(filename);
      } catch {
        throw new Error(`The backup is missing original image ${path.basename(filename)}.`);
      }
    }

    restored.pragma('wal_checkpoint(TRUNCATE)');
    return {
      lenses: (restored.prepare('SELECT COUNT(*) AS count FROM lenses').get() as { count: number })
        .count,
      photos: photos.length
    };
  } finally {
    restored.close();
  }
}

function quoted(identifier: string): string {
  if (!/^[a-z_]+$/.test(identifier)) throw new Error('Invalid database identifier.');
  return `"${identifier}"`;
}

function replaceDatabaseContents(sqlite: Database.Database, restoredDatabase: string): void {
  sqlite.prepare('ATTACH DATABASE ? AS restore_source').run(restoredDatabase);
  sqlite.pragma('foreign_keys = OFF');
  try {
    sqlite.transaction(() => {
      for (const table of deleteOrder) sqlite.exec(`DELETE FROM ${quoted(table)}`);
      for (const table of restoreTables) {
        const columns = tableColumns(sqlite, table).map(quoted).join(', ');
        sqlite.exec(
          `INSERT INTO main.${quoted(table)} (${columns}) SELECT ${columns} FROM restore_source.${quoted(table)}`
        );
      }
    })();
  } finally {
    sqlite.pragma('foreign_keys = ON');
    sqlite.exec('DETACH DATABASE restore_source');
  }
}

async function swapImageDirectories(stage: string, paths: RestorePaths) {
  const replacements = [
    {
      current: paths.originals,
      next: path.join(stage, 'originals'),
      previous: path.join(stage, 'previous-originals')
    },
    {
      current: paths.gallery,
      next: path.join(stage, 'gallery'),
      previous: path.join(stage, 'previous-gallery')
    },
    {
      current: paths.thumbnails,
      next: path.join(stage, 'thumbnails'),
      previous: path.join(stage, 'previous-thumbnails')
    }
  ];
  await Promise.all([fs.mkdir(replacements[1].next), fs.mkdir(replacements[2].next)]);

  const completed: typeof replacements = [];
  try {
    for (const replacement of replacements) {
      await fs.rename(replacement.current, replacement.previous);
      try {
        await fs.rename(replacement.next, replacement.current);
        completed.push(replacement);
      } catch (cause) {
        await fs.rename(replacement.previous, replacement.current);
        throw cause;
      }
    }
  } catch (cause) {
    for (const replacement of completed.reverse()) {
      await fs.rm(replacement.current, { recursive: true, force: true });
      await fs.rename(replacement.previous, replacement.current);
    }
    throw cause;
  }

  return async () => {
    for (const replacement of replacements.reverse()) {
      await fs.rm(replacement.current, { recursive: true, force: true });
      await fs.rename(replacement.previous, replacement.current);
    }
  };
}

export async function restoreBackup(file: File, options: RestoreOptions): Promise<RestoreStats> {
  const stage = path.join(options.paths.backups, `restore-${randomUUID()}`);
  await fs.mkdir(stage, { recursive: true });
  let rollbackImages: (() => Promise<void>) | undefined;
  try {
    const extracted = await extractBackupArchive(file, stage, options.maxBytes);
    const stats = validateDatabase(
      extracted.database,
      extracted.originals,
      options.sqlite,
      options.migrationsFolder
    );
    rollbackImages = await swapImageDirectories(stage, options.paths);
    try {
      replaceDatabaseContents(options.sqlite, extracted.database);
    } catch (cause) {
      await rollbackImages();
      rollbackImages = undefined;
      throw cause;
    }
    options.sqlite.pragma('wal_checkpoint(TRUNCATE)');
    return stats;
  } finally {
    await fs.rm(stage, { recursive: true, force: true });
  }
}
