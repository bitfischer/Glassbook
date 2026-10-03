/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import type { Actions } from './$types';
import { createSession, hashPassword } from '$lib/server/auth';
import { isInitialized, sqlite } from '$lib/server/db';

const setupSchema = z
  .object({
    username: z.string().trim().min(2, 'Use at least 2 characters').max(60),
    password: z.string().min(5, 'Use at least 5 characters').max(200),
    confirmPassword: z.string()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

export const actions = {
  default: async ({ request, cookies }) => {
    if (isInitialized()) throw redirect(303, '/login');
    const values = Object.fromEntries(await request.formData());
    const result = setupSchema.safeParse(values);
    if (!result.success) {
      return fail(400, {
        values: { username: String(values.username ?? '') },
        errors: result.error.flatten().fieldErrors
      });
    }
    const passwordHash = await hashPassword(result.data.password);
    try {
      sqlite
        .prepare('INSERT INTO users (id, username, password_hash, created_at) VALUES (1, ?, ?, ?)')
        .run(result.data.username, passwordHash, Date.now());
    } catch {
      return fail(409, { message: 'Setup has already been completed.' });
    }
    createSession(1, cookies);
    throw redirect(303, '/');
  }
} satisfies Actions;
