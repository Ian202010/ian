import { Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { colors } from "./theme";

const Counter = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const value = interpolate(frame, [0.6 * fps, 2.6 * fps], [0, 2.2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  return (
    <Interactive.Div
      name="View counter"
      style={{
        fontSize: 260,
        fontWeight: 800,
        lineHeight: 1,
        color: colors.white,
        textShadow: `6px 6px 0 ${colors.pink}, -6px -6px 0 ${colors.cyan}`,
        scale: interpolate(frame, [0.4 * fps, 1.2 * fps], [0.6, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.spring({ damping: 12 }),
          output: "perceptual-scale",
        }),
      }}
    >
      {value.toFixed(1)}B
    </Interactive.Div>
  );
};

const HookSceneInner = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      <Interactive.Div
        name="Kicker"
        style={{
          fontSize: 56,
          fontWeight: 500,
          color: colors.cyan,
          letterSpacing: 6,
          textTransform: "uppercase",
          opacity: interpolate(frame, [0, 0.5 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        The most viewed
      </Interactive.Div>
      <Interactive.Div
        name="Headline"
        style={{
          fontSize: 120,
          fontWeight: 800,
          marginBottom: 80,
          opacity: interpolate(frame, [0.2 * fps, 0.7 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          translate: interpolate(frame, [0.2 * fps, 0.7 * fps], ["0px 40px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        TikTok ever
      </Interactive.Div>
      <Counter />
      <Interactive.Div
        name="Views label"
        style={{
          fontSize: 64,
          fontWeight: 500,
          color: colors.muted,
          marginTop: 30,
          opacity: interpolate(frame, [2.4 * fps, 3 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        views… and counting
      </Interactive.Div>
    </>
  );
};

export const HookScene = Interactive.create({
  Component: HookSceneInner,
  layout: "absolute-fill",
  schema: { ...Interactive.backgroundSchema },
});
