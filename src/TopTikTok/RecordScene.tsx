import { Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { colors } from "./theme";

const RecordSceneInner = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      <Interactive.Div
        name="Trophy"
        style={{
          fontSize: 260,
          scale: interpolate(frame, [0, 0.6 * fps], [0.3, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.spring({ damping: 10 }),
            output: "perceptual-scale",
          }),
        }}
      >
        🏆
      </Interactive.Div>
      <Interactive.Div
        name="Record title"
        style={{
          fontSize: 92,
          fontWeight: 800,
          textAlign: "center",
          opacity: interpolate(frame, [0.4 * fps, 0.9 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        Guinness World Record
      </Interactive.Div>
      <Interactive.Div
        name="Record detail"
        style={{
          fontSize: 52,
          fontWeight: 500,
          color: colors.muted,
          textAlign: "center",
          marginTop: 24,
          opacity: interpolate(frame, [0.9 * fps, 1.4 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        Most viewed TikTok (2.2B views, Dec 2022). Today trackers count over 2.3 billion.
      </Interactive.Div>
      <Interactive.Div
        name="Outro"
        style={{
          fontSize: 72,
          fontWeight: 800,
          color: colors.cyan,
          textAlign: "center",
          marginTop: 90,
          opacity: interpolate(frame, [2.2 * fps, 2.8 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        Simple trick. Huge magic. ✨
      </Interactive.Div>
    </>
  );
};

export const RecordScene = Interactive.create({
  Component: RecordSceneInner,
  layout: "absolute-fill",
  schema: { ...Interactive.backgroundSchema },
});
