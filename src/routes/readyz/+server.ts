/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

import { sqlite } from '$lib/server/db';

export const GET = () => {
  try {
    sqlite.prepare('SELECT 1').get();
    return new Response(JSON.stringify({ status: 'ready', database: 'ok' }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  } catch {
    return new Response(JSON.stringify({ status: 'unavailable', database: 'error' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  }
};
