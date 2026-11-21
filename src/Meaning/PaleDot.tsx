import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  random,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Grain, Reveal, sans, serif, WordByWord } from "./kit";

// "0.12 pixels" — the Pale Blue Dot.
// Facts: Voyager 1 took the photo on Feb 14, 1990, ~6 billion km from the Sun.
// NASA: Earth is "a mere point of light, a crescent only 0.12 pixel in size".
// Carl Sagan (Pale Blue Dot, 1994): the image underscores our responsibility
// "to deal more kindly with one another". Paraphrased on screen, attributed.

export const PD = {
  space: "#05060a",
  dot: "#9fd4ff",
  white: "#f3f5fb",
  muted: "#8d93a8",
};

const CX = 540;
const CY = 1020;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const inOut = Easing.bezier(0.65, 0, 0.35, 1);

/** Earth radius over time, interpolated in log space so the zoom feels like a camera. */
const useRadius = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const lnIn = interpolate(t, [3.0, 4.6], [Math.log(5), Math.log(330)], { ...clamp, easing: inOut });
  const drift = interpolate(t, [4.6, 8.5], [0, Math.log(350 / 330)], clamp);
  const lnOut = interpolate(t, [8.5, 10.4], [0, Math.log(5 / 350)], { ...clamp, easing: inOut });
  return Math.exp(lnIn + drift + lnOut);
};

const Stars = () => (
  <>
    {Array.from({ length: 140 }).map((_, i) => {
      const s = random(`s${i}`) * 2.4 + 0.6;
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: random(`x${i}`) * 1080,
            top: random(`y${i}`) * 1920,
            width: s,
            height: s,
            borderRadius: s,
            backgroundColor: "#fff",
            opacity: random(`o${i}`) * 0.5 + 0.15,
          }}
        />
      );
    })}
  </>
);

/** The scattered-sunlight bands that streak across the real photograph. */
const Sunbeams = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const r = useRadius();
  const o = interpolate(r, [5, 60], [1, 0.15], clamp);
  const bands = [
    { x: 360, w: 120, c: "rgba(214,150,108,0.20)" },
    { x: 470, w: 150, c: "rgba(190,140,170,0.16)" },
    { x: 590, w: 90, c: "rgba(120,170,215,0.17)" },
    { x: 690, w: 60, c: "rgba(220,190,140,0.10)" },
  ];
  return (
    <div style={{ position: "absolute", inset: -200, rotate: "-8deg", opacity: o }}>
      {bands.map((b, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: b.x + 200 + Math.sin(frame / fps / 2 + i) * 6,
            top: 0,
            bottom: 0,
            width: b.w,
            background: `linear-gradient(90deg, transparent, ${b.c}, transparent)`,
            filter: "blur(6px)",
          }}
        />
      ))}
    </div>
  );
};

const Earth = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const r = useRadius();
  const spin = (frame / fps) * 18;
  const detail = interpolate(r, [20, 120], [0, 1], clamp);
  const blobs = [
    { x: 0.15, y: 0.3, w: 0.5, h: 0.32, c: "#3f7d4e" },
    { x: 0.55, y: 0.55, w: 0.38, h: 0.42, c: "#5c8a45" },
    { x: 0.05, y: 0.7, w: 0.3, h: 0.18, c: "#b39a6a" },
    { x: 0.85, y: 0.18, w: 0.4, h: 0.25, c: "#4a7f52" },
  ];
  const clouds = [
    { x: 0.2, y: 0.15, w: 0.6, h: 0.1 },
    { x: 0.45, y: 0.42, w: 0.5, h: 0.08 },
    { x: 0.1, y: 0.62, w: 0.55, h: 0.09 },
    { x: 0.6, y: 0.8, w: 0.45, h: 0.08 },
  ];
  return (
    <div
      style={{
        position: "absolute",
        left: CX - r,
        top: CY - r,
        width: 2 * r,
        height: 2 * r,
        borderRadius: "50%",
        overflow: "hidden",
        background: "radial-gradient(circle at 35% 30%, #6fb7ef 0%, #2a6fb3 45%, #0b2550 100%)",
        boxShadow: `0 0 ${Math.max(6, r * 0.25)}px rgba(140,200,255,0.55)`,
      }}
    >
      <div style={{ position: "absolute", inset: 0, opacity: detail }}>
        {blobs.map((b, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${(((b.x * 100 + spin) % 140) - 20).toFixed(2)}%`,
              top: `${b.y * 100}%`,
              width: `${b.w * 100}%`,
              height: `${b.h * 100}%`,
              borderRadius: "45% 55% 50% 40%",
              backgroundColor: b.c,
              filter: `blur(${r * 0.03}px)`,
            }}
          />
        ))}
        {clouds.map((c, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${(((c.x * 100 + spin * 1.5) % 150) - 30).toFixed(2)}%`,
              top: `${c.y * 100}%`,
              width: `${c.w * 100}%`,
              height: `${c.h * 100}%`,
              borderRadius: "50%",
              backgroundColor: "rgba(255,255,255,0.7)",
              filter: `blur(${r * 0.035}px)`,
            }}
          />
        ))}
      </div>
      {/* night side, like the crescent in the real photo */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at 25% 25%, transparent 45%, rgba(2,4,12,0.85) 85%)",
        }}
      />
    </div>
  );
};

