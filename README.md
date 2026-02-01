# Storyteller's Domain

Ambience dashboard for TTRPG GMs. Built with Vite, TypeScript, React, Tailwind, Drizzle + SQLite, and Electron.

## Requirements

- Node.js 18+
- On Windows: [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) (for `better-sqlite3` native module) with "Desktop development with C++" or the ClangCL component

## Setup

```bash
npm install
```

If `better-sqlite3` fails to build on Windows (e.g. missing ClangCL), you can install without building native modules and run Electron only:

```bash
npm install --ignore-scripts
node node_modules/electron/install.js
```

Then run `npm run dev`. The app may fail when opening the database until `better-sqlite3` is built (run `npm rebuild better-sqlite3` when build tools are available).

## Scripts

- `npm run dev` – Start dev server and Electron
- `npm run build` – Build for production
- `npm run preview` – Preview production build
- `npm run db:generate` – Generate Drizzle migrations
- `npm run db:studio` – Open Drizzle Studio

## Features

- Load and manage audio files (music and effects) from disk
- Create games and scenes; assign music and sound effects to scenes
- Dashboard to activate scenes; active scene bar with pause/play
- Quick-select audio playable from anywhere (including when no scene is selected)
- Stop-all-sounds button always visible
- Optional random pitch for sound effects; image or icon per audio file

See [TODOs.md](TODOs.md) for the full spec and [PLAN.md](PLAN.md) for implementation details.
