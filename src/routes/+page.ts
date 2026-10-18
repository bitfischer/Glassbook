/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

import { loadWithMirror } from '$lib/offline/source';
import { pickStory, summarize } from '$lib/offline/catalogue';

export const load = ({ fetch, url }) =>
  loadWithMirror(fetch, url, '/api/home', (snapshot) => {
    const daily = snapshot.dailyLens;
    const lensOfTheDay = snapshot.lenses.find((lens) => lens.id === daily?.lensId) ?? null;
    const entries = snapshot.entries.filter((entry) => entry.lensId === lensOfTheDay?.id);
    return {
      lensOfTheDay,
      story: lensOfTheDay ? pickStory(lensOfTheDay, entries) : null,
      summary: summarize(snapshot.lenses)
    };
  });
