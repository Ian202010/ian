import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Counter, Grain, Reveal, sans, serif, WordByWord } from "./kit";

// "95%" — the tail end of time with your parents.
// Math (shown on screen): 18 yrs x 365 = 6,570 days at home.
// After moving out: ~10 days/yr for ~32 yrs (parents ~30 yrs older, living to ~80) = 320 days.
// 6,570 / 6,890 = 95.4%.

export const TWP = {
  bg: "#140e0b",
  amber: "#ffb04a",
  used: "#3a2b22",
  cream: "#f6eadb",
  muted: "#b9a796",
};

const GRID_TOP = 650;
const CELL = 64;
const GAP = 14;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 100 squares = every in-person day you'll ever spend with your parents. */
const LifeGrid = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  // Hook: 95 squares burn out, accelerating.
  const burned = 95 * Math.pow(interpolate(t, [0.35, 2.8], [0, 1], clamp), 2);

  const opacity =
    t < 5
      ? interpolate(t, [3.3, 3.7], [1, 0], clamp)
      : interpolate(t, [11.0, 11.5], [0, 1], clamp);

  return (
    <div
      style={{
        position: "absolute",
        top: GRID_TOP,
        left: (1080 - (10 * CELL + 9 * GAP)) / 2,
        width: 10 * CELL + 9 * GAP,
        display: "grid",
        gridTemplateColumns: `repeat(10, ${CELL}px)`,
        gap: GAP,
        opacity,
        scale: interpolate(t, [11.0, 11.6], [0.94, 1], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) }),
      }}
    >
      {Array.from({ length: 100 }).map((_, i) => {
        let lit: number;
        let flash = 0;
        if (t < 3.6) {
          lit = i >= burned ? 1 : 0;
          flash = i < burned ? Math.max(0, 1 - (burned - i) / 3) : 0;
        } else {
          lit = i >= 95 ? 1 : 0;
          // "Visit twice as often" — five more come back.
          if (i >= 90 && i < 95) lit = interpolate(t, [21.2 + (94 - i) * 0.12, 21.5 + (94 - i) * 0.12], [0, 1], clamp);
          // Finale: everything relights (and the last frame matches the first -> seamless loop).
          if (i < 90) lit = interpolate(t, [25.0 + (89 - i) * 0.028, 25.25 + (89 - i) * 0.028], [0, 1], clamp);
        }
        const pulse = t > 11.5 && i >= 95 && t < 25 ? 0.5 + 0.5 * Math.sin((t - 11.5) * 4 + i) : 0;
        return (
          <div
            key={i}
            style={{
              width: CELL,
              height: CELL,
              borderRadius: 12,
              backgroundColor: lit > 0.5 ? TWP.amber : flash > 0 ? "#fff3e0" : TWP.used,
              opacity: lit > 0.5 ? 1 : 0.55 + flash * 0.45 + lit * 0.45,
              boxShadow:
                lit > 0.5 ? `0 0 ${18 + pulse * 26}px rgba(255,176,74,${0.45 + pulse * 0.35})` : "none",
              scale: String(1 - flash * 0.12 + lit * 0),
            }}
          />
        );
      })}
    </div>
  );
};

const Bar: React.FC<{ width: number; at: number; dur: number; color: string }> = ({ width, at, dur, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div
      style={{
        height: 84,
        flexShrink: 0,
        borderRadius: 14,
        backgroundColor: color,
        boxShadow: `0 0 30px ${color}66`,
        width: interpolate(frame, [at * fps, (at + dur) * fps], [0, width], {
          ...clamp,
          easing: Easing.bezier(0.33, 1, 0.68, 1),
        }),
      }}
    />
  );
};

const text = {
  kicker: { fontFamily: sans, fontSize: 46, fontWeight: 600, color: TWP.muted },
  line: { fontFamily: serif, fontSize: 74, fontWeight: 600, color: TWP.cream, lineHeight: 1.1 },
  body: { fontFamily: sans, fontSize: 50, fontWeight: 600, color: TWP.cream, lineHeight: 1.25 },
} as const;

const Top: React.FC<{ children: React.ReactNode; top?: number }> = ({ children, top = 190 }) => (
  <AbsoluteFill style={{ top, left: 90, right: 140, bottom: "auto", alignItems: "flex-start" }}>
    {children}
  </AbsoluteFill>
);

