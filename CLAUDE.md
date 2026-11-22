# Project map (read this before opening files)

Two apps in one repo. Use this map to find the right file, then read only that file.

## Remotion videos (`src/`, root `package.json`)
- `src/index.ts` registers `src/Root.tsx`, which lists the compositions:
  - `TopTikTok`: 1080×1920, 30 fps, 810 frames. Explains Zach King's broom TikTok.
  - `HelloWorld`, `Logo`, `Title`: 1920×1080 Remotion starter.
- `src/TopTikTok/TopTikTok.tsx`: a `TransitionSeries` of 6 scenes, in order:
  Hook (4 s) → Creator (4.5 s) → Illusion (4.5 s) → Secret (6.5 s) → Why (5 s) → Record (4.5 s).
  Each scene is in `src/TopTikTok/<Name>Scene.tsx`. `Rider.tsx` is the SVG broom rider.
- `src/TopTikTok/theme.ts`: Poppins font, `colors` (bg #0b0b12, cyan #25F4EE, pink #FE2C55) and `sceneStyle`.
- `src/HelloWorld/`: Arc, Atom, Logo, Title (starter animation pieces).
- Commands: `npm run dev` (Studio), `npx remotion render <id>`, `npm run lint`.
- Remotion guidance lives in `.claude/skills/remotion-*`. Don't scan `.agents/` or `.claude/` for project code.

## Website (`site/`, its own `package.json`, Vite + React 19)
- `site/src/main.tsx` mounts `App.tsx`. Styles are in `site/src/styles.css`, with tokens in `:root`.
- `site/src/motion.ts`: `startSmoothScroll()` runs Lenis on GSAP's ticker; `scrollToTarget()`. Reduced motion means no Lenis.
- `site/src/App.tsx`: `App` → `Hero` (Threads background, SplitText headline, Magnet button) → `Reel` (GSAP ScrollTrigger pinned sideways strip of the 6 scenes) → `Process` (ScrollReveal) → `Contact` (`CONTACT_EMAIL` placeholder).
- `site/src/data.ts`: `scenes` array, mirroring the TopTikTok scenes.
- `site/src/components/reactbits/`: SplitText, ScrollReveal, Threads, Magnet, copied from React Bits (MIT + Commons Clause, see LICENSE.md there).
- Commands: `cd site && npm i && npm run dev` / `npm run build`.
- The root `tsconfig.json` excludes `site/`.

## Knowledge graph (`graphify-out/`)
- `GRAPH_REPORT.md` (~1.7k tokens): communities, central nodes and cross-links. Read it for structural questions.
- `graph.json`: the full graph. Don't read it whole (~45k tokens). Query it instead: `graphify query "<question>" --budget 1500`, `graphify explain "<Symbol>"`, `graphify path "A" "B"`.
  The CLI comes from `uv tool install graphifyy`. If it isn't installed, use this map plus grep.
- `graph.html`: the interactive diagram, to open in a browser.
- After changing code, run `graphify update .` (code-only changes need no LLM) so the graph stays current.

For a simple "where is X" question, use this map or `grep` first. It's cheaper than a graph query on a repo this size.
