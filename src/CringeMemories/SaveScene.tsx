import { Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, colors } from "./theme";

const cardStyle = {
  width: "100%",
  fontSize: 54,
  fontWeight: 800,
  lineHeight: 1.2,
  padding: "40px 46px",
  borderRadius: 32,
  backgroundColor: colors.card,
  position: "relative",
} as const;

const SaveSceneInner = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      <Interactive.Div
        name="Headline"
        style={{
          fontSize: 96,
          fontWeight: 800,
          textAlign: "center",
          lineHeight: 1.1,
          opacity: interpolate(frame, [0, 0.4 * fps], [0, 1], clamp),
        }}
      >
        Strong emotion = <span style={{ color: colors.amber }}>SAVE</span> button
      </Interactive.Div>
      <Interactive.Div
        name="Explanation"
        style={{
          fontSize: 50,
          fontWeight: 500,
          color: colors.muted,
          textAlign: "center",
          lineHeight: 1.25,
          margin: "40px 0 80px",
          opacity: interpolate(frame, [0.4 * fps, 0.8 * fps], [0, 1], clamp),
        }}
      >
        Stress hormones tell your memory center: keep this one.
      </Interactive.Div>
      <Interactive.Div
        name="Boring memory"
        style={{
          ...cardStyle,
          color: colors.muted,
          marginBottom: 50,
          opacity: interpolate(frame, [1 * fps, 1.3 * fps, 2.6 * fps, 3.6 * fps], [0, 1, 1, 0.15], clamp),
          filter: `blur(${interpolate(frame, [2.6 * fps, 3.6 * fps], [0, 8], clamp)}px)`,
        }}
      >
        What you ate last Tuesday
      </Interactive.Div>
      <Interactive.Div
        name="Cringe memory"
        style={{
          ...cardStyle,
          border: `4px solid ${colors.amber}`,
          boxShadow: `0 0 ${interpolate(frame, [2.6 * fps, 3.6 * fps], [0, 70], clamp)}px ${colors.amber}`,
          opacity: interpolate(frame, [1.4 * fps, 1.7 * fps], [0, 1], clamp),
        }}
      >
        Waving back at someone who was waving at the person behind you
        <Interactive.Div
          name="Saved stamp"
          style={{
            position: "absolute",
            right: -20,
            bottom: -50,
            fontSize: 44,
            fontWeight: 800,
            color: colors.bg,
            backgroundColor: colors.amber,
            padding: "10px 26px",
            borderRadius: 14,
            rotate: "-8deg",
            opacity: interpolate(frame, [3 * fps, 3.1 * fps], [0, 1], clamp),
            scale: interpolate(frame, [3 * fps, 3.4 * fps], [2.2, 1], {
              ...clamp,
              easing: Easing.bezier(0.34, 1.56, 0.64, 1),
              output: "perceptual-scale",
            }),
          }}
        >
          SAVED FOREVER
        </Interactive.Div>
      </Interactive.Div>
    </>
  );
};

export const SaveScene = Interactive.create({
  Component: SaveSceneInner,
  layout: "absolute-fill",
  schema: { ...Interactive.backgroundSchema },
});