/** Thin ring that circles the dot — the "this one" gesture. */
const Ring = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const r = useRadius();
  const visible = interpolate(r, [5, 14], [1, 0], clamp);
  const draw = interpolate(t, [0.3, 1.1], [0, 1], { ...clamp, easing: Easing.bezier(0.33, 1, 0.68, 1) });
  const ring = 46;
  const circ = 2 * Math.PI * ring;
  return (
    <svg width={140} height={140} style={{ position: "absolute", left: CX - 70, top: CY - 70, opacity: visible }}>
      <circle
        cx={70}
        cy={70}
        r={ring}
        stroke={PD.white}
        strokeWidth={3}
        fill="none"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - draw)}
        transform="rotate(-90 70 70)"
      />
    </svg>
  );
};

// Offsets are in planet radii, chosen so every label stays inside the safe area.
const WORRIES = [
  { label: "the exam", dx: -0.6, dy: -1.15, at: 4.9 },
  { label: "what they think of you", dx: 0.15, dy: -0.6, at: 5.3 },
  { label: "the group chat", dx: -0.55, dy: 0.05, at: 5.7 },
  { label: "the 3am thought", dx: 0.5, dy: 0.35, at: 6.1 },
  { label: "money", dx: -0.45, dy: 0.8, at: 6.5 },
  { label: "your ex", dx: 0.45, dy: 1.2, at: 6.9 },
];

const Worries = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const r = useRadius();
  const k = r / 350; // shrinks with the planet
  return (
    <>
      {WORRIES.map((w) => {
        const p = interpolate(t, [w.at, w.at + 0.35], [0, 1], { ...clamp, easing: Easing.spring({ damping: 12 }) });
        const x = CX + w.dx * r;
        const y = CY + w.dy * r;
        return (
          <div
            key={w.label}
            style={{
              position: "absolute",
              left: x,
              top: y,
              translate: "-50% -50%",
              scale: String(Math.max(0.02, p * Math.min(1, k * 1.1))),
              opacity: Math.min(p, interpolate(r, [8, 60], [0, 1], clamp)),
              whiteSpace: "nowrap",
              fontFamily: sans,
              fontWeight: 600,
              fontSize: 40,
              color: PD.white,
              backgroundColor: "rgba(20,24,40,0.85)",
              border: "2px solid rgba(160,200,255,0.35)",
              borderRadius: 40,
              padding: "14px 28px",
            }}
          >
            {w.label}
          </div>
        );
      })}
    </>
  );
};

const Dot = () => {
  const frame = useCurrentFrame();
  const r = useRadius();
  const twinkle = 0.85 + 0.15 * Math.sin(frame / 5);
  return r < 8 ? (
    <div
      style={{
        position: "absolute",
        left: CX - 4,
        top: CY - 4,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: PD.dot,
        boxShadow: `0 0 ${12 * twinkle}px ${4 * twinkle}px rgba(159,212,255,0.6)`,
      }}
    />
  ) : null;
};