export const TimeWithParents = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: TWP.bg }}>
      <LifeGrid />

      <Sequence name="Hook" durationInFrames={3.6 * fps}>
        <Top>
          <Reveal at={-0.45} out={3.3} style={text.kicker}>
            By the time you&apos;re 18,
          </Reveal>
          <Reveal at={-0.45} out={3.3} style={text.line}>
            you&apos;ve already spent
          </Reveal>
          <Reveal
            at={-0.45}
            out={3.3}
            style={{ fontFamily: serif, fontWeight: 800, fontSize: 200, lineHeight: 1, color: TWP.amber }}
          >
            ~95%
          </Reveal>
          <Reveal at={-0.45} out={3.3} style={{ ...text.body, fontSize: 44, maxWidth: 820 }}>
            of all the time you&apos;ll ever spend with your parents.
          </Reveal>
        </Top>
      </Sequence>

      <Sequence name="The math" from={3.6 * fps} durationInFrames={7.6 * fps}>
        <Top top={240}>
          <Reveal at={0.1} out={7.2} style={text.kicker}>
            Here&apos;s the math.
          </Reveal>
          <WordByWord at={0.4} text="Until 18, you see them almost every day." style={{ ...text.line, maxWidth: 820 }} />
          <Reveal at={0.6} out={7.2} style={{ marginTop: 70, width: 860 }}>
            <div style={{ ...text.body, fontSize: 40, color: TWP.muted }}>18 years × 365</div>
            <div style={{ fontFamily: serif, fontWeight: 800, fontSize: 104, color: TWP.amber, lineHeight: 1.1 }}>
              <Counter from={0} to={6570} start={0.6} end={2.6} suffix=" days" />
            </div>
            <Bar width={860} at={0.6} dur={2} color={TWP.amber} />
          </Reveal>
          <Reveal at={3.4} out={7.2} style={{ marginTop: 90, width: 860 }}>
            <div style={{ ...text.line, fontSize: 66 }}>After you move out?</div>
            <div style={{ ...text.body, fontSize: 42, color: TWP.muted, marginTop: 6 }}>
              Maybe 10 days a year × 32 years
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 24, marginTop: 14 }}>
              <Bar width={42} at={4.4} dur={0.8} color="#ffe2b8" />
              <div style={{ fontFamily: serif, fontWeight: 800, fontSize: 92, color: "#ffe2b8" }}>
                <Counter from={0} to={320} start={4.4} end={5.4} suffix=" days" />
              </div>
            </div>
          </Reveal>
          <Reveal at={1.2} out={7.2} style={{ marginTop: 60, fontFamily: sans, fontSize: 30, color: "#8a7867", maxWidth: 820 }}>
            Assumes parents ~30 years older, living to ~80. Your numbers will differ.
          </Reveal>
        </Top>
      </Sequence>

      <Sequence name="The last 5%" from={11.2 * fps} durationInFrames={4.2 * fps}>
        <Top>
          <Reveal at={0} out={3.9} style={text.kicker}>
            6,570 + 320 days. Add it up:
          </Reveal>
          <WordByWord
            at={0.35}
            text="You're already living in the last 5%."
            style={{ ...text.line, fontSize: 84, maxWidth: 840 }}
            highlight={{ "5%.": { color: TWP.amber } }}
          />
        </Top>
        <Reveal at={1.2} out={3.9}>
          <div style={{ position: "absolute", top: 1440, right: 140, ...text.body, fontSize: 40, color: TWP.amber }}>
            ↑ what&apos;s left
          </div>
        </Reveal>
      </Sequence>

      <Sequence name="Less than a year" from={15.4 * fps} durationInFrames={4 * fps}>
        <Top>
          <Reveal at={0} out={3.7} style={{ fontFamily: serif, fontWeight: 800, fontSize: 150, color: TWP.amber, lineHeight: 1 }}>
            320 days.
          </Reveal>
          <WordByWord
            at={0.6}
            text="Less than one year, spread across the rest of their lives."
            style={{ ...text.body, fontSize: 54, maxWidth: 820, marginTop: 20 }}
          />
        </Top>
      </Sequence>

      <Sequence name="Good news" from={19.4 * fps} durationInFrames={4.2 * fps}>
        <Top>
          <Reveal at={0} out={3.9} style={text.kicker}>
            The good news?
          </Reveal>
          <Reveal at={0.5} out={3.9} style={{ ...text.line, fontSize: 80 }}>
            The last 5% isn&apos;t fixed.
          </Reveal>
          <WordByWord
            at={1.5}
            text="Visit twice as often and it doubles."
            style={{ ...text.body, fontSize: 52, color: TWP.amber, marginTop: 18, maxWidth: 820 }}
          />
        </Top>
      </Sequence>

      <Sequence name="Call them" from={23.6 * fps} durationInFrames={5.4 * fps}>
        <Top top={230}>
          <Reveal at={0} rise={60} style={{ fontFamily: serif, fontStyle: "italic", fontWeight: 600, fontSize: 180, color: TWP.cream, lineHeight: 1 }}>
            Call them.
          </Reveal>
          <Reveal at={2.6} style={{ ...text.body, fontSize: 40, color: TWP.muted, marginTop: 40 }}>
            (and send this to someone who should, too)
          </Reveal>
        </Top>
      </Sequence>

      <Grain vignette="rgba(0,0,0,0.6)" />
      <Audio name="Score" src={staticFile("audio/time-with-parents.wav")} volume={0.42} />
      <Audio name="Voiceover" src={staticFile("audio/vo-time-with-parents.wav")} />
    </AbsoluteFill>
  );
};
