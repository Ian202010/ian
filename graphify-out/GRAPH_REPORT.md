# Graph Report - ian  (2026-11-22)

## Corpus Check
- 35 files · ~11,267 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 3, .css 3)

## Summary
- 259 nodes · 417 edges · 12 communities
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 26 edges (avg confidence: 0.87)
- Token cost: 90,234 input · 0 output

## Graph Freshness
- Built from commit: `ad3259e2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Video Project Packages
- Site Motion Stack
- Site Dependencies
- TopTikTok Scenes
- HelloWorld Composition
- Remotion Docs & Fonts
- ScrollReveal Internals
- Root TS Config
- Site TS Config
- Threads & React Bits License
- SplitText Internals
- Magnet.tsx

## God Nodes (most connected - your core abstractions)
1. `remotion` - 16 edges
2. `compilerOptions` - 12 edges
3. `compilerOptions` - 11 edges
4. `Magnet()` - 10 edges
5. `App()` - 9 edges
6. `TopTikTok()` - 9 edges
7. `colors` - 8 edges
8. `Website (`site/`, its own `package.json`, Vite + React 19)` - 8 edges
9. `Hero()` - 7 edges
10. `Reel()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `Remotion videos (`src/`, root `package.json`)` --references--> `TopTikTok()`  [INFERRED]
  CLAUDE.md → src/TopTikTok/TopTikTok.tsx
- `Website (`site/`, its own `package.json`, Vite + React 19)` --references--> `App()`  [INFERRED]
  CLAUDE.md → site/src/App.tsx
- `Website (`site/`, its own `package.json`, Vite + React 19)` --references--> `Hero()`  [INFERRED]
  CLAUDE.md → site/src/App.tsx
- `Website (`site/`, its own `package.json`, Vite + React 19)` --references--> `Reel()`  [INFERRED]
  CLAUDE.md → site/src/App.tsx
- `CONTACT_EMAIL placeholder` --conceptually_related_to--> `Reel()`  [AMBIGUOUS]
  site/README.md → site/src/App.tsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Remotion CLI workflow** — readme_start_preview, readme_remotion_render, readme_remotion_upgrade, readme_remotion [EXTRACTED 1.00]
- **Smooth scroll and pinned scene strip motion stack** — site_readme_lenis, site_readme_gsap, site_readme_scrolltrigger, site_src_app_reel [EXTRACTED 1.00]
- **Copied React Bits components** — site_readme_react_bits, site_src_components_reactbits_splittext_splittext, site_src_components_reactbits_scrollreveal_scrollreveal, site_src_components_reactbits_threads_threads, site_src_components_reactbits_magnet_magnet [EXTRACTED 1.00]

## Communities (12 total, 0 thin omitted)

### Community 0 - "Video Project Packages"
Cohesion: 0.05
Nodes (44): allowScripts, esbuild, dependencies, react@19.3.1, react-dom@19.3.1, remotion@4.0.545, @remotion/cli@4.0.545, @remotion/google-fonts@4.0.545 (+36 more)

### Community 1 - "Site Motion Stack"
Cohesion: 0.13
Nodes (16): Knowledge graph (`graphify-out/`), Project map (read this before opening files), Remotion videos (`src/`, root `package.json`), Website (`site/`, its own `package.json`, Vite + React 19), CONTACT_EMAIL placeholder, GSAP, Lenis, ScrollTrigger (+8 more)

### Community 2 - "Site Dependencies"
Cohesion: 0.08
Nodes (30): gsap, @gsap/react, lenis, @types/react-dom, vite, @vitejs/plugin-react, dependencies, gsap@^3.15.1 (+22 more)

### Community 3 - "TopTikTok Scenes"
Cohesion: 0.14
Nodes (22): CreatorScene, CreatorSceneInner(), Fact(), Counter(), HookScene, HookSceneInner(), FloatingRider(), IllusionScene (+14 more)

### Community 4 - "HelloWorld Composition"
Cohesion: 0.17
Nodes (14): remotion, Arc(), arcLength, Atom(), HelloWorld(), HelloWorldProps, Logo, LogoInner() (+6 more)

### Community 5 - "Remotion Docs & Fonts"
Cohesion: 0.13
Nodes (13): Remotion, Remotion Fundamentals Docs, Render Video (npx remotion render), Upgrade Remotion (npx remotion upgrade), Remotion Video Project, Start Preview (npm run dev), Bricolage Grotesque font, Site index.html (Ian, explainer videos) (+5 more)

### Community 6 - "ScrollReveal Internals"
Cohesion: 0.23
Nodes (13): clamp01(), clampToScroll(), easeBack(), easeOut(), glowAt(), paintPiece(), RevealEffect, RevealLook (+5 more)

### Community 7 - "Root TS Config"
Cohesion: 0.14
Nodes (13): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, jsx, lib, module, moduleResolution, noEmit (+5 more)

### Community 8 - "Site TS Config"
Cohesion: 0.15
Nodes (12): compilerOptions, isolatedModules, jsx, lib, module, moduleResolution, noEmit, skipLibCheck (+4 more)

### Community 9 - "Threads & React Bits License"
Cohesion: 0.23
Nodes (11): React Bits, David Haz, MIT + Commons Clause License v1.0, No Warranty, clamp(), compile(), link(), locate() (+3 more)

### Community 10 - "SplitText Internals"
Cohesion: 0.21
Nodes (11): DEFAULT_FROM, DEFAULT_TO, fontsAreLoaded(), getEffect(), Kick, Look, SplitText(), SplitTextEffect (+3 more)

### Community 11 - "Magnet.tsx"
Cohesion: 0.16
Nodes (15): arbitrate(), attach(), DEFAULT_SPRING, Entry, field, Magnet(), MagnetAxis, MagnetProps (+7 more)

## Ambiguous Edges - Review These
- `Reel()` → `CONTACT_EMAIL placeholder`  [AMBIGUOUS]
  site/README.md · relation: conceptually_related_to

## Knowledge Gaps
- **12 isolated node(s):** `CONTACT_EMAIL placeholder`, `/src/main.tsx module entry`, `#root mount element`, `Render Video (npx remotion render)`, `Upgrade Remotion (npx remotion upgrade)` (+7 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 97 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `remotion` connect `HelloWorld Composition` to `Video Project Packages`, `TopTikTok Scenes`?**
  _High betweenness centrality (0.372) - this node is a cross-community bridge._
- **What connects `CONTACT_EMAIL placeholder`, `/src/main.tsx module entry`, `#root mount element` to the rest of the system?**
  _12 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Video Project Packages` be split into smaller, more focused modules?**
  _Cohesion score 0.0545790934320074 - nodes in this community are weakly interconnected._
- **Why does `React Bits` connect `Threads & React Bits License` to `SplitText Internals`, `Magnet.tsx`, `ScrollReveal Internals`?**
  _High betweenness centrality (0.116) - this node is a cross-community bridge._
- **Should `Site Motion Stack` be split into smaller, more focused modules?**
  _Cohesion score 0.1339031339031339 - nodes in this community are weakly interconnected._
- **Why does `MIT + Commons Clause License v1.0` connect `Threads & React Bits License` to `Remotion Docs & Fonts`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Reel()` and `CONTACT_EMAIL placeholder`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._