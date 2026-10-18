/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

import { browser } from '$app/environment';

// The server can be unreachable while the device still reports a network (away from the home LAN),
// so this tracks real request outcomes rather than `navigator.onLine`.
export const connection = $state({
  // The service worker marks the pages it serves without the server.
  offline: browser && document.querySelector('meta[name="glassbook-offline"]') !== null,
  syncing: false,
  syncedAt: null as number | null
});

function reflect() {
  if (browser) document.documentElement.toggleAttribute('data-offline', connection.offline);
}

export function markOffline() {
  if (connection.offline) return;
  connection.offline = true;
  reflect();
}

export function markOnline() {
  if (!connection.offline) return;
  connection.offline = false;
  reflect();
}

if (browser) document.documentElement.toggleAttribute('data-offline', connection.offline);
