/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

import { challengeCatalogue } from '$lib/challenges';
import { ownedChallengeLenses } from '$lib/offline/catalogue';
import { loadWithMirror } from '$lib/offline/source';

export const load = async ({ fetch, url }) => {
  const data = await loadWithMirror(fetch, url, '/api/challenge', (snapshot) => ({
    dailyChallenge: snapshot.dailyChallenge!.challenge,
    lenses: ownedChallengeLenses(snapshot.lenses)
  }));
  return { ...data, catalogue: challengeCatalogue };
};
