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
import { imagePaths, type Snapshot } from '$lib/offline/snapshot';
import { clearMirror, readMirror, writeMirror } from '$lib/offline/store';

const IMAGE_CACHE = 'glassbook-images';
const REQUEST_TIMEOUT = 15_000;
const IMAGE_CONCURRENCY = 4;

export type SyncResult = 'updated' | 'unchanged' | 'unauthorized' | 'offline';

let running: Promise<SyncResult> | undefined;
let lastAttempt = 0;

async function mirrorImages(snapshot: Snapshot) {
  if (!('caches' in globalThis)) return;
  const cache = await caches.open(IMAGE_CACHE);
  const wanted = new Set(snapshot.photos.flatMap((photo) => imagePaths(photo.id)));

  for (const request of await cache.keys()) {
    const { pathname } = new URL(request.url);
    if (!wanted.has(pathname)) await cache.delete(request);
  }
  const have = new Set((await cache.keys()).map((request) => new URL(request.url).pathname));
  const missing = [...wanted].filter((path) => !have.has(path));

  async function worker() {
    for (let path = missing.pop(); path; path = missing.pop()) {
      try {
        const response = await fetch(path, { signal: AbortSignal.timeout(REQUEST_TIMEOUT) });
        if (response.ok) await cache.put(path, response);
      } catch {
        // The next sync retries whatever is still missing.
      }
    }
  }
  await Promise.all(Array.from({ length: IMAGE_CONCURRENCY }, worker));
}

async function run(): Promise<SyncResult> {
  const stored = await readMirror();
  let response: Response;
  try {
    response = await fetch('/api/sync', {
      headers: stored ? { 'If-None-Match': stored.etag } : {},
      signal: AbortSignal.timeout(REQUEST_TIMEOUT)
    });
  } catch {
    markOffline();
    return 'offline';
  }
  markOnline();
  if (response.status === 401) return 'unauthorized';
  if (!response.ok && response.status !== 304) return 'offline';

  let snapshot = stored?.snapshot;
  let etag = stored?.etag ?? '';
  let result: SyncResult = 'unchanged';
  if (response.status !== 304) {
    snapshot = (await response.json()) as Snapshot;
    etag = response.headers.get('ETag') ?? '';
    result = 'updated';
  }
  if (!snapshot) return 'offline';

  // Images first, so the record never claims photos that are not on the device yet.
  await mirrorImages(snapshot);
  const syncedAt = Date.now();
  if (result === 'updated' || !stored) await writeMirror({ etag, syncedAt, snapshot });
  else await writeMirror({ ...stored, syncedAt });
  connection.syncedAt = syncedAt;
  void navigator.storage?.persist?.();
  return result;
}

export function syncMirror(): Promise<SyncResult> {
  if (!browser) return Promise.resolve('offline');
  lastAttempt = Date.now();
  running ??= (async () => {
    connection.syncing = true;
    try {
      return await run();
    } catch {
      return 'offline' as const;
    } finally {
      connection.syncing = false;
      running = undefined;
    }
  })();
  return running;
}

// For frequent triggers such as navigation: skips the request when one ran recently.
export function syncMirrorSoon(minimumInterval = 30_000): Promise<SyncResult> | undefined {
  if (connection.offline || Date.now() - lastAttempt < minimumInterval) return undefined;
  return syncMirror();
}

export async function loadSyncedAt() {
  connection.syncedAt = (await readMirror())?.syncedAt ?? null;
}

// Offline, probe the server until it answers again.
export async function probeServer(): Promise<boolean> {
  try {
    const response = await fetch('/healthz', {
      cache: 'no-store',
      signal: AbortSignal.timeout(5_000)
    });
    return response.ok;
  } catch {
    return false;
  }
}

// The mirror is a private copy of the catalogue: signing out must not leave it on the device.
export async function clearOfflineData() {
  await clearMirror();
  connection.syncedAt = null;
  if ('caches' in globalThis) await caches.delete(IMAGE_CACHE);
}
