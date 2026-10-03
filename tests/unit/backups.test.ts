/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

import { once } from 'node:events';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import sharp from 'sharp';
import tar from 'tar-stream';
import { afterEach, describe, expect, it } from 'vitest';
import { restoreBackup } from '../../src/lib/server/backups';

const migrationsFolder = path.resolve('drizzle');
const temporaryDirectories: string[] = [];
const openDatabases: Database.Database[] = [];

async function dataPaths() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'glassbook-restore-'));
  temporaryDirectories.push(root);
  const paths = {
    database: path.join(root, 'glassbook.db'),
    originals: path.join(root, 'originals'),
    gallery: path.join(root, 'gallery'),
    thumbnails: path.join(root, 'thumbnails'),
    backups: path.join(root, 'backups')
  };
  await Promise.all(
    [paths.originals, paths.gallery, paths.thumbnails, paths.backups].map((directory) =>
      fs.mkdir(directory)
    )
  );
  return paths;
}

function migratedDatabase(filename: string) {
  const sqlite = new Database(filename);
  sqlite.pragma('foreign_keys = ON');
  migrate(drizzle(sqlite), { migrationsFolder });
  return sqlite;
}

async function archive(
  entries: { name: string; contents: Buffer | string }[],
  gzip = true
): Promise<Buffer> {
  const pack = tar.pack();
  const chunks: Buffer[] = [];
  pack.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
  const completed = once(pack, 'end');
  for (const entry of entries) pack.entry({ name: entry.name }, entry.contents);
  pack.finalize();
  await completed;
  const packed = Buffer.concat(chunks);
  return gzip ? gzipSync(packed) : packed;
}

async function backupFile(
  database: string,
  originals: { name: string; contents: Buffer }[] = [],
  gzip = true
) {
  const entries = [
    {
      name: 'manifest.json',
      contents: JSON.stringify({ format: 'glassbook-backup', version: 1 })
    },
    { name: 'glassbook.db', contents: await fs.readFile(database) },
    ...originals.map((original) => ({
      name: `originals/${original.name}`,
      contents: original.contents
    }))
  ];
  const contents = await archive(entries, gzip);
  return new File([Uint8Array.from(contents)], gzip ? 'glassbook.tar.gz' : 'glassbook.tar');
}

afterEach(async () => {
  for (const database of openDatabases.splice(0)) {
    if (database.open) database.close();
  }
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => fs.rm(directory, { recursive: true }))
  );
});

