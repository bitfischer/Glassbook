/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { afterEach, describe, expect, it } from 'vitest';

const migrationsFolder = path.resolve('drizzle');
const temporaryDirectories: string[] = [];

async function temporaryDatabase() {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'glassbook-migrations-'));
  temporaryDirectories.push(directory);
  const sqlite = new Database(path.join(directory, 'glassbook.db'));
  sqlite.pragma('foreign_keys = ON');
  return sqlite;
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => fs.rm(directory, { recursive: true }))
  );
});

describe('database migrations', () => {
  it('creates a fresh schema and remains idempotent', async () => {
    const sqlite = await temporaryDatabase();
    const database = drizzle(sqlite);

    migrate(database, { migrationsFolder });
    const tables = (
      sqlite.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all() as {
        name: string;
      }[]
    ).map(({ name }) => name);

    expect(tables).toEqual(
      expect.arrayContaining([
        '__drizzle_migrations',
        'app_settings',
        'daily_challenges',
        'daily_lenses',
        'lens_entries',
        'lens_entry_photos',
        'lens_photos',
        'lenses',
        'manufacturers',
        'mounts',
        'sessions',
        'users'
      ])
    );
    expect(
      (
        sqlite.prepare('SELECT COUNT(*) AS count FROM __drizzle_migrations').get() as {
          count: number;
        }
      ).count
    ).toBe(2);

    migrate(database, { migrationsFolder });
    expect(
      (
        sqlite.prepare('SELECT COUNT(*) AS count FROM __drizzle_migrations').get() as {
          count: number;
        }
      ).count
    ).toBe(2);
    sqlite.close();
  });

  it('adopts an existing unversioned database without losing data', async () => {
    const sqlite = await temporaryDatabase();
    sqlite.exec(`
      CREATE TABLE manufacturers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL COLLATE NOCASE UNIQUE
      );
      INSERT INTO manufacturers (name) VALUES ('Legacy Optics');
    `);

    migrate(drizzle(sqlite), { migrationsFolder });

    expect(sqlite.prepare('SELECT name FROM manufacturers').get()).toEqual({
      name: 'Legacy Optics'
    });
    expect(sqlite.prepare("SELECT 1 FROM sqlite_master WHERE name = 'lens_entries'").get()).toEqual(
      {
        '1': 1
      }
    );
    sqlite.close();
  });

  it('rolls back a migration that fails', async () => {
    const sqlite = await temporaryDatabase();
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'glassbook-broken-migration-'));
    temporaryDirectories.push(directory);
    await fs.mkdir(path.join(directory, 'meta'));
    await fs.writeFile(
      path.join(directory, 'meta', '_journal.json'),
      JSON.stringify({
        version: '7',
        dialect: 'sqlite',
        entries: [{ idx: 0, version: '6', when: 1, tag: '0000_broken', breakpoints: true }]
      })
    );
    await fs.writeFile(
      path.join(directory, '0000_broken.sql'),
      'CREATE TABLE should_roll_back (id INTEGER);\n--> statement-breakpoint\nINVALID SQL;'
    );

    expect(() => migrate(drizzle(sqlite), { migrationsFolder: directory })).toThrow();
    expect(
      sqlite.prepare("SELECT 1 FROM sqlite_master WHERE name = 'should_roll_back'").get()
    ).toBeUndefined();
    sqlite.close();
  });
});
