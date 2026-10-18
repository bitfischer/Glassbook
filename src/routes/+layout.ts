/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

import { browser } from '$app/environment';
import { connection, markOffline, markOnline } from '$lib/offline/connection.svelte';
import { readMirror } from '$lib/offline/store';

export const load = async ({ fetch }) => {
  if (!browser || !connection.offline) {
    try {
      const response = await fetch(
        '/api/session',
        browser ? { signal: AbortSignal.timeout(6000) } : {}
      );
      if (response.ok) {
        if (browser) markOnline();
        return { user: ((await response.json()) as { user: App.Locals['user'] }).user };
      }
      // A rejected session is for the page's own load to turn into a redirect to /login.
      if (response.status === 401) return { user: null };
    } catch {
      if (!browser) throw new Error('Session lookup failed');
      markOffline();
    }
  }
  return { user: (await readMirror())?.snapshot.user ?? null };
};
