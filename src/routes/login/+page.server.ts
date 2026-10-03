/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { createSession, verifyPassword } from '$lib/server/auth';
import { sqlite } from '$lib/server/db';

export const actions = {
  default: async ({ request, cookies, url }) => {
    const data = await request.formData();
    const username = String(data.get('username') ?? '').trim();
    const password = String(data.get('password') ?? '');
    const user = sqlite
      .prepare('SELECT id, username, password_hash AS passwordHash FROM users WHERE username = ?')
      .get(username) as { id: number; username: string; passwordHash: string } | undefined;

    if (!user || !(await verifyPassword(user.passwordHash, password))) {
      return fail(400, { username, message: 'Invalid username or password.' });
    }
    createSession(user.id, cookies);
    const requested = url.searchParams.get('returnTo');
    const returnTo = requested?.startsWith('/') && !requested.startsWith('//') ? requested : '/';
    throw redirect(303, returnTo);
  }
} satisfies Actions;
