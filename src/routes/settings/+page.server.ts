/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

import path from 'node:path';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { restoreBackup } from '$lib/server/backups';
import { config, paths } from '$lib/server/config';
import { sqlite } from '$lib/server/db';
import { chooseNewLensOfTheDay } from '$lib/server/lenses';
import { destroySession, hashPassword } from '$lib/server/auth';
import { isAuthenticationEnabled, setAuthenticationEnabled } from '$lib/server/auth-settings';

const tables = { manufacturer: 'manufacturers', mount: 'mounts' } as const;

export const load = () => ({
  authentication: {
    enabled: isAuthenticationEnabled(),
    user: sqlite.prepare('SELECT username FROM users WHERE id = 1').get() as
      { username: string } | undefined
  },
  manufacturers: sqlite
    .prepare('SELECT id, name FROM manufacturers ORDER BY name COLLATE NOCASE')
    .all() as { id: number; name: string }[],
  mounts: sqlite.prepare('SELECT id, name FROM mounts ORDER BY name COLLATE NOCASE').all() as {
    id: number;
    name: string;
  }[]
});

export const actions = {
  authentication: async ({ request, cookies, locals }) => {
    const data = await request.formData();
    const enabled = data.get('enabled') === 'on';
    const existingUser = sqlite.prepare('SELECT id FROM users WHERE id = 1').get() as
      { id: number } | undefined;
    const username = String(data.get('username') ?? '').trim();
    const password = String(data.get('password') ?? '');
    const confirmPassword = String(data.get('confirmPassword') ?? '');

    if (enabled && !existingUser && (username.length < 2 || username.length > 60)) {
      return fail(400, { message: 'Use a username between 2 and 60 characters.', authError: true });
    }
    if ((enabled && !existingUser) || password || confirmPassword) {
      if (password.length < 5 || password.length > 200) {
        return fail(400, {
          message: 'Use a password between 5 and 200 characters.',
          authError: true
        });
      }
      if (password !== confirmPassword) {
        return fail(400, { message: 'Passwords do not match.', authError: true });
      }
    }

    const wasEnabled = isAuthenticationEnabled();
    if (!existingUser && enabled) {
      sqlite
        .prepare('INSERT INTO users (id, username, password_hash, created_at) VALUES (1, ?, ?, ?)')
        .run(username, await hashPassword(password), Date.now());
    } else if (existingUser && password) {
      sqlite
        .prepare('UPDATE users SET password_hash = ? WHERE id = 1')
        .run(await hashPassword(password));
    }
    setAuthenticationEnabled(enabled);

    if (wasEnabled !== enabled || password) {
      sqlite.prepare('DELETE FROM sessions').run();
      destroySession(locals.sessionId, cookies);
      if (enabled) throw redirect(303, '/login');
    }
    return {
      message: enabled ? 'Authentication settings updated.' : 'Authentication is disabled.'
    };
  },
  restore: async ({ request }) => {
    const data = await request.formData();
    const archive = data.get('backup');
    if (!(archive instanceof File) || !archive.size) {
      return fail(400, { message: 'Choose a .tar.gz backup to restore.', restoreError: true });
    }
    try {
      const restored = await restoreBackup(archive, {
        sqlite,
        paths,
        maxBytes: config.maxRestoreBytes,
        migrationsFolder: path.resolve('drizzle')
      });
      return {
        message: `Backup restored: ${restored.lenses} lenses and ${restored.photos} photos.`,
        restored: true
      };
    } catch (cause) {
      return fail(400, {
        message: `Restore failed: ${cause instanceof Error ? cause.message : 'Invalid backup archive.'}`,
        restoreError: true
      });
    }
  },
  chooseAgain: () => ({
    message: chooseNewLensOfTheDay()
      ? 'Lens of the day updated.'
      : 'Add a lens before choosing one.'
  }),
  add: async ({ request }) => {
    const data = await request.formData();
    const kind = String(data.get('kind')) as keyof typeof tables;
    const name = String(data.get('name') ?? '').trim();
    if (!tables[kind] || !name || name.length > 100) {
      return fail(400, { message: 'Enter a valid name.' });
    }
    try {
      sqlite.prepare(`INSERT INTO ${tables[kind]} (name) VALUES (?)`).run(name);
      return { message: `${name} added.` };
    } catch {
      return fail(409, { message: 'That value already exists.' });
    }
  },
  delete: async ({ request }) => {
    const data = await request.formData();
    const kind = String(data.get('kind')) as keyof typeof tables;
    const id = Number(data.get('id'));
    if (!tables[kind] || !Number.isSafeInteger(id)) return fail(400, { message: 'Invalid value.' });
    try {
      sqlite.prepare(`DELETE FROM ${tables[kind]} WHERE id = ?`).run(id);
      return { message: 'Value deleted.' };
    } catch {
      return fail(409, { message: 'This value is used by a lens and cannot be deleted.' });
    }
  }
} satisfies Actions;
