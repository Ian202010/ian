import { Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, colors } from "./theme";

const ReplayLoop = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const replays = Math.max(1, Math.min(47, Math.floor(interpolate(frame, [0.8 * fps, 3.6 * fps], [1, 47], {
    ...clamp,
    easing: Easing.in(Easing.quad),
  }))));
  return (
    <div style={{ position: "relative", width: 520, height: 520, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg
        viewBox="0 0 520 520"
        width={520}
        height={520}
        style={{ position: "absolute", inset: 0, rotate: `${frame * 8}deg` }}
      >
        <circle cx={260} cy={260} r={220} fill="none" stroke={colors.purple} strokeWidth={26} strokeDasharray="1100 300" strokeLinecap="round" />
        <polygon points="420,70 500,110 430,160" fill={colors.purple} />
      </svg>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 56, fontWeight: 500, color: colors.muted }}>Replay</div>
        <div style={{ fontSize: 170, fontWeight: 800, lineHeight: 1 }}>#{replays}</div>
      </div>
    </div>
  );
};

const StrengthBar = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ width: 860 }}>
      <div style={{ fontSize: 46, fontWeight: 500, color: colors.muted, marginBottom: 16 }}>Memory strength</div>
      <div style={{ height: 50, borderRadius: 25, backgroundColor: colors.card, overflow: "hidden" }}>
        <Interactive.Div
          name="Strength fill"
          style={{
            height: "100%",
            borderRadius: 25,
            background: `linear-gradient(90deg, ${colors.purple}, ${colors.pink})`,
            width: `${interpolate(frame, [0.8 * fps, 3.6 * fps], [20, 100], {
              ...clamp,
              easing: Easing.in(Easing.quad),
            })}%`,
          }}
        />
      </div>
    </div>
  );
};

const ReplaySceneInner = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      <Interactive.Div
        name="Headline"
        style={{
          fontSize: 92,
          fontWeight: 800,
          textAlign: "center",
          lineHeight: 1.1,
          marginBottom: 60,
          opacity: interpolate(frame, [0, 0.4 * fps], [0, 1], clamp),
        }}
      >
        And every replay makes it <span style={{ color: colors.purple }}>stronger</span>
      </Interactive.Div>
      <ReplayLoop />
      <Interactive.Div name="Strength bar" style={{ marginTop: 70 }}>
        <StrengthBar />
      </Interactive.Div>
      <Interactive.Div
        name="Punchline"
        style={{
          fontSize: 58,
          fontWeight: 800,
          textAlign: "center",
          marginTop: 70,
          opacity: interpolate(frame, [2.6 * fps, 3 * fps], [0, 1], clamp),
        }}
      >
        That 3 AM cringe? You're <span style={{ color: colors.pink, whiteSpace: "nowrap" }}>re-saving</span> it.
      </Interactive.Div>
    </>
  );
};

export const ReplayScene = Interactive.create({
  Component: ReplaySceneInner,
  layout: "absolute-fill",
  schema: { ...Interactive.backgroundSchema },
});
