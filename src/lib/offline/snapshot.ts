/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

import type { LensEntryView, LensPhotoView, LensView } from '$lib/catalogue-types';
import type { PhotographyChallenge } from '$lib/challenges';

// Bump when the shape changes; an older mirror is then discarded and fetched again.
export const SNAPSHOT_FORMAT = 1;

// Everything a signed-in user can read, as one document. Credentials, sessions and the server's
// rotation bookkeeping are deliberately not part of it.
export type Snapshot = {
  format: typeof SNAPSHOT_FORMAT;
  user: { id: number; username: string } | null;
  manufacturers: string[];
  mounts: string[];
  lenses: LensView[];
  photos: LensPhotoView[];
  entries: LensEntryView[];
  dailyLens: { day: string; lensId: number } | null;
  dailyChallenge: { day: string; challenge: PhotographyChallenge } | null;
};

export function imagePaths(photoId: number): string[] {
  return [`/images/${photoId}/gallery`, `/images/${photoId}/thumbnail`];
}
