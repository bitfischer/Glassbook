/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

import { error } from '@sveltejs/kit';
import { apiJson } from '$lib/server/api';
import { sqlite } from '$lib/server/db';
import { listLensEntries } from '$lib/server/lens-entries';
import { getLens } from '$lib/server/lenses';
import type { LensPhotoView } from '$lib/catalogue-types';

export const GET = ({ params }) => {
  const id = Number(params.id);
  if (!Number.isSafeInteger(id) || id < 1) throw error(404, 'Lens not found');
  const lens = getLens(id);
  if (!lens) throw error(404, 'Lens not found');
  const photos = sqlite
    .prepare(
      `SELECT id, lens_id AS lensId, original_name AS originalName, width, height, position,
        is_cover AS isCover FROM lens_photos WHERE lens_id = ? ORDER BY position, id`
    )
    .all(id) as LensPhotoView[];
  return apiJson({ lens, photos, entries: listLensEntries(id) });
};
