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
import { Grain, Reveal, sans, serif, WordByWord } from "./kit";

// "Not Late" — five people who hadn't done the thing they're famous for at 30.
// Sources (ages at the event):
//  Toni Morrison, b. Feb 1931 — The Bluest Eye, 1970 → 39
//  Vera Wang, b. Jun 1949 — left Ralph Lauren to become a bridal designer, 1989/90 → 40
//  Julia Child, b. Aug 1912 — Mastering the Art of French Cooking, Oct 1961 → 49
//  Raymond Chandler, b. Jul 1888 — The Big Sleep, Feb 1939 → 50
//  Laura Ingalls Wilder, b. Feb 1867 — Little House in the Big Woods, 1932 → 65

export const NL = {
  paper: "#f2e9d8",
  ink: "#1f1b16",
  red: "#d9452b",
  muted: "#8b7f6e",
  line: "#cbbfa9",
};

const MIN_AGE = 20;
const MAX_AGE = 70;
const RULER_Y = 1180;
const RULER_X0 = 110;
const RULER_W = 830;
const ageX = (age: number) => RULER_X0 + ((age - MIN_AGE) / (MAX_AGE - MIN_AGE)) * RULER_W;

const PEOPLE = [
  { initials: "TM", age: 39, at: 3.4 },
  { initials: "VW", age: 40, at: 6.0 },
  { initials: "JC", age: 49, at: 8.6 },
  { initials: "RC", age: 50, at: 11.2 },
  { initials: "LW", age: 65, at: 13.8 },
];

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.bezier(0.65, 0, 0.35, 1);

/** The age ruler + the red needle that travels to each person's age. */
const Ruler = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  // Needle: sits at 30, visits each age, then comes home to 30 (loop seam).
  const stops = [0, ...PEOPLE.map((p) => p.at), 16.6];
  const ages = [30, ...PEOPLE.map((p) => p.age), 30];
  let needleAge = ages[0];
  for (let i = 1; i < stops.length; i++) {
    if (t >= stops[i]) {
      needleAge = interpolate(t, [stops[i], stops[i] + 0.6], [ages[i - 1], ages[i]], { ...clamp, easing: ease });
    }
  }
  const nx = ageX(needleAge);
  const drawIn = interpolate(t, [0, 0.5], [0, 1], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) });

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* axis */}
      <div
        style={{
          position: "absolute",
          top: RULER_Y,
          left: RULER_X0,
          height: 6,
          borderRadius: 3,
          width: RULER_W * drawIn,
          backgroundColor: NL.ink,
        }}
      />
      {Array.from({ length: 11 }).map((_, i) => {
        const age = MIN_AGE + i * 5;
        const show = interpolate(t, [0.05 * i, 0.05 * i + 0.3], [0, 1], clamp);
        return (
          <div key={age} style={{ position: "absolute", left: ageX(age) - 40, top: RULER_Y + 22, width: 80, textAlign: "center", opacity: show }}>
            <div style={{ width: 4, height: i % 2 === 0 ? 30 : 18, backgroundColor: NL.ink, margin: "0 auto", marginTop: -22 }} />
            {i % 2 === 0 ? (
              <div style={{ fontFamily: sans, fontWeight: 600, fontSize: 34, color: NL.muted, marginTop: 8 }}>{age}</div>
            ) : null}
          </div>
        );
      })}

      {/* pins for everyone revealed so far */}
      {PEOPLE.map((p, i) => {
        const pin = interpolate(t, [p.at + 0.55, p.at + 0.85], [0, 1], { ...clamp, easing: Easing.spring({ damping: 10 }) });
        // stagger heights so close ages (39/40, 49/50) don't collide
        const lift = 96 + (i % 2) * 92;
        return (
          <div key={p.initials} style={{ position: "absolute", left: ageX(p.age), top: RULER_Y, opacity: Math.min(1, pin * 2) }}>
            <div style={{ position: "absolute", left: -2, top: -lift, width: 4, height: lift * Math.min(1, pin), backgroundColor: NL.ink, translate: `0px ${lift * (1 - Math.min(1, pin))}px` }} />
            <div
              style={{
                position: "absolute",
                left: -42,
                top: -lift - 84,
                width: 84,
                height: 84,
                borderRadius: 42,
                backgroundColor: NL.ink,
                color: NL.paper,
                fontFamily: serif,
                fontWeight: 600,
                fontSize: 34,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                scale: String(pin),
              }}
            >
              {p.initials}
            </div>
            <div style={{ position: "absolute", left: -9, top: -6, width: 18, height: 18, borderRadius: 9, backgroundColor: NL.ink }} />
          </div>
        );
      })}

      {/* the needle: "you" */}
      <div style={{ position: "absolute", left: nx, top: RULER_Y + 3, opacity: drawIn }}>
        <div style={{ position: "absolute", left: -3, top: -282, width: 6, height: 284, backgroundColor: NL.red, borderRadius: 3 }} />
        <div
          style={{
            position: "absolute",
            left: -58,
            top: -340,
            width: 116,
            height: 58,
            borderRadius: 29,
            backgroundColor: NL.red,
            color: NL.paper,
            fontFamily: sans,
            fontWeight: 800,
            fontSize: 30,
            letterSpacing: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          YOU
        </div>
        <div
          style={{
            position: "absolute",
            left: -60,
            top: 96,
            width: 120,
            textAlign: "center",
            fontFamily: serif,
            fontWeight: 800,
            fontSize: 56,
            color: NL.red,
          }}
        >
          {Math.round(needleAge)}
        </div>
      </div>
    </div>
  );
};

