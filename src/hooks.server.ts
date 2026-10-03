/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

import { redirect, type Handle } from '@sveltejs/kit';
import { isInitialized } from '$lib/server/db';
import { cleanupExpiredSessions, readSession } from '$lib/server/auth';
import { isAuthenticationEnabled } from '$lib/server/auth-settings';

let lastCleanup = 0;

export const handle: Handle = async ({ event, resolve }) => {
  if (Date.now() - lastCleanup > 3_600_000) {
    cleanupExpiredSessions();
    lastCleanup = Date.now();
  }

  const initialized = isInitialized();
  const authenticationEnabled = isAuthenticationEnabled();
  const session = authenticationEnabled && initialized ? readSession(event.cookies) : null;
  event.locals.user = authenticationEnabled
    ? (session?.user ?? null)
    : { id: 0, username: 'Local user' };
  event.locals.sessionId = session?.sessionId ?? null;

  const path = event.url.pathname;
  const publicPath =
    path === '/setup' || path === '/login' || path === '/healthz' || path === '/readyz';

  if (!authenticationEnabled && (path === '/login' || path === '/setup')) throw redirect(303, '/');
  if (
    authenticationEnabled &&
    !initialized &&
    path !== '/setup' &&
    path !== '/healthz' &&
    path !== '/readyz'
  ) {
    throw redirect(303, '/setup');
  }
  if (authenticationEnabled && initialized && path === '/setup')
    throw redirect(303, session ? '/' : '/login');
  if (authenticationEnabled && !publicPath && !session) {
    const returnTo = encodeURIComponent(path + event.url.search);
    throw redirect(303, '/login?returnTo=' + returnTo);
  }
  if (authenticationEnabled && path === '/login' && session) throw redirect(303, '/');

  const response = await resolve(event);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'same-origin');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return response;
};
