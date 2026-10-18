/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

import { browser } from '$app/environment';
import { error, isHttpError, isRedirect, redirect } from '@sveltejs/kit';
import { connection, markOffline, markOnline } from '$lib/offline/connection.svelte';
import type { Snapshot } from '$lib/offline/snapshot';
import { readMirror } from '$lib/offline/store';

const REQUEST_TIMEOUT = 6_000;

async function mirrorSnapshot(): Promise<Snapshot> {
  const mirror = await readMirror();
  if (!mirror) {
    throw error(
      503,
      'The server is unreachable and this device has no offline copy yet. Open Glassbook once while connected.'
    );
  }
  return mirror.snapshot;
}

/**
 * Reads page data from the server's JSON API and falls back to the offline mirror when the server
 * cannot be reached. Server and browser run the same load, so first render stays server-rendered.
 */
export async function loadWithMirror<T extends object>(
  fetch: typeof globalThis.fetch,
  url: URL,
  endpoint: string,
  fromMirror: (snapshot: Snapshot) => T
): Promise<T & { offline: boolean }> {
  if (browser && connection.offline) {
    return { ...fromMirror(await mirrorSnapshot()), offline: true };
  }
  try {
    const response = await fetch(
      endpoint,
      browser ? { signal: AbortSignal.timeout(REQUEST_TIMEOUT) } : {}
    );
    if (response.status === 401) {
      throw redirect(303, `/login?returnTo=${encodeURIComponent(url.pathname + url.search)}`);
    }
    if (!response.ok) {
      const message = await response
        .json()
        .then((body: { message?: string }) => body.message)
        .catch(() => undefined);
      throw error(response.status, message ?? 'Request failed');
    }
    if (browser) markOnline();
    return { ...((await response.json()) as T), offline: false };
  } catch (cause) {
    if (!browser || isHttpError(cause) || isRedirect(cause)) throw cause;
    markOffline();
    return { ...fromMirror(await mirrorSnapshot()), offline: true };
  }
}
