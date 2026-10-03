/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

import { relations, sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex
} from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull()
});

export const appSettings = sqliteTable('app_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull()
});

export const sessions = sqliteTable(
  'sessions',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull()
  },
  (table) => [
    uniqueIndex('sessions_token_hash_idx').on(table.tokenHash),
    index('sessions_expiry_idx').on(table.expiresAt)
  ]
);

export const manufacturers = sqliteTable('manufacturers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique()
});

export const mounts = sqliteTable('mounts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique()
});

export const lenses = sqliteTable(
  'lenses',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    manufacturerId: integer('manufacturer_id')
      .notNull()
      .references(() => manufacturers.id, { onDelete: 'restrict' }),
    mountId: integer('mount_id').references(() => mounts.id, { onDelete: 'restrict' }),
    model: text('model').notNull(),
    serialNumber: text('serial_number'),
    focalMinMm: real('focal_min_mm'),
    focalMaxMm: real('focal_max_mm'),
    apertureMin: text('aperture_min'),
    apertureMax: text('aperture_max'),
    lengthMm: integer('length_mm'),
    diameterMm: integer('diameter_mm'),
    weightGrams: integer('weight_grams'),
    filterThreadMm: integer('filter_thread_mm'),
    elements: integer('elements'),
    groups: integer('groups'),
    releaseYear: integer('release_year'),
    purchaseDate: text('purchase_date'),
    purchasePriceMinor: integer('purchase_price_minor'),
    currency: text('currency').notNull().default('EUR'),
    condition: text('condition', {
      enum: ['mint', 'excellent', 'good', 'fair', 'poor']
    })
      .notNull()
      .default('good'),
    ownership: text('ownership', {
      enum: ['owned', 'sold', 'wishlist', 'borrowed']
    })
      .notNull()
      .default('owned'),
    notes: text('notes'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull()
  },
  (table) => [
    index('lenses_manufacturer_idx').on(table.manufacturerId),
    index('lenses_mount_idx').on(table.mountId),
    index('lenses_model_idx').on(table.model),
    index('lenses_condition_idx').on(table.condition),
    index('lenses_ownership_idx').on(table.ownership),
    index('lenses_release_year_idx').on(table.releaseYear),
    check(
      'lenses_focal_range_check',
      sql`${table.focalMaxMm} is null or ${table.focalMinMm} is null or ${table.focalMaxMm} >= ${table.focalMinMm}`
    ),
    check(
      'lenses_release_year_check',
      sql`${table.releaseYear} is null or (${table.releaseYear} >= 1800 and ${table.releaseYear} <= 2200)`
    ),
    check(
      'lenses_price_check',
      sql`${table.purchasePriceMinor} is null or ${table.purchasePriceMinor} >= 0`
    )
  ]
);

export const dailyLenses = sqliteTable(
  'daily_lenses',
  {
    day: text('day').primaryKey(),
    lensId: integer('lens_id')
      .notNull()
      .references(() => lenses.id, { onDelete: 'cascade' }),
    cycle: integer('cycle').notNull().default(0),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull()
  },
  (table) => [index('daily_lenses_cycle_lens_idx').on(table.cycle, table.lensId)]
);

export const dailyLensHistory = sqliteTable(
  'daily_lens_history',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    day: text('day').notNull(),
    lensId: integer('lens_id')
      .notNull()
      .references(() => lenses.id, { onDelete: 'cascade' }),
    cycle: integer('cycle').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull()
  },
  (table) => [index('daily_lens_history_cycle_lens_idx').on(table.cycle, table.lensId)]
);

export const dailyChallenges = sqliteTable('daily_challenges', {
  day: text('day').primaryKey(),
  challengeJson: text('challenge_json').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull()
});

export const lensPhotos = sqliteTable(
  'lens_photos',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    lensId: integer('lens_id')
      .notNull()
      .references(() => lenses.id, { onDelete: 'cascade' }),
    storageKey: text('storage_key').notNull().unique(),
    originalName: text('original_name').notNull(),
    mimeType: text('mime_type').notNull(),
    width: integer('width').notNull(),
    height: integer('height').notNull(),
    position: integer('position').notNull().default(0),
    isCover: integer('is_cover', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull()
  },
  (table) => [index('photos_lens_position_idx').on(table.lensId, table.position)]
);

export const lensEntries = sqliteTable(
  'lens_entries',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    lensId: integer('lens_id')
      .notNull()
      .references(() => lenses.id, { onDelete: 'cascade' }),
    type: text('type', { enum: ['note', 'memory'] }).notNull(),
    eventDate: text('event_date'),
    body: text('body').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull()
  },
  (table) => [
    index('lens_entries_lens_type_date_idx').on(
      table.lensId,
      table.type,
      table.eventDate,
      table.createdAt
    ),
    check(
      'lens_entries_note_date_check',
      sql`${table.type} = 'memory' or ${table.eventDate} is null`
    )
  ]
);

export const lensEntryPhotos = sqliteTable(
  'lens_entry_photos',
  {
    entryId: integer('entry_id')
      .notNull()
      .references(() => lensEntries.id, { onDelete: 'cascade' }),
    photoId: integer('photo_id')
      .notNull()
      .references(() => lensPhotos.id, { onDelete: 'cascade' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull()
  },
  (table) => [
    uniqueIndex('lens_entry_photos_entry_photo_idx').on(table.entryId, table.photoId),
    index('lens_entry_photos_photo_idx').on(table.photoId)
  ]
);

export const lensesRelations = relations(lenses, ({ one, many }) => ({
  manufacturer: one(manufacturers, {
    fields: [lenses.manufacturerId],
    references: [manufacturers.id]
  }),
  mount: one(mounts, { fields: [lenses.mountId], references: [mounts.id] }),
  photos: many(lensPhotos),
  entries: many(lensEntries),
  dailySelections: many(dailyLenses),
  dailyHistory: many(dailyLensHistory)
}));

export type Lens = typeof lenses.$inferSelect;
export type LensPhoto = typeof lensPhotos.$inferSelect;
export type LensEntry = typeof lensEntries.$inferSelect;
export type LensEntryPhoto = typeof lensEntryPhotos.$inferSelect;
export type DailyLens = typeof dailyLenses.$inferSelect;
export type DailyLensHistory = typeof dailyLensHistory.$inferSelect;
export type DailyChallenge = typeof dailyChallenges.$inferSelect;
export type Manufacturer = typeof manufacturers.$inferSelect;
export type Mount = typeof mounts.$inferSelect;
export type Session = typeof sessions.$inferSelect;
