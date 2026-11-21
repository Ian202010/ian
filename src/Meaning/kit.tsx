import { loadFont } from "@remotion/fonts";
import type React from "react";
import { Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

// Fonts are self-hosted in public/fonts (variable fonts, OFL licensed) so renders
// never depend on reaching Google's CDN.
loadFont({ family: "Fraunces", url: staticFile("fonts/Fraunces.woff2"), weight: "100 900" });
loadFont({ family: "Fraunces", url: staticFile("fonts/Fraunces-Italic.woff2"), weight: "100 900", style: "italic" });
loadFont({ family: "Inter", url: staticFile("fonts/Inter.woff2"), weight: "100 900" });

export const serif = "Fraunces, serif";
export const sans = "Inter, sans-serif";

// TikTok UI covers the right edge (buttons) and the bottom (caption + nav).
// Keep everything important inside this box on a 1080x1920 canvas.
export const SAFE = { top: 170, bottom: 1520, left: 80, right: 940 } as const;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/**
 * Text that rises in with a soft blur and optionally leaves.
 * `at` / `out` are seconds relative to the parent sequence.
 */
export const Reveal: React.FC<{
  at: number;
  out?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
  rise?: number;
}> = ({ at, out, children, style, rise = 36 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inP = interpolate(frame, [at * fps, at * fps + 0.45 * fps], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const outP =
    out === undefined
      ? 0
      : interpolate(frame, [out * fps, out * fps + 0.3 * fps], [0, 1], {
          ...clamp,
          easing: Easing.bezier(0.7, 0, 0.84, 0),
        });
  return (
    <div
      style={{
        opacity: inP * (1 - outP),
        translate: `0px ${(1 - inP) * rise - outP * 24}px`,
        filter: `blur(${(1 - inP) * 10 + outP * 8}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Words appear one by one — keeps sound-off viewers reading in rhythm. */
export const WordByWord: React.FC<{
  at: number;
  text: string;
  perWord?: number;
  style?: React.CSSProperties;
  highlight?: Record<string, React.CSSProperties>;
}> = ({ at, text, perWord = 0.09, style, highlight = {} }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(" ");
  return (
    <div style={{ display: "flex", flexWrap: "wrap", columnGap: "0.28em", ...style }}>
      {words.map((w, i) => {
        const start = (at + i * perWord) * fps;
        const p = interpolate(frame, [start, start + 0.35 * fps], [0, 1], {
          ...clamp,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        });
        const key = w.replace(/[^\w%$.,]/g, "");
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: p,
              translate: `0px ${(1 - p) * 22}px`,
              ...(highlight[key] ?? {}),
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

/** Animated integer counter with thousands separators. */
export const Counter: React.FC<{
  from: number;
  to: number;
  start: number;
  end: number;
  style?: React.CSSProperties;
  suffix?: string;
}> = ({ from, to, start, end, style, suffix = "" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const v = interpolate(frame, [start * fps, end * fps], [from, to], {
    ...clamp,
    easing: Easing.bezier(0.33, 1, 0.68, 1),
  });
  return (
    <span style={{ fontVariantNumeric: "tabular-nums", ...style }}>
      {Math.round(v).toLocaleString("en-US")}
      {suffix}
    </span>
  );
};

/** Subtle film grain + vignette so flat colors don't look like a slide deck. */
export const Grain: React.FC<{ opacity?: number; vignette?: string }> = ({
  opacity = 0.06,
  vignette = "rgba(0,0,0,0.55)",
}) => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 2) % 8;
  return (
    <>
      <svg
        width="1080"
        height="1920"
        style={{ position: "absolute", inset: 0, opacity, mixBlendMode: "overlay", pointerEvents: "none" }}
      >
        <filter id={`g${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed} />
        </filter>
        <rect width="100%" height="100%" filter={`url(#g${seed})`} />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 50% 45%, transparent 55%, ${vignette} 100%)`,
          pointerEvents: "none",
        }}
      />
    </>
  );
};