const PersonBeat: React.FC<{ index: number; name: string; did: string; age: number }> = ({ index, name, did, age }) => (
  <AbsoluteFill style={{ top: 210, left: 90, right: 140, bottom: "auto", alignItems: "flex-start" }}>
    <Reveal at={0} out={2.3} style={{ fontFamily: sans, fontWeight: 600, fontSize: 40, color: NL.muted }}>
      {index} / 5
    </Reveal>
    <Reveal at={0.05} out={2.3} style={{ fontFamily: serif, fontWeight: 600, fontSize: 96, color: NL.ink, lineHeight: 1.05 }}>
      {name}
    </Reveal>
    <Reveal at={0.2} out={2.3} style={{ fontFamily: sans, fontWeight: 600, fontSize: 48, color: NL.ink, marginTop: 14, maxWidth: 820 }}>
      {did}
    </Reveal>
    <Reveal at={0.5} out={2.3} rise={80} style={{ display: "flex", alignItems: "baseline", gap: 24, marginTop: 10 }}>
      <span style={{ fontFamily: serif, fontStyle: "italic", fontSize: 90, color: NL.red }}>at</span>
      <span style={{ fontFamily: serif, fontWeight: 800, fontSize: 300, color: NL.red, lineHeight: 1 }}>{age}</span>
    </Reveal>
  </AbsoluteFill>
);

const Top: React.FC<{ children: React.ReactNode; top?: number }> = ({ children, top = 210 }) => (
  <AbsoluteFill style={{ top, left: 90, right: 140, bottom: "auto", alignItems: "flex-start" }}>{children}</AbsoluteFill>
);

export const NotLate = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: NL.paper }}>
      <Ruler />

      <Sequence name="Hook" durationInFrames={3.4 * fps}>
        <Top top={260}>
          <Reveal at={-0.45} out={3.1} style={{ fontFamily: serif, fontWeight: 800, fontSize: 150, color: NL.red, lineHeight: 1 }}>
            At 30,
          </Reveal>
          <WordByWord
            at={-0.35}
            perWord={0.05}
            text="none of these people had done what they're famous for."
            style={{ fontFamily: serif, fontWeight: 600, fontSize: 80, color: NL.ink, lineHeight: 1.1, maxWidth: 840, marginTop: 10 }}
          />
        </Top>
      </Sequence>

      <Sequence name="Toni Morrison" from={3.4 * fps} durationInFrames={2.6 * fps}>
        <PersonBeat index={1} name="Toni Morrison" did="published her first novel" age={39} />
      </Sequence>
      <Sequence name="Vera Wang" from={6.0 * fps} durationInFrames={2.6 * fps}>
        <PersonBeat index={2} name="Vera Wang" did="became a fashion designer" age={40} />
      </Sequence>
      <Sequence name="Julia Child" from={8.6 * fps} durationInFrames={2.6 * fps}>
        <PersonBeat index={3} name="Julia Child" did="published her first cookbook" age={49} />
      </Sequence>
      <Sequence name="Raymond Chandler" from={11.2 * fps} durationInFrames={2.6 * fps}>
        <PersonBeat index={4} name="Raymond Chandler" did="published his first novel" age={50} />
      </Sequence>
      <Sequence name="Laura Ingalls Wilder" from={13.8 * fps} durationInFrames={2.8 * fps}>
        <PersonBeat index={5} name="Laura Ingalls Wilder" did="published Little House in the Big Woods" age={65} />
      </Sequence>

      <Sequence name="Never real" from={16.6 * fps} durationInFrames={4.2 * fps}>
        <Top top={260}>
          <WordByWord
            at={0.2}
            text="The deadline you're racing was never real."
            style={{ fontFamily: serif, fontWeight: 600, fontSize: 96, color: NL.ink, lineHeight: 1.08, maxWidth: 840 }}
            highlight={{ never: { color: NL.red, fontStyle: "italic" } }}
          />
        </Top>
      </Sequence>

      <Sequence name="Not late" from={20.8 * fps} durationInFrames={4 * fps}>
        <Top top={260}>
          <Reveal at={0} out={3.7} style={{ fontFamily: serif, fontWeight: 600, fontSize: 120, color: NL.ink, lineHeight: 1 }}>
            You&apos;re not late.
          </Reveal>
          <Reveal at={1.1} out={3.7} rise={60} style={{ fontFamily: serif, fontStyle: "italic", fontWeight: 600, fontSize: 150, color: NL.red, lineHeight: 1.1 }}>
            You&apos;re early.
          </Reveal>
        </Top>
      </Sequence>

      <Sequence name="CTA" from={24.8 * fps} durationInFrames={5.2 * fps}>
        <Top top={260}>
          <Reveal at={0} style={{ fontFamily: sans, fontWeight: 600, fontSize: 44, color: NL.muted }}>
            Drop it in the comments:
          </Reveal>
          <WordByWord
            at={0.3}
            text="your age + the thing you're finally starting."
            style={{ fontFamily: serif, fontWeight: 600, fontSize: 86, color: NL.ink, lineHeight: 1.1, maxWidth: 840 }}
          />
          <Underline at={1.4} />
        </Top>
      </Sequence>

      <Grain opacity={0.14} vignette="rgba(90,60,20,0.18)" />
      <Audio name="Score" src={staticFile("audio/not-late.wav")} />
    </AbsoluteFill>
  );
};

const Underline: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const len = 760;
  return (
    <svg width={800} height={60} style={{ marginTop: 8 }}>
      <path
        d="M10 40 C 200 10, 420 55, 790 22"
        stroke={NL.red}
        strokeWidth={10}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={len + 60}
        strokeDashoffset={interpolate(frame, [at * fps, (at + 0.7) * fps], [len + 60, 0], {
          ...clamp,
          easing: Easing.bezier(0.33, 1, 0.68, 1),
        })}
      />
    </svg>
  );
};
