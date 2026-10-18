/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

import { redirect } from '@sveltejs/kit';

// A client-only entry point: the service worker serves this page's HTML for any app URL while the
// server is unreachable, and the client router then renders the URL actually requested.
export const ssr = false;

export const load = () => {
  throw redirect(307, '/');
};
