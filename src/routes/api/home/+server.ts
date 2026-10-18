/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

import { apiJson } from '$lib/server/api';
import { sqlite } from '$lib/server/db';
import { listLensEntries } from '$lib/server/lens-entries';
import { getLensOfTheDay } from '$lib/server/lenses';
import { pickStory } from '$lib/offline/catalogue';
import type { CollectionSummary } from '$lib/catalogue-types';

export const GET = () => {
  const summary = sqlite
    .prepare(
      "SELECT COUNT(*) AS total, SUM(CASE WHEN ownership = 'owned' THEN 1 ELSE 0 END) AS owned, COUNT(DISTINCT manufacturer_id) AS manufacturers, COALESCE(SUM(CASE WHEN ownership = 'owned' THEN purchase_price_minor ELSE 0 END), 0) AS valueMinor FROM lenses"
    )
    .get() as CollectionSummary;

  const lensOfTheDay = getLensOfTheDay() ?? null;
  const story = lensOfTheDay ? pickStory(lensOfTheDay, listLensEntries(lensOfTheDay.id)) : null;
  return apiJson({ lensOfTheDay, story, summary });
};
