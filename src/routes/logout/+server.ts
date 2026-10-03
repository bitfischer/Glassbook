/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

import { redirect } from '@sveltejs/kit';
import { destroySession } from '$lib/server/auth';

export const POST = ({ locals, cookies }) => {
  destroySession(locals.sessionId, cookies);
  throw redirect(303, '/');
};
