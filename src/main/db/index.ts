import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { app } from 'electron'
import path from 'path'
import * as schema from './schema'

let db: ReturnType<typeof drizzle<typeof schema>> | null = null
let sqliteInstance: Database.Database | null = null

export const getDb = () => {
  if (!db) throw new Error('Database not initialized')
  return db
}

const runMigrations = (sqlite: Database.Database) => {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS audio_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL CHECK (category IN ('music', 'effect')),
      quick_select INTEGER NOT NULL DEFAULT 0,
      random_pitch INTEGER NOT NULL DEFAULT 0,
      image_path TEXT,
      icon TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS scenes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      image_path TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS scene_music (
      scene_id INTEGER NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
      audio_file_id INTEGER NOT NULL REFERENCES audio_files(id) ON DELETE CASCADE,
      is_default INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS scene_sound_effects (
      scene_id INTEGER NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
      audio_file_id INTEGER NOT NULL REFERENCES audio_files(id) ON DELETE CASCADE,
      sort_order INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_scenes_game_id ON scenes(game_id);
    CREATE INDEX IF NOT EXISTS idx_scene_music_scene_id ON scene_music(scene_id);
    CREATE INDEX IF NOT EXISTS idx_scene_music_audio_file_id ON scene_music(audio_file_id);
    CREATE INDEX IF NOT EXISTS idx_scene_sound_effects_scene_id ON scene_sound_effects(scene_id);
    CREATE INDEX IF NOT EXISTS idx_scene_sound_effects_audio_file_id ON scene_sound_effects(audio_file_id);
  `)
}

export const initDb = async () => {
  const userData = app.getPath('userData')
  const dbPath = path.join(userData, 'storytellers-domain.db')
  sqliteInstance = new Database(dbPath)
  runMigrations(sqliteInstance)
  db = drizzle(sqliteInstance, { schema })
  return db
}

export const closeDb = async () => {
  if (sqliteInstance) {
    sqliteInstance.close()
    sqliteInstance = null
  }
  db = null
}

export * from './schema'
