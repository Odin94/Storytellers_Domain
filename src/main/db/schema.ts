import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const audioCategoryEnum = ['music', 'effect'] as const
export type AudioCategory = (typeof audioCategoryEnum)[number]

export const audioFiles = sqliteTable('audio_files', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  path: text('path').notNull(),
  name: text('name').notNull(),
  category: text('category', { enum: audioCategoryEnum }).notNull(),
  quickSelect: integer('quick_select', { mode: 'boolean' }).notNull().default(false),
  randomPitch: integer('random_pitch', { mode: 'boolean' }).notNull().default(false),
  imagePath: text('image_path'),
  icon: text('icon'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(new Date()),
})

export const games = sqliteTable('games', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
})

export const scenes = sqliteTable('scenes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  gameId: integer('game_id')
    .notNull()
    .references(() => games.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  imagePath: text('image_path'),
  sortOrder: integer('sort_order').notNull().default(0),
})

export const sceneMusic = sqliteTable('scene_music', {
  sceneId: integer('scene_id')
    .notNull()
    .references(() => scenes.id, { onDelete: 'cascade' }),
  audioFileId: integer('audio_file_id')
    .notNull()
    .references(() => audioFiles.id, { onDelete: 'cascade' }),
  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
})

export const sceneSoundEffects = sqliteTable('scene_sound_effects', {
  sceneId: integer('scene_id')
    .notNull()
    .references(() => scenes.id, { onDelete: 'cascade' }),
  audioFileId: integer('audio_file_id')
    .notNull()
    .references(() => audioFiles.id, { onDelete: 'cascade' }),
  sortOrder: integer('sort_order').notNull().default(0),
})

export type AudioFile = typeof audioFiles.$inferSelect
export type NewAudioFile = typeof audioFiles.$inferInsert
export type Game = typeof games.$inferSelect
export type NewGame = typeof games.$inferInsert
export type Scene = typeof scenes.$inferSelect
export type NewScene = typeof scenes.$inferInsert
export type SceneMusic = typeof sceneMusic.$inferSelect
export type NewSceneMusic = typeof sceneMusic.$inferInsert
export type SceneSoundEffect = typeof sceneSoundEffects.$inferSelect
export type NewSceneSoundEffect = typeof sceneSoundEffects.$inferInsert
