/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

import { apiJson } from '$lib/server/api';

export const GET = ({ locals }) => apiJson({ user: locals.user });
