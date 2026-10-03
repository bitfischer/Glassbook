/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

export const GET = () =>
  new Response(JSON.stringify({ status: 'ok' }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
