/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

import { buildSnapshot, snapshotEtag } from '$lib/server/sync';

// The complete offline mirror. Clients revalidate with If-None-Match and only download on change.
export const GET = ({ request, locals }) => {
  const body = JSON.stringify(buildSnapshot(locals.user));
  const etag = snapshotEtag(body);
  const headers = { ETag: etag, 'Cache-Control': 'private, no-cache' };
  if (request.headers.get('if-none-match') === etag)
    return new Response(null, { status: 304, headers });
  return new Response(body, { headers: { ...headers, 'Content-Type': 'application/json' } });
};
