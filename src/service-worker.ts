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
const cachedAssets = new Set([...build, ...files]);

worker.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(cacheName)
      .then((cache) => cache.addAll(cachedAssets))
      .then(() => worker.skipWaiting())
  );
});

worker.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== cacheName).map((key) => caches.delete(key)))
      )
      .then(() => worker.clients.claim())
  );
});

worker.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== worker.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const fallback = await caches.match('/offline.html');
        return fallback ?? Response.error();
      })
    );
    return;
  }

  if (cachedAssets.has(url.pathname)) {
    event.respondWith(caches.match(url.pathname).then((cached) => cached ?? fetch(request)));
  }
});
