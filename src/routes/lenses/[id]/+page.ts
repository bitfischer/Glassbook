/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

import { error } from '@sveltejs/kit';
import { loadWithMirror } from '$lib/offline/source';

export const load = ({ fetch, url, params }) => {
  const id = Number(params.id);
  if (!Number.isSafeInteger(id) || id < 1) throw error(404, 'Lens not found');
  return loadWithMirror(fetch, url, `/api/lenses/${id}`, (snapshot) => {
    const lens = snapshot.lenses.find((candidate) => candidate.id === id);
    if (!lens) throw error(404, 'Lens not found');
    return {
      lens,
      photos: snapshot.photos.filter((photo) => photo.lensId === id),
      entries: snapshot.entries.filter((entry) => entry.lensId === id)
    };
  });
};
