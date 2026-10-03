CREATE TABLE IF NOT EXISTS `daily_challenges` (
	`day` text PRIMARY KEY NOT NULL,
	`challenge_json` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `daily_lens_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`day` text NOT NULL,
	`lens_id` integer NOT NULL,
	`cycle` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`lens_id`) REFERENCES `lenses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `daily_lens_history_cycle_lens_idx` ON `daily_lens_history` (`cycle`,`lens_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `daily_lenses` (
	`day` text PRIMARY KEY NOT NULL,
	`lens_id` integer NOT NULL,
	`cycle` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`lens_id`) REFERENCES `lenses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `daily_lenses_cycle_lens_idx` ON `daily_lenses` (`cycle`,`lens_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `lens_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lens_id` integer NOT NULL,
	`type` text NOT NULL CHECK (`type` IN ('note','memory')),
	`event_date` text,
	`body` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`lens_id`) REFERENCES `lenses`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "lens_entries_note_date_check" CHECK("lens_entries"."type" = 'memory' or "lens_entries"."event_date" is null)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `lens_entries_lens_type_date_idx` ON `lens_entries` (`lens_id`,`type`,`event_date`,`created_at`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `lens_entry_photos` (
	`entry_id` integer NOT NULL,
	`photo_id` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`entry_id`) REFERENCES `lens_entries`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`photo_id`) REFERENCES `lens_photos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `lens_entry_photos_entry_photo_idx` ON `lens_entry_photos` (`entry_id`,`photo_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `lens_entry_photos_photo_idx` ON `lens_entry_photos` (`photo_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `lens_photos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lens_id` integer NOT NULL,
	`storage_key` text NOT NULL,
	`original_name` text NOT NULL,
	`mime_type` text NOT NULL,
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`is_cover` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`lens_id`) REFERENCES `lenses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `lens_photos_storage_key_unique` ON `lens_photos` (`storage_key`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `photos_lens_position_idx` ON `lens_photos` (`lens_id`,`position`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `lenses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`manufacturer_id` integer NOT NULL,
	`mount_id` integer,
	`model` text NOT NULL,
	`serial_number` text,
	`focal_min_mm` real,
	`focal_max_mm` real,
	`aperture_min` text,
	`aperture_max` text,
	`length_mm` integer,
	`diameter_mm` integer,
	`weight_grams` integer,
	`filter_thread_mm` integer,
	`elements` integer,
	`groups` integer,
	`release_year` integer,
	`purchase_date` text,
	`purchase_price_minor` integer,
	`currency` text DEFAULT 'EUR' NOT NULL,
	`condition` text DEFAULT 'good' NOT NULL CHECK (`condition` IN ('mint','excellent','good','fair','poor')),
	`ownership` text DEFAULT 'owned' NOT NULL CHECK (`ownership` IN ('owned','sold','wishlist','borrowed')),
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`manufacturer_id`) REFERENCES `manufacturers`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`mount_id`) REFERENCES `mounts`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "lenses_focal_range_check" CHECK("lenses"."focal_max_mm" is null or "lenses"."focal_min_mm" is null or "lenses"."focal_max_mm" >= "lenses"."focal_min_mm"),
	CONSTRAINT "lenses_release_year_check" CHECK("lenses"."release_year" is null or ("lenses"."release_year" >= 1800 and "lenses"."release_year" <= 2200)),
	CONSTRAINT "lenses_price_check" CHECK("lenses"."purchase_price_minor" is null or "lenses"."purchase_price_minor" >= 0)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `lenses_manufacturer_idx` ON `lenses` (`manufacturer_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `lenses_mount_idx` ON `lenses` (`mount_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `lenses_model_idx` ON `lenses` (`model`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `lenses_condition_idx` ON `lenses` (`condition`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `lenses_ownership_idx` ON `lenses` (`ownership`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `lenses_release_year_idx` ON `lenses` (`release_year`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `manufacturers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text COLLATE NOCASE NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `manufacturers_name_unique` ON `manufacturers` (`name`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `mounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text COLLATE NOCASE NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `mounts_name_unique` ON `mounts` (`name`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `sessions_token_hash_idx` ON `sessions` (`token_hash`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `sessions_expiry_idx` ON `sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `users` (
	`id` integer PRIMARY KEY NOT NULL CHECK (`id` = 1),
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `users_username_unique` ON `users` (`username`);