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
import { sqlite } from '$lib/server/db';
import { addPhoto, deletePhoto } from '$lib/server/images';
import { createLens, getLens } from '$lib/server/lenses';
import {
  attachLensEntryPhoto,
  createLensEntry,
  deleteLensEntry,
  detachLensEntryPhoto,
  listLensEntries,
  parseLensEntryForm,
  updateLensEntry
} from '$lib/server/lens-entries';

function lensId(value: string): number {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) throw error(404, 'Lens not found');
  return id;
}

function entryValues(formData: FormData) {
  return {
    type: formData.get('type'),
    eventDate: formData.get('eventDate'),
    body: formData.get('body')
  };
}

function imageFiles(formData: FormData): File[] {
  return formData
    .getAll('images')
    .filter((value): value is File => value instanceof File && value.size > 0);
}

function entryId(value: FormDataEntryValue | null): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export const load = ({ params }) => {
  const id = lensId(params.id);
  const lens = getLens(id);
  if (!lens) throw error(404, 'Lens not found');
  const photos = sqlite
    .prepare(
      `SELECT id, original_name AS originalName, width, height, position,
        is_cover AS isCover FROM lens_photos WHERE lens_id = ? ORDER BY position, id`
    )
    .all(id) as {
    id: number;
    originalName: string;
    width: number;
    height: number;
    position: number;
    isCover: number;
  }[];
  return { lens, photos, entries: listLensEntries(id) };
};

