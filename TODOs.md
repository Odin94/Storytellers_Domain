## Storyteller's Domain

Storyteller's Domain is an ambience dashboard for TTRPG GMs.

It is built using vite, typescript, react, tailwind 4, shadcn 3, drizzle+sqlite and electron.

It uses electron builder and updater for building for windows, macos and linux, and allow autoupdating. New versions are released to github at https://github.com/Odin94/Storytellers_Domain

### Features

* Loads audio files, supporting all popular formats, from disk
* There's a page for managing audio files that 
  * Shows new files in a "new audio files" section (loaded from disk /assets/audio)
  * Shows existing categorized audio files and lets you edit their names and add them to the quick-select list
* Audiofiles can be categorized into music and effects
* Create "game"s, which are just a categorization that contains scenes
* Create scenes (title, description, image, sound-effects, music)
* Assign music to scenes; one music auto-plays as default for the scene, but you can add multiple to quick-switch
* You can also assign sound effects to scenes
* In a dashboard, you can select a scene to activate
* The active scene remains active and shows in a little box even if you navigate away from it - that box always lets you pause/resume the music and go back to the scene view
* Clicking a scene from the dashboard takes you to the scene view
* Entering the scene view does NOT automatically start playing music or activate the scene. You have to click an activate button for that
* Inside the scene, you have 2 lists: background music options and sound effect options. Clicking a background music stops the current one and plays the new one. Music always plays looped. Clicking a sound effect plays that sound effect once and doesn't stop music or other sound effects. Clicking a sound effect multiple times plays it multiple times, even if the first instance isn't done playing yet.
* Sound effects can optionally use automatic random pitch shifting (very small) every time they play.
* You can assign an image (loaded from disk) or an icon (pre-defined: emoji or Lucide icons) to each audio file.
* A "stop all sounds" button is always visible and stops all currently playing music and sound effects.
* You can turn on and off "edit mode" in a scene that lets you remove or add music or sound effects to/from a scene
  * Adding lets you select from a list of known audio or load from disk
* You can assign a title, description and image to a scene that is shown in the dashboard view
* In every scene, you can also play sound effects and music from the quick-select list
* Quick-select audio is playable even when no scene is selected (e.g. from the dashboard or a global quick-select panel)
* Playing audio within a scene should be very responsive, if necessary load scene-associated audio into memory when clicking a scene to be able to play it immediately on click




### Future features
These features don't exist yet, but the UI should leave space for them where we would implement them in the future.

* Adding music from spotify
* Adding multiple images that can be full-screened for a scene
* Managing NPCs in quick-select and assigning them to scenes (NPCs come with a picture, name and description)
* A dice roller
* Interacting with philips hue smart lights
* Interacting with Alexa to make it say things



## UI
* Only dark mode style looks, no theme switching necessary
* Use pretty animations for icons, transitions etc. (using framer-motion where appropriate)
* Use the Magic UI library to make things prettier and fancier where appropriate
