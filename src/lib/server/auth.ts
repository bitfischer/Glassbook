/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

import { createHash, randomBytes } from 'node:crypto';
import argon2 from 'argon2';
import type { Cookies } from '@sveltejs/kit';
import { sqlite } from '$lib/server/db';
import { config } from '$lib/server/config';

const COOKIE_NAME = 'glassbook_session';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1
  });
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

export function createSession(userId: number, cookies: Cookies): void {
  const token = randomBytes(32).toString('base64url');
  const now = Date.now();
  const expiresAt = now + config.sessionDays * 86_400_000;
  sqlite
    .prepare(
      'INSERT INTO sessions (user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?)'
    )
    .run(userId, hashToken(token), expiresAt, now);
  cookies.set(COOKIE_NAME, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'strict',
    secure: config.secureCookies,
    maxAge: config.sessionDays * 86_400
  });
}

export function readSession(cookies: Cookies): {
  sessionId: number;
  user: { id: number; username: string };
} | null {
  const token = cookies.get(COOKIE_NAME);
  if (!token) return null;
  const row = sqlite
    .prepare(
      `SELECT sessions.id AS sessionId, users.id, users.username, sessions.expires_at AS expiresAt
       FROM sessions JOIN users ON users.id = sessions.user_id
       WHERE sessions.token_hash = ?`
    )
    .get(hashToken(token)) as
    { sessionId: number; id: number; username: string; expiresAt: number } | undefined;
  if (!row || row.expiresAt <= Date.now()) {
    if (row) sqlite.prepare('DELETE FROM sessions WHERE id = ?').run(row.sessionId);
    clearSessionCookie(cookies);
    return null;
  }
  return { sessionId: row.sessionId, user: { id: row.id, username: row.username } };
}

export function destroySession(sessionId: number | null, cookies: Cookies): void {
  if (sessionId) sqlite.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
  clearSessionCookie(cookies);
}

export function clearSessionCookie(cookies: Cookies): void {
  cookies.delete(COOKIE_NAME, { path: '/' });
}

export function cleanupExpiredSessions(): void {
  sqlite.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(Date.now());
}
