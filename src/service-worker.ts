/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';

const worker = self as unknown as ServiceWorkerGlobalScope;
const cacheName = `glassbook-${version}`;
// Photos are mirrored by the page's sync (see $lib/offline/sync.ts); this worker only serves them.
const imageCacheName = 'glassbook-images';
const cachedAssets = new Set([...build, ...files]);
const shellPath = '/shell';
const navigationTimeout = 6_000;
// Pages the client router can render on its own. Anything else (downloads, sign-in) needs the server.
const appRoute = /^\/(lenses(\/(new|\d+(\/edit)?))?|challenge|settings)?\/?$/;

worker.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(cacheName)
      .then((cache) => cache.addAll([...cachedAssets, shellPath]))
      .then(() => worker.skipWaiting())
  );
});

worker.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== cacheName && key !== imageCacheName)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => worker.clients.claim())
  );
});

// A server on a home network can be unreachable without the device knowing it is offline, so a
// slow navigation falls back to the offline app just like a failed one.
async function fetchNavigation(request: Request): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), navigationTimeout);
  try {
    return await fetch(request, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function offlineNavigation(url: URL): Promise<Response> {
  const shell = appRoute.test(url.pathname) ? await caches.match(shellPath) : undefined;
  if (shell) {
    // The marker tells the client it was started without the server, so it skips the network.
    const html = (await shell.text()).replace(
      '<head>',
      '<head><meta name="glassbook-offline" content="1">'
    );
    const headers = new Headers(shell.headers);
    headers.delete('content-length');
    headers.delete('content-encoding');
    return new Response(html, { headers });
  }
  return (await caches.match('/offline.html')) ?? Response.error();
}

worker.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== worker.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetchNavigation(request).catch(() => offlineNavigation(url)));
    return;
  }

  if (cachedAssets.has(url.pathname)) {
    event.respondWith(caches.match(url.pathname).then((cached) => cached ?? fetch(request)));
    return;
  }

  if (url.pathname.startsWith('/images/')) {
    event.respondWith(
      caches
        .match(request, { cacheName: imageCacheName })
        .then((cached) => cached ?? fetch(request))
    );
  }
});
