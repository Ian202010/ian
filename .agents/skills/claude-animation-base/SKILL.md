---
name: claude-animation-base
description: Hand-painted character animation videos with Claude Animation Base (p5.js + p5.brush) - watercolour fills, brush strokes, boiling linework, the Clawd character with emotions, views, hats and dances, storyboarded shot by shot and rendered to MP4. Use when the user asks for a hand-drawn, painted, cartoon or watercolour animated short, a Clawd video, or a character animation that should look handmade.
---

# Claude Animation Base

The kit lives at github.com/JohnHeibel/ClaudeAnimationBase (MIT). This skill fetches it and hands you over to its guide.

1. **Get the kit.** Run `sh "<skill base directory>/scripts/setup.sh"`. It clones or updates the kit (default `~/ClaudeAnimationBase`, override with `CAB_DIR`), runs `npm install`, reports whether Chrome/Chromium and ffmpeg are available, and prints `KIT=<path>` and (if found) `CHROME=<path>` on its last lines. Report missing system tools to the user; don't install system software yourself.
2. **Read `$KIT/ANIMATION_GUIDE.md` in full** and follow it: storyboard first, build shot by shot in `$KIT/src/scenes/`, check contact sheets with `render.mjs`, then render the final video. Its rules (handmade, alive, one piece, no text, transitions always, something happens in every scene) are the brief unless the user asks otherwise.
3. **Render** from `$KIT`: `node render.mjs --clip --out=out/video.mp4`. Add `--chrome="$CHROME"` if Chrome isn't in a standard place. With no GPU (cloud containers) add `--soft-gl` and tell the user the watercolour fills will be slow; offer to replace them with flat fills for speed.
4. **Deliver** by copying the final MP4 into the user's project (e.g. `out/<name>.mp4`) and telling them where it is. Keep the scene source in the kit or copy it next to the video if the user wants it versioned.

To use the result inside the Remotion project, put the MP4 in `public/` and play it with `<OffthreadVideo src={staticFile("<name>.mp4")} />`.
