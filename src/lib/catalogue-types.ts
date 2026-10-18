/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

export type LensView = {
  id: number;
  manufacturerId: number;
  manufacturer: string;
  mountId: number | null;
  mount: string | null;
  model: string;
  serialNumber: string | null;
  focalType: 'prime' | 'zoom';
  focalMinMm: number | null;
  focalMaxMm: number | null;
  apertureMin: string | null;
  apertureMax: string | null;
  lengthMm: number | null;
  diameterMm: number | null;
  weightGrams: number | null;
  filterThreadMm: number | null;
  elements: number | null;
  groups: number | null;
  releaseYear: number | null;
  purchaseDate: string | null;
  purchasePriceMinor: number | null;
  currency: string;
  condition: string;
  ownership: string;
  notes: string | null;
  createdAt: number;
  updatedAt: number;
  coverId: number | null;
  photoIds: number[];
};

export type LensEntryView = {
  id: number;
  lensId: number;
  type: 'note' | 'memory';
  eventDate: string | null;
  body: string;
  createdAt: number;
  updatedAt: number;
  photoIds: number[];
};

export type LensPhotoView = {
  id: number;
  lensId: number;
  originalName: string;
  width: number;
  height: number;
  position: number;
  isCover: number;
};

export type CollectionSummary = {
  total: number;
  owned: number;
  manufacturers: number;
  valueMinor: number;
};

export type Facets = {
  manufacturers: { name: string }[];
  mounts: { name: string }[];
  years: { year: number }[];
};
