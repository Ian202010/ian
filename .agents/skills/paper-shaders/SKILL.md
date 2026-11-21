---
name: paper-shaders
description: Animated shader backgrounds and textures for Remotion videos with Paper Shaders (@paper-design/shaders-react) - mesh gradients, grain gradients, halftone, dithering, liquid metal, god rays, smoke, water, waves, voronoi, metaballs, paper texture and more. Use when a video needs an animated gradient, grainy/film texture, halftone or retro-print look, metallic or liquid background, or any "shader background".
---

# Paper Shaders in Remotion

Package: `@paper-design/shaders-react`, pinned at `0.0.82` in `package.json` (upstream ships breaking changes under 0.0.x — keep it pinned, upgrade on purpose). Apache-2.0, no visible credit needed in videos.

## The one rule: never let a shader run on its own clock

Paper shaders animate with `requestAnimationFrame` by default, which gives different pixels on every render. In Remotion always go through `src/PaperShaders/RemotionShader.tsx`, which sets `speed={0}` and feeds `frame` (milliseconds since start) from `useCurrentFrame()`:

```tsx
import { MeshGradient } from "@paper-design/shaders-react";
import { RemotionShader } from "../PaperShaders/RemotionShader";

<RemotionShader
  shader={MeshGradient}
  colors={["#5100ff", "#00ff80", "#ffcc00", "#ea00ff"]}
  distortion={1}
  swirl={0.8}
  timeScale={0.6}   // replaces `speed`: 1 = real time, 0.5 = half, 2 = double
/>
```

It fills its parent as an `AbsoluteFill`; put content on top in a later `AbsoluteFill`, or wrap it in a `<Sequence>` to time it. Pass extra wrapper styles (opacity, mask, blend mode) with `style`.

To use a shader as a mask/texture on text, render it in an `AbsoluteFill` and apply `mixBlendMode` or a CSS `mask-image` on a sibling — the canvas itself is a normal DOM element.

## Available shaders

Animated: `MeshGradient`, `GrainGradient`, `LiquidMetal`, `Dithering`, `DotOrbit`, `DotGrid`, `GodRays`, `GemSmoke`, `SmokeRing`, `Metaballs`, `NeuroNoise`, `PerlinNoise`, `SimplexNoise`, `Voronoi`, `Warp`, `Swirl`, `Spiral`, `Waves`, `Water`, `ColorPanels`, `PulsingBorder`, `Heatmap`.
Image filters (take an `image` URL — use `staticFile()`): `HalftoneDots`, `HalftoneCmyk`, `ImageDithering`, `FlutedGlass`, `LensDistortion`, `PaperTexture`, `Heatmap`, `LiquidMetal`.
Static: `StaticMeshGradient`, `StaticRadialGradient`.

Exact props and defaults: `node_modules/@paper-design/shaders-react/dist/shaders/<kebab-name>.d.ts`, and each shader exports a `<name>Presets` array (e.g. `meshGradientPresets`) whose `params` are good starting points — spread them in: `{...meshGradientPresets[1].params}`. Interactive playground: https://shaders.paper.design/

## Rendering

Shaders are WebGL2. Headless renders need a GL backend:

```bash
npx remotion render <Composition> out/video.mp4 --gl=angle      # machine with a GPU
npx remotion render <Composition> out/video.mp4 --gl=swangle    # no GPU / cloud container
```

In a sandbox that cannot download Remotion's Chrome, add `--browser-executable=<path to chromium>` (e.g. the Playwright Chromium under `/opt/pw-browsers/`).

Check a few stills (`npx remotion still <id> out.png --frame=N --gl=swangle --scale=0.25`) before a full render: two different frames must differ, and rendering the same frame twice must give an identical file.

Example composition: `PaperShadersDemo` (`src/PaperShaders/PaperShadersDemo.tsx`).
