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
import { catalogueFacets, listLenses } from '$lib/server/lenses';
import type { CollectionSummary } from '$lib/catalogue-types';

export const GET = ({ url }) => {
  const lenses = listLenses(url.searchParams);
  const summary = sqlite
    .prepare(
      `SELECT COUNT(*) AS total,
        SUM(CASE WHEN ownership = 'owned' THEN 1 ELSE 0 END) AS owned,
        COUNT(DISTINCT manufacturer_id) AS manufacturers,
        COALESCE(SUM(CASE WHEN ownership = 'owned' THEN purchase_price_minor ELSE 0 END), 0) AS valueMinor
       FROM lenses`
    )
    .get() as CollectionSummary;
  return apiJson({ lenses, summary, facets: catalogueFacets() });
};
