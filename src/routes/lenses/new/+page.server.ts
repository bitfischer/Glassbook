/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { config } from '$lib/server/config';
import { catalogueFacets, createLens, parseLensForm } from '$lib/server/lenses';

export const load = () => ({ ...catalogueFacets(), defaultCurrency: config.defaultCurrency });

export const actions = {
  default: async ({ request }) => {
    const data = await request.formData();
    const result = parseLensForm(data);
    if (!result.success) {
      return fail(400, {
        values: Object.fromEntries(data),
        errors: result.error.flatten().fieldErrors
      });
    }
    const id = createLens(result.data);
    throw redirect(303, `/lenses/${id}`);
  }
} satisfies Actions;
