# Storyteller's Domain – Implementation Plan

## Architecture Overview

- **Main process**: Database (Drizzle + better-sqlite3), file system access, custom protocol for serving audio from disk, electron-updater.
- **Preload**: contextBridge API for safe IPC (audio, DB operations, file dialogs).
- **Renderer**: React app with React Router; all UI and playback logic; no direct Node/DB access.

---

## 1. Project bootstrap

- Scaffold with electron-vite (Vite 5 + Electron): `main`, `preload`, `renderer` entries; renderer = React + TypeScript.
- Dependencies: React, React Router DOM, Tailwind 4 (`tailwindcss`, `@tailwindcss/vite`), shadcn/ui v3 (Vite + Tailwind 4), Drizzle ORM + `better-sqlite3`, framer-motion, Magic UI, electron-updater, lucide-react.
- Tailwind 4: Vite plugin in renderer config; single CSS entry with `@import "tailwindcss";`; dark-only theme.
- shadcn: Init (Vite, Tailwind 4); add components as needed; dark style only.
- Electron: DB path = `app.getPath('userData') + '/storytellers-domain.db'`. Default assets folder under userData or user-selectable.

---

## 2. Database schema (Drizzle + SQLite)

- **audio_files**: `id`, `path`, `name`, `category` (enum: `music` | `effect`), `quick_select`, `random_pitch` (boolean, optional random pitch for SFX), `image_path` (nullable), `icon` (nullable string: emoji or Lucide icon name), `created_at`.
- **games**: `id`, `name`, `sort_order`.
- **scenes**: `id`, `game_id`, `title`, `description`, `image_path` (nullable), `sort_order`.
- **scene_music**: `scene_id`, `audio_file_id`, `is_default`, `sort_order`.
- **scene_sound_effects**: `scene_id`, `audio_file_id`, `sort_order`.

---

## 3. Sound effects: optional random pitch shifting

- **Schema**: `audio_files.random_pitch` (boolean). When true, each playback of that sound effect uses a small random pitch shift.
- **Playback**: In renderer, when playing a sound effect with `random_pitch === true`, apply a small random pitch variation (e.g. ±2–5% or ±0.1–0.2 semitones) via Web Audio API: create `AudioContext`, decode buffer, create `GainNode` and optionally `BiquadFilterNode` or use `playbackRate` on an `Audio` element (simpler but less precise). Prefer Web Audio API for pitch so music can stay on `<audio>` and SFX with pitch shift use a single shared `AudioContext` and `BufferSourceNode` with `detune` (cents) or `playbackRate`. Apply random value each time the SFX is triggered.
- **UI**: In audio management (and anywhere an audio file is edited), for files in category `effect`, show a checkbox “Random pitch (slight variation each play)”.

---

## 4. Audio file image or icon

- **Schema**: `audio_files.image_path` (nullable), `audio_files.icon` (nullable string). If `icon` is set, it stores either an emoji (single character or short string) or a Lucide icon name (e.g. `"music"`, `"volume2"`). Display logic: if `image_path` use image, else if `icon` check if it’s a known Lucide name and render `<LucideIcon>`, else treat as emoji.
- **UI**: In audio management (edit audio file): “Visual”: option “Image” (file picker, store path or copy to userData) or “Icon” (sub-option: emoji input or Lucide icon picker). Only one of image or icon is used; choosing one clears the other.
- **Display**: Use this image/icon in audio lists (manage audio, scene music/SFX lists, quick-select). Same protocol as scene images for loading from disk (custom protocol or IPC-served URL).

---

## 5. “Stop all sounds” button

- **Placement**: Always visible in the app shell—e.g. in the top header bar or in the persistent “active scene” box. Prefer a fixed position (header or floating corner) so it’s available on every page.
- **Behavior**: On click, stop all currently playing audio: the single active background music track and every active sound effect instance. Implement by: (1) keeping refs/registry of all active playback (one music ref + list of SFX instances), and (2) exposing a “stopAll” in playback context/store that stops music and all SFX. No confirmation; immediate stop.
- **UI**: Button with label “Stop all” or Lucide “Square”/“Stop” icon; clear and always visible (e.g. header right).

---

## 6. Main process and IPC (summary)

- DB in main; IPC for all app operations (games, scenes, audio_files, scene_music, scene_sound_effects, file scan, pick folder, get audio URL).
- Custom protocol (e.g. `app://`) to serve audio (and images) from disk for renderer.
- electron-updater in main; GitHub publish for Odin94/Storytellers_Domain.

---

## 7. Renderer app structure (summary)

- Router: dashboard, games, scenes, scene view, audio management. Active scene box when a scene is active; **Stop all sounds** button in header or active-scene bar.
- **Quick-select everywhere**: The quick-select list (music + effects) is available globally—e.g. in the app shell (sidebar or header) or on the dashboard—so it is playable even when no scene is selected. Same playback rules: one current music (looped), SFX can overlap, optional random pitch for SFX. When no scene is active, only quick-select audio can play; when a scene is active, both scene music/SFX and quick-select are available.
- Playback: one current music (looped); SFX can overlap; optional random pitch per SFX when `random_pitch` is true; preload scene-associated audio on scene enter; preload or lazy-load quick-select audio when the quick-select panel is shown.
- Audio management: new files section, existing files list with name/category/quick_select/**random_pitch**/image/icon editing.

---

## 8. Suggested implementation order

1. Scaffold: electron-vite + React + TS, Tailwind 4, shadcn 3, React Router, Drizzle schema (including `random_pitch`, `image_path`, `icon` on audio_files) + migrations, main/preload/renderer + minimal IPC.
2. Data + protocol: custom protocol for audio (and images); IPC for DB and file scan/pick.
3. Core UI: Layout with header (include “Stop all sounds” from the start), sidebar/nav, **global quick-select panel** (playable when no scene is selected), Dashboard, Scene view, Active scene box.
4. Playback: Music + SFX; optional random pitch for SFX (Web Audio or playbackRate); preload; “Stop all” wired to stop music + all SFX.
5. Audio management: New files + existing files; edit name, category, quick_select, **random_pitch**, **image/icon** (image from disk or icon: emoji/Lucide).
6. Polish: Framer-motion, Magic UI, placeholders for future features.
7. Packaging: electron-builder + electron-updater + GitHub publish.

---

## File layout (high level)

- `package.json`, `electron.vite.config.ts`, `tsconfig.*.json`
- `src/main/`: `index.ts`, `db/schema.ts`, `db/index.ts`, `ipc/*.ts`, `protocol.ts`
- `src/preload/`: `index.ts` (contextBridge)
- `src/renderer/`: `main.tsx`, `App.tsx`, `index.html`, styles, `components/`, `pages/`, `lib/`, `stores/` or context (active scene + playback registry for stop-all)
- `drizzle.config.ts`, `components.json` (shadcn)

This plan reflects [TODOs.md](TODOs.md) including: optional random pitch for sound effects, image or icon per audio file, and an always-visible “Stop all sounds” button.
