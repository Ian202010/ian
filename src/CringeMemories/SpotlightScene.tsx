import { Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, colors } from "./theme";

const Bar: React.FC<{ label: string; value: number; color: string; start: number }> = ({ label, value, color, start }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = interpolate(frame, [start * fps, (start + 0.8) * fps], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 300 }}>
      <div style={{ fontSize: 96, fontWeight: 800, color, opacity: progress }}>{Math.round(value * progress)}%</div>
      <div style={{ height: 460, width: 200, display: "flex", alignItems: "flex-end" }}>
        <div style={{ width: "100%", height: `${value * 2 * progress}%`, borderRadius: "24px 24px 0 0", backgroundColor: color }} />
      </div>
      <div style={{ fontSize: 48, fontWeight: 500, marginTop: 20 }}>{label}</div>
    </div>
  );
};

const SpotlightSceneInner = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      <Interactive.Div
        name="Good news"
        style={{
          fontSize: 56,
          fontWeight: 800,
          color: colors.bg,
          backgroundColor: colors.green,
          padding: "10px 40px",
          borderRadius: 20,
          opacity: interpolate(frame, [0, 0.3 * fps], [0, 1], clamp),
        }}
      >
        GOOD NEWS
      </Interactive.Div>
      <Interactive.Div
        name="Headline"
        style={{
          fontSize: 80,
          fontWeight: 800,
          textAlign: "center",
          lineHeight: 1.12,
          margin: "40px 0 50px",
          opacity: interpolate(frame, [0.2 * fps, 0.6 * fps], [0, 1], clamp),
        }}
      >
        People notice your mistakes <span style={{ color: colors.green }}>way less</span> than you think
      </Interactive.Div>
      <Interactive.Div name="Chart" style={{ display: "flex", gap: 60 }}>
        <Bar label="You guess" value={50} color={colors.pink} start={0.9} />
        <Bar label="Actually" value={23} color={colors.green} start={1.6} />
      </Interactive.Div>
      <Interactive.Div
        name="Source"
        style={{
          fontSize: 42,
          fontWeight: 500,
          color: colors.muted,
          marginTop: 20,
          opacity: interpolate(frame, [1.6 * fps, 2 * fps], [0, 1], clamp),
        }}
      >
        "Spotlight effect", Cornell study, 2000
      </Interactive.Div>
      <Interactive.Div
        name="CTA"
        style={{
          fontSize: 64,
          fontWeight: 800,
          color: colors.cyan,
          marginTop: 70,
          opacity: interpolate(frame, [5 * fps, 5.4 * fps], [0, 1], clamp),
          scale: interpolate(frame, [5 * fps, 5.6 * fps], [0.7, 1], {
            ...clamp,
            easing: Easing.spring({ damping: 11 }),
            output: "perceptual-scale",
          }),
        }}
      >
        What should I explain next?
      </Interactive.Div>
    </>
  );
};

export const SpotlightScene = Interactive.create({
  Component: SpotlightSceneInner,
  layout: "absolute-fill",
  schema: { ...Interactive.backgroundSchema },
});