/** Magnified pixel grid: Earth took up 0.12 of one pixel. */
const PixelGrid = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cell = 160;
  const n = 5;
  const size = cell * n;
  // 0.12 of a pixel's area → circle diameter = sqrt(0.12 * 4/π) * cell
  const d = Math.sqrt((0.12 * 4) / Math.PI) * cell;
  return (
    <div
      style={{
        position: "absolute",
        left: CX - size / 2,
        top: CY - size / 2,
        width: size,
        height: size,
        opacity: interpolate(frame, [0, 0.4 * fps, 3.6 * fps, 4 * fps], [0, 1, 1, 0], clamp),
        scale: interpolate(frame, [0, 0.8 * fps], [0.35, 1], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1), output: "perceptual-scale" }),
      }}
    >
      {Array.from({ length: n * n }).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: (i % n) * cell,
            top: Math.floor(i / n) * cell,
            width: cell,
            height: cell,
            border: "1px solid rgba(160,180,220,0.18)",
            backgroundColor: `rgba(${30 + random(`p${i}`) * 25},${22 + random(`q${i}`) * 18},${30 + random(`r${i}`) * 25},0.9)`,
          }}
        />
      ))}
      <div style={{ position: "absolute", left: 2 * cell, top: 2 * cell, width: cell, height: cell, border: `3px solid ${PD.white}` }} />
      <div
        style={{
          position: "absolute",
          left: 2.5 * cell - d / 2,
          top: 2.5 * cell - d / 2,
          width: d,
          height: d,
          borderRadius: d,
          backgroundColor: PD.dot,
          boxShadow: "0 0 24px rgba(159,212,255,0.7)",
          scale: String(interpolate(frame, [0.6 * fps, 1.1 * fps], [0, 1], { ...clamp, easing: Easing.spring({ damping: 12 }) })),
        }}
      />
    </div>
  );
};

const Top: React.FC<{ children: React.ReactNode; top?: number }> = ({ children, top = 210 }) => (
  <AbsoluteFill style={{ top, left: 90, right: 140, bottom: "auto", alignItems: "flex-start" }}>{children}</AbsoluteFill>
);

const line = { fontFamily: serif, fontWeight: 600, fontSize: 82, color: PD.white, lineHeight: 1.1, maxWidth: 840 } as const;
const small = { fontFamily: sans, fontWeight: 600, fontSize: 42, color: PD.muted } as const;

export const PaleDot = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: PD.space }}>
      <Stars />
      <Sunbeams />
      <Earth />
      <Dot />
      <Ring />
      <Worries />

      <Sequence name="Hook" durationInFrames={3 * fps}>
        <Top>
          <WordByWord at={-0.35} perWord={0.07} text="Every problem you've ever had is in this dot." style={line} highlight={{ "dot.": { color: PD.dot, fontStyle: "italic" } }} />
        </Top>
      </Sequence>

      <Sequence name="Zoom in" from={4.6 * fps} durationInFrames={3.9 * fps}>
        <Top>
          <Reveal at={0} out={3.6} style={small}>
            Up close, it all feels huge:
          </Reveal>
        </Top>
      </Sequence>

      <Sequence name="Voyager" from={8.6 * fps} durationInFrames={4.6 * fps}>
        <Top>
          <Reveal at={0} out={4.3} style={small}>
            Feb 14, 1990.
          </Reveal>
          <WordByWord at={0.3} text="Voyager 1 turned around, 6 billion km from home, and took this photo." style={{ ...line, fontSize: 72 }} highlight={{ "6": { color: PD.dot }, billion: { color: PD.dot }, km: { color: PD.dot } }} />
        </Top>
      </Sequence>

      <Sequence name="Pixel" from={13.2 * fps} durationInFrames={4 * fps}>
        <PixelGrid />
        <Top>
          <Reveal at={0} out={3.7} style={small}>
            In that picture, Earth took up
          </Reveal>
          <Reveal at={0.3} out={3.7} style={{ fontFamily: serif, fontWeight: 800, fontSize: 150, color: PD.dot, lineHeight: 1.05 }}>
            0.12 pixels.
          </Reveal>
        </Top>
      </Sequence>

      <Sequence name="Everyone" from={17.2 * fps} durationInFrames={4.4 * fps}>
        <Top>
          <WordByWord at={0.2} perWord={0.1} text="Every person you've loved. Every worry. Every war. All of it, right there." style={{ ...line, fontSize: 76 }} />
        </Top>
      </Sequence>

      <Sequence name="Kinder" from={21.6 * fps} durationInFrames={5.4 * fps}>
        <Top>
          <Reveal at={0} out={2.5} style={{ ...line, fontSize: 70 }}>
            Carl Sagan said this photo should make us kinder to each other.
          </Reveal>
        </Top>
        <Sequence from={2.7 * fps} layout="none">
          <Top top={300}>
            <Reveal at={0} rise={50} style={{ fontFamily: serif, fontStyle: "italic", fontWeight: 600, fontSize: 130, color: PD.white, lineHeight: 1.05 }}>
              Start with yourself.
            </Reveal>
          </Top>
        </Sequence>
      </Sequence>

      <Grain opacity={0.05} vignette="rgba(0,0,0,0.7)" />
      <Audio name="Score" src={staticFile("audio/pale-dot.wav")} volume={0.42} />
      <Audio name="Voiceover" src={staticFile("audio/vo-pale-dot.wav")} />
    </AbsoluteFill>
  );
};
