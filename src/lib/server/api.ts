/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

import { json } from '@sveltejs/kit';

// API responses are read by the offline-aware loads and must never come from the HTTP cache.
export function apiJson(body: unknown, init?: ResponseInit) {
  return json(body, {
    ...init,
    headers: { 'Cache-Control': 'private, no-store', ...init?.headers }
  });
}
