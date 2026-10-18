/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

import { apiJson } from '$lib/server/api';
import { getDailyChallenge, ownedChallengeLenses } from '$lib/server/challenges';

export const GET = () =>
  apiJson({ dailyChallenge: getDailyChallenge(), lenses: ownedChallengeLenses() });
