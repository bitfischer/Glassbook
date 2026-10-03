/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { catalogueFacets, getLens, parseLensForm, updateLens } from '$lib/server/lenses';

const idFrom = (value: string) => {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) throw error(404, 'Lens not found');
  return id;
};

export const load = ({ params }) => {
  const lens = getLens(idFrom(params.id));
  if (!lens) throw error(404, 'Lens not found');
  return { lens, ...catalogueFacets() };
};

export const actions = {
  default: async ({ params, request }) => {
    const id = idFrom(params.id);
    if (!getLens(id)) throw error(404, 'Lens not found');
    const data = await request.formData();
    const result = parseLensForm(data);
    if (!result.success) {
      return fail(400, {
        values: Object.fromEntries(data),
        errors: result.error.flatten().fieldErrors
      });
    }
    updateLens(id, result.data);
    throw redirect(303, `/lenses/${id}`);
  }
} satisfies Actions;
