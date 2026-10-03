/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

import { z } from 'zod';

const optionalInt = z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? undefined : Number(value)),
  z.number().int().nonnegative().optional()
);

const optionalFocalLength = z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? undefined : Number(value)),
  z.number().positive('Focal length must be greater than zero').optional()
);

export const conditions = ['mint', 'excellent', 'good', 'fair', 'poor'] as const;
export const ownerships = ['owned', 'sold', 'wishlist', 'borrowed'] as const;
export const focalTypes = ['prime', 'zoom'] as const;
export const lensEntryTypes = ['note', 'memory'] as const;

const optionalEntryDate = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined)
  .refine(
    (value) =>
      value === undefined ||
      (/^\d{4}-\d{2}-\d{2}$/.test(value) &&
        new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value),
    'Enter a valid date'
  );

export const lensEntrySchema = z
  .object({
    type: z.enum(lensEntryTypes),
    eventDate: optionalEntryDate,
    body: z.string().trim().min(1, 'Entry text is required').max(20_000)
  })
  .superRefine((data, context) => {
    if (data.type === 'note' && data.eventDate !== undefined) {
      context.addIssue({
        code: 'custom',
        message: 'Lens notes cannot have a date',
        path: ['eventDate']
      });
    }
  });

export const lensSchema = z
  .object({
    manufacturer: z.string().trim().min(1, 'Manufacturer is required').max(100),
    mount: z
      .string()
      .trim()
      .max(100)
      .optional()
      .transform((v) => v || undefined),
    model: z.string().trim().min(1, 'Model is required').max(160),
    serialNumber: z
      .string()
      .trim()
      .max(100)
      .optional()
      .transform((v) => v || undefined),
    focalType: z.enum(focalTypes).optional(),
    focalMinMm: optionalFocalLength,
    focalMaxMm: optionalFocalLength,
    apertureMin: z
      .string()
      .trim()
      .max(20)
      .optional()
      .transform((v) => v || undefined),
    apertureMax: z
      .string()
      .trim()
      .max(20)
      .optional()
      .transform((v) => v || undefined),
    lengthMm: optionalInt,
    diameterMm: optionalInt,
    weightGrams: optionalInt,
    filterThreadMm: optionalInt,
    elements: optionalInt,
    groups: optionalInt,
    releaseYear: z.preprocess(
      (v) => (v === '' || v === undefined ? undefined : Number(v)),
      z
        .number()
        .int()
        .min(1800)
        .max(new Date().getFullYear() + 2)
        .optional()
    ),
    purchaseDate: z
      .string()
      .optional()
      .transform((v) => v || undefined),
    purchasePrice: z.preprocess(
      (v) => (v === '' || v === undefined ? undefined : Number(v)),
      z.number().nonnegative().max(100_000_000).optional()
    ),
    currency: z
      .string()
      .trim()
      .length(3)
      .transform((v) => v.toUpperCase()),
    condition: z.enum(conditions),
    ownership: z.enum(ownerships)
  })
  .superRefine((data, context) => {
    if (data.focalMinMm === undefined) {
      context.addIssue({
        code: 'custom',
        message: 'Focal length is required',
        path: ['focalMinMm']
      });
    }

    const focalType =
      data.focalType ??
      (data.focalMaxMm !== undefined && data.focalMaxMm !== data.focalMinMm ? 'zoom' : 'prime');

    if (focalType === 'zoom') {
      if (data.focalMaxMm === undefined) {
        context.addIssue({
          code: 'custom',
          message: 'Maximum focal length is required for a zoom lens',
          path: ['focalMaxMm']
        });
      } else if (data.focalMinMm !== undefined && data.focalMaxMm <= data.focalMinMm) {
        context.addIssue({
          code: 'custom',
          message: 'Maximum focal length must be greater than the minimum',
          path: ['focalMaxMm']
        });
      }
    }
  })
  .transform((data) => {
    const focalType =
      data.focalType ??
      (data.focalMaxMm !== undefined && data.focalMaxMm !== data.focalMinMm ? 'zoom' : 'prime');

    return {
      ...data,
      focalType,
      focalMaxMm: focalType === 'prime' ? data.focalMinMm : data.focalMaxMm
    };
  });

export type LensInput = z.infer<typeof lensSchema>;
export type LensEntryInput = z.infer<typeof lensEntrySchema>;

export function priceToMinor(value: number | undefined): number | null {
  return value === undefined ? null : Math.round(value * 100);
}

export function priceFromMinor(value: number | null): string {
  return value === null ? '' : (value / 100).toFixed(2);
}

export function formObject(data: FormData): Record<string, FormDataEntryValue> {
  return Object.fromEntries(data.entries());
}
