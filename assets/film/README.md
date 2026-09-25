# The way we build — four looping scenes

Original procedural 3D process film, created for AYNKO. All models, animation, typography, and copy are local; no stock footage or remote media services are used.

- `understand.mp4`, `architect.mp4`, `build.mp4`, `evolve.mp4`: separate eight-second loops, 1280×720, 24 fps, H.264 / yuv420p, silent, fast-start metadata.
- A matching `.webp` poster exists for each scene, used while loading and for reduced motion.
- The selected scene plays automatically when visible and loops without moving on to another stage. Motion pauses offscreen and in hidden tabs. The site provides its own discreet pause button; native video controls and the old embedded chapter strip are absent.

Text on screen explains each stage. Readable descriptions are included below the scene selector. Keyboard arrows, Home, and End switch scenes; a manually paused state persists across switches.

Edit `src/data/process-film.js` for chapter copy and `tools/film/scene.js` for 3D direction. Run `npm run render:film`, then `npm run build`, to regenerate and package the assets. The renderer requires Microsoft Edge through Playwright and an H.264-capable FFmpeg executable. Set `FFMPEG_PATH`, install Python's `imageio_ffmpeg`, or put `ffmpeg` on PATH. `node tools/render-process-film.mjs --preview` creates four stills under `artifacts/` without encoding the video.

The renderer is a build tool and is not loaded by visitors.
