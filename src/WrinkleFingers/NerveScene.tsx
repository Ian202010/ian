import { Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Finger } from "./Finger";
import { clamp, colors } from "./theme";

// Brain -> nerve signal -> fingertip. Signal pulses travel down the nerve,
// then blood vessels narrow and the skin folds.
const Diagram = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const travel = (frame - 0.8 * fps) / (0.9 * fps);
  const pulses = [0, 0.33, 0.66].map((offset) => travel - offset);
  const shrink = interpolate(frame, [2.4 * fps, 3.6 * fps], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.45, 0, 0.55, 1),
  });
  return (
    <div style={{ position: "relative", width: 700, height: 900 }}>
      <svg viewBox="0 0 700 900" width={700} height={900} style={{ position: "absolute", inset: 0 }}>
        {/* Brain */}
        <ellipse cx={350} cy={95} rx={190} ry={95} fill={colors.pink} />
        <text x={350} y={112} textAnchor="middle" fontSize={52} fontWeight={800} fill={colors.white}>BRAIN</text>
        <path
          d="M200 60 Q250 30 300 55 M400 55 Q450 30 500 60 M210 150 Q260 170 300 150 M400 150 Q440 170 490 150"
          stroke={colors.bg}
          strokeWidth={8}
          fill="none"
          strokeLinecap="round"
          opacity={0.5}
        />
        {/* Nerve */}
        <line x1={350} y1={175} x2={350} y2={470} stroke={colors.cyan} strokeWidth={10} strokeDasharray="4 18" strokeLinecap="round" />
        {pulses.map((p, i) =>
          p >= 0 && p <= 1 ? (
            <circle key={i} cx={350} cy={175 + p * 295} r={22} fill={colors.cyan} opacity={1 - p * 0.3} />
          ) : null,
        )}
        <text x={385} y={330} fontSize={40} fontWeight={500} fill={colors.cyan}>nerve signal</text>
        {/* Blood vessels beside the finger */}
        {[230, 470].map((x) => (
          <line
            key={x}
            x1={x}
            y1={560}
            x2={x}
            y2={880}
            stroke={colors.blood}
            strokeWidth={34 - shrink * 24}
            strokeLinecap="round"
          />
        ))}
      </svg>
      <div style={{ position: "absolute", left: 210, top: 470 }}>
        <Finger wrinkle={shrink} width={280} />
      </div>
    </div>
  );
};

const NerveSceneInner = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      <Interactive.Div
        name="Headline"
        style={{
          fontSize: 88,
          fontWeight: 800,
          textAlign: "center",
          lineHeight: 1.1,
          opacity: interpolate(frame, [0, 0.4 * fps], [0, 1], clamp),
        }}
      >
        It's your <span style={{ color: colors.cyan }}>nervous system</span>
      </Interactive.Div>
      <Interactive.Div name="Diagram" style={{ marginTop: 20, scale: 0.85 }}>
        <Diagram />
      </Interactive.Div>
      <Interactive.Div
        name="Caption"
        style={{
          fontSize: 54,
          fontWeight: 500,
          textAlign: "center",
          lineHeight: 1.25,
          opacity: interpolate(frame, [2.4 * fps, 2.9 * fps], [0, 1], clamp),
        }}
      >
        After ~5 min in water, nerves tell your blood vessels to{" "}
        <span style={{ color: colors.blood, fontWeight: 800 }}>shrink</span>, so the skin folds in.
      </Interactive.Div>
    </>
  );
};

export const NerveScene = Interactive.create({
  Component: NerveSceneInner,
  layout: "absolute-fill",
  schema: { ...Interactive.backgroundSchema },
});