export const actions = {
  upload: async ({ params, request }) => {
    const id = lensId(params.id);
    if (!getLens(id)) throw error(404, 'Lens not found');
    const file = (await request.formData()).get('photo');
    if (!(file instanceof File)) return fail(400, { uploadError: 'Choose an image to upload.' });
    try {
      await addPhoto(id, file);
      return { uploaded: true };
    } catch (cause) {
      return fail(400, {
        uploadError: cause instanceof Error ? cause.message : 'The image could not be processed.'
      });
    }
  },
  cover: async ({ params, request }) => {
    const id = lensId(params.id);
    const photoId = Number((await request.formData()).get('photoId'));
    const ownsPhoto = sqlite
      .prepare('SELECT 1 FROM lens_photos WHERE id = ? AND lens_id = ?')
      .get(photoId, id);
    if (!ownsPhoto) return fail(404, { message: 'Photo not found.' });
    sqlite.transaction(() => {
      sqlite.prepare('UPDATE lens_photos SET is_cover = 0 WHERE lens_id = ?').run(id);
      sqlite.prepare('UPDATE lens_photos SET is_cover = 1 WHERE id = ?').run(photoId);
    })();
    return { coverUpdated: true };
  },
  movePhoto: async ({ params, request }) => {
    const id = lensId(params.id);
    const data = await request.formData();
    const photoId = Number(data.get('photoId'));
    const direction = data.get('direction') === 'up' ? -1 : 1;
    const photos = sqlite
      .prepare('SELECT id FROM lens_photos WHERE lens_id = ? ORDER BY position, id')
      .all(id) as { id: number }[];
    const index = photos.findIndex((photo) => photo.id === photoId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= photos.length) return { moved: false };
    sqlite.transaction(() => {
      sqlite
        .prepare('UPDATE lens_photos SET position = ? WHERE id = ?')
        .run(target, photos[index].id);
      sqlite
        .prepare('UPDATE lens_photos SET position = ? WHERE id = ?')
        .run(index, photos[target].id);
    })();
    return { moved: true };
  },
  deletePhoto: async ({ params, request }) => {
    const id = lensId(params.id);
    const photoId = Number((await request.formData()).get('photoId'));
    await deletePhoto(photoId, id);
    return { photoDeleted: true };
  },
  duplicate: ({ params }) => {
    const lens = getLens(lensId(params.id));
    if (!lens) throw error(404, 'Lens not found');
    const id = createLens({
      manufacturer: lens.manufacturer,
      mount: lens.mount ?? undefined,
      model: `${lens.model} (copy)`,
      serialNumber: undefined,
      focalType: lens.focalMaxMm !== null && lens.focalMaxMm !== lens.focalMinMm ? 'zoom' : 'prime',
      focalMinMm: lens.focalMinMm ?? undefined,
      focalMaxMm: lens.focalMaxMm ?? undefined,
      apertureMin: lens.apertureMin ?? undefined,
      apertureMax: lens.apertureMax ?? undefined,
      lengthMm: lens.lengthMm ?? undefined,
      diameterMm: lens.diameterMm ?? undefined,
      weightGrams: lens.weightGrams ?? undefined,
      filterThreadMm: lens.filterThreadMm ?? undefined,
      elements: lens.elements ?? undefined,
      groups: lens.groups ?? undefined,
      releaseYear: lens.releaseYear ?? undefined,
      purchaseDate: undefined,
      purchasePrice: undefined,
      currency: lens.currency,
      condition: lens.condition as 'mint' | 'excellent' | 'good' | 'fair' | 'poor',
      ownership: lens.ownership as 'owned' | 'sold' | 'wishlist' | 'borrowed'
    });
    throw redirect(303, `/lenses/${id}/edit`);
  },
  createEntry: async ({ params, request }) => {
    const id = lensId(params.id);
    if (!getLens(id)) throw error(404, 'Lens not found');
    const formData = await request.formData();
    const parsed = parseLensEntryForm(formData);
    if (!parsed.success) {
      return fail(400, {
        entryAction: 'create',
        entryValues: entryValues(formData),
        entryErrors: parsed.error.flatten().fieldErrors
      });
    }
    const photoIds: number[] = [];
    if (parsed.data.type === 'memory') {
      try {
        for (const file of imageFiles(formData)) photoIds.push(await addPhoto(id, file));
      } catch (cause) {
        return fail(400, {
          entryAction: 'create',
          entryValues: entryValues(formData),
          entryMessage:
            cause instanceof Error ? cause.message : 'The memory image could not be processed.'
        });
      }
    }
    const createdEntryId = createLensEntry(id, parsed.data);
    for (const photoId of photoIds) attachLensEntryPhoto(id, createdEntryId, photoId);
    return { entryCreated: true };
  },
  updateEntry: async ({ params, request }) => {
    const id = lensId(params.id);
    if (!getLens(id)) throw error(404, 'Lens not found');
    const formData = await request.formData();
    const target = entryId(formData.get('entryId'));
    if (!target) return fail(400, { entryAction: 'update', entryMessage: 'Invalid entry.' });
    const parsed = parseLensEntryForm(formData);
    if (!parsed.success) {
      return fail(400, {
        entryAction: 'update',
        entryId: target,
        entryValues: entryValues(formData),
        entryErrors: parsed.error.flatten().fieldErrors
      });
    }
    if (!updateLensEntry(id, target, parsed.data)) {
      return fail(404, { entryAction: 'update', entryMessage: 'Entry not found.' });
    }
    return { entryUpdated: true };
  },
  attachEntryImages: async ({ params, request }) => {
    const id = lensId(params.id);
    if (!getLens(id)) throw error(404, 'Lens not found');
    const formData = await request.formData();
    const target = entryId(formData.get('entryId'));
    const ownsMemory = target
      ? sqlite
          .prepare("SELECT 1 FROM lens_entries WHERE id = ? AND lens_id = ? AND type = 'memory'")
          .get(target, id)
      : undefined;
    if (!target || !ownsMemory) {
      return fail(404, { entryAction: 'images', entryMessage: 'Memory not found.' });
    }
    const files = imageFiles(formData);
    if (!files.length) {
      return fail(400, {
        entryAction: 'images',
        entryId: target,
        entryMessage: 'Choose at least one image.'
      });
    }
    try {
      for (const file of files) {
        const photoId = await addPhoto(id, file);
        attachLensEntryPhoto(id, target, photoId);
      }
      return { entryImagesAttached: true };
    } catch (cause) {
      return fail(400, {
        entryAction: 'images',
        entryId: target,
        entryMessage:
          cause instanceof Error ? cause.message : 'The memory image could not be processed.'
      });
    }
  },
  detachEntryImage: async ({ params, request }) => {
    const id = lensId(params.id);
    if (!getLens(id)) throw error(404, 'Lens not found');
    const formData = await request.formData();
    const target = entryId(formData.get('entryId'));
    const photoId = entryId(formData.get('photoId'));
    if (!target || !photoId || !detachLensEntryPhoto(id, target, photoId)) {
      return fail(404, { entryAction: 'images', entryMessage: 'Memory image not found.' });
    }
    return { entryImageDetached: true };
  },
  deleteEntry: async ({ params, request }) => {
    const id = lensId(params.id);
    if (!getLens(id)) throw error(404, 'Lens not found');
    const target = entryId((await request.formData()).get('entryId'));
    if (!target || !deleteLensEntry(id, target)) {
      return fail(404, { entryAction: 'delete', entryMessage: 'Entry not found.' });
    }
    return { entryDeleted: true };
  },
  delete: async ({ params }) => {
    const id = lensId(params.id);
    const photos = sqlite.prepare('SELECT id FROM lens_photos WHERE lens_id = ?').all(id) as {
      id: number;
    }[];
    for (const photo of photos) await deletePhoto(photo.id, id);
    sqlite.prepare('DELETE FROM lenses WHERE id = ?').run(id);
    throw redirect(303, '/lenses');
  }
} satisfies Actions;
