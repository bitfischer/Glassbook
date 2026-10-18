/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

import { buildFacets, filterLenses, summarize } from '$lib/offline/catalogue';
import { loadWithMirror } from '$lib/offline/source';

export const load = async ({ fetch, url }) => {
  const data = await loadWithMirror(fetch, url, `/api/lenses${url.search}`, (snapshot) => ({
    lenses: filterLenses(snapshot.lenses, url.searchParams),
    summary: summarize(snapshot.lenses),
    facets: buildFacets(snapshot.manufacturers, snapshot.mounts, snapshot.lenses)
  }));
  return { ...data, query: Object.fromEntries(url.searchParams) };
};