describe('backup restoration', () => {
  it('restores a compressed backup into the running database and replaces originals', async () => {
    const currentPaths = await dataPaths();
    const current = migratedDatabase(currentPaths.database);
    openDatabases.push(current);
    current
      .prepare('INSERT INTO users (id, username, password_hash, created_at) VALUES (1, ?, ?, 1)')
      .run('Current user', 'current-hash');
    current.prepare('INSERT INTO manufacturers (name) VALUES (?)').run('Current Optics');
    await Promise.all([
      fs.writeFile(path.join(currentPaths.originals, 'old.jpg'), 'old'),
      fs.writeFile(path.join(currentPaths.gallery, 'old.webp'), 'old'),
      fs.writeFile(path.join(currentPaths.thumbnails, 'old.webp'), 'old')
    ]);

    const sourcePaths = await dataPaths();
    const source = migratedDatabase(sourcePaths.database);
    source
      .prepare('INSERT INTO users (id, username, password_hash, created_at) VALUES (1, ?, ?, 2)')
      .run('Restored user', 'restored-hash');
    const manufacturerId = Number(
      source.prepare('INSERT INTO manufacturers (name) VALUES (?)').run('Restored Optics')
        .lastInsertRowid
    );
    const lensId = Number(
      source
        .prepare(
          `INSERT INTO lenses
            (manufacturer_id, model, focal_min_mm, focal_max_mm, created_at, updated_at)
           VALUES (?, 'Restored 50', 50, 50, 2, 2)`
        )
        .run(manufacturerId).lastInsertRowid
    );
    source
      .prepare(
        `INSERT INTO lens_photos
          (lens_id, storage_key, original_name, mime_type, width, height, position, is_cover, created_at)
         VALUES (?, 'restored-photo', 'restored.png', 'image/png', 20, 20, 0, 1, 2)`
      )
      .run(lensId);
    source.pragma('wal_checkpoint(TRUNCATE)');
    source.close();

    const original = await sharp({
      create: { width: 20, height: 20, channels: 3, background: '#804020' }
    })
      .png()
      .toBuffer();
    const file = await backupFile(sourcePaths.database, [
      { name: 'restored-photo.png', contents: original }
    ]);

    await expect(
      restoreBackup(file, {
        sqlite: current,
        paths: currentPaths,
        maxBytes: 10 * 1024 * 1024,
        migrationsFolder
      })
    ).resolves.toEqual({ lenses: 1, photos: 1 });

    expect(current.prepare('SELECT username FROM users').get()).toEqual({
      username: 'Restored user'
    });
    expect(current.prepare('SELECT name FROM manufacturers').all()).toEqual([
      { name: 'Restored Optics' }
    ]);
    await expect(
      fs.readFile(path.join(currentPaths.originals, 'restored-photo.png'))
    ).resolves.toEqual(original);
    await expect(fs.readdir(currentPaths.gallery)).resolves.toEqual([]);
    await expect(fs.readdir(currentPaths.thumbnails)).resolves.toEqual([]);
    await expect(fs.access(path.join(currentPaths.originals, 'old.jpg'))).rejects.toThrow();
  });

  it('accepts legacy uncompressed tar backups without a manifest', async () => {
    const currentPaths = await dataPaths();
    const current = migratedDatabase(currentPaths.database);
    openDatabases.push(current);
    current
      .prepare('INSERT INTO users (id, username, password_hash, created_at) VALUES (1, ?, ?, 1)')
      .run('Current user', 'current-hash');

    const sourcePaths = await dataPaths();
    const source = migratedDatabase(sourcePaths.database);
    source
      .prepare('INSERT INTO users (id, username, password_hash, created_at) VALUES (1, ?, ?, 2)')
      .run('Legacy user', 'legacy-hash');
    source.close();
    const packed = await archive(
      [{ name: 'glassbook.db', contents: await fs.readFile(sourcePaths.database) }],
      false
    );

    await expect(
      restoreBackup(new File([Uint8Array.from(packed)], 'legacy.tar'), {
        sqlite: current,
        paths: currentPaths,
        maxBytes: 10 * 1024 * 1024,
        migrationsFolder
      })
    ).resolves.toEqual({ lenses: 0, photos: 0 });
    expect(current.prepare('SELECT username FROM users').get()).toEqual({
      username: 'Legacy user'
    });
  });

  it('rejects unsafe archive paths without changing current data', async () => {
    const currentPaths = await dataPaths();
    const current = migratedDatabase(currentPaths.database);
    openDatabases.push(current);
    current.prepare('INSERT INTO manufacturers (name) VALUES (?)').run('Keep Me');
    const packed = await archive([{ name: '../escape', contents: 'bad' }]);

    await expect(
      restoreBackup(new File([Uint8Array.from(packed)], 'unsafe.tar.gz'), {
        sqlite: current,
        paths: currentPaths,
        maxBytes: 10 * 1024 * 1024,
        migrationsFolder
      })
    ).rejects.toThrow('unsafe path');
    expect(current.prepare('SELECT name FROM manufacturers').get()).toEqual({ name: 'Keep Me' });
  });

  it('rejects a backup with missing originals without changing current data', async () => {
    const currentPaths = await dataPaths();
    const current = migratedDatabase(currentPaths.database);
    openDatabases.push(current);
    current.prepare('INSERT INTO manufacturers (name) VALUES (?)').run('Keep Me');

    const sourcePaths = await dataPaths();
    const source = migratedDatabase(sourcePaths.database);
    source.prepare('INSERT INTO manufacturers (name) VALUES (?)').run('Incomplete');
    const lensId = Number(
      source
        .prepare(
          `INSERT INTO lenses
            (manufacturer_id, model, focal_min_mm, focal_max_mm, created_at, updated_at)
           VALUES (1, 'Missing photo', 50, 50, 2, 2)`
        )
        .run().lastInsertRowid
    );
    source
      .prepare(
        `INSERT INTO lens_photos
          (lens_id, storage_key, original_name, mime_type, width, height, position, is_cover, created_at)
         VALUES (?, 'missing-photo', 'missing.jpg', 'image/jpeg', 20, 20, 0, 1, 2)`
      )
      .run(lensId);
    source.close();

    const file = await backupFile(sourcePaths.database);
    await expect(
      restoreBackup(file, {
        sqlite: current,
        paths: currentPaths,
        maxBytes: 10 * 1024 * 1024,
        migrationsFolder
      })
    ).rejects.toThrow('missing original image');
    expect(current.prepare('SELECT name FROM manufacturers').get()).toEqual({ name: 'Keep Me' });
  });
});
