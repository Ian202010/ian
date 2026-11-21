import { Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, colors } from "./theme";

const ProofSceneInner = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      <Interactive.Div
        name="Proof label"
        style={{
          fontSize: 60,
          fontWeight: 800,
          color: colors.bg,
          backgroundColor: colors.cyan,
          padding: "10px 40px",
          borderRadius: 20,
          marginBottom: 50,
          opacity: interpolate(frame, [0, 0.3 * fps], [0, 1], clamp),
        }}
      >
        PROOF
      </Interactive.Div>
      <Interactive.Div
        name="Proof text"
        style={{
          fontSize: 84,
          fontWeight: 800,
          textAlign: "center",
          lineHeight: 1.15,
          opacity: interpolate(frame, [0.2 * fps, 0.7 * fps], [0, 1], clamp),
          translate: interpolate(frame, [0.2 * fps, 0.7 * fps], ["0px 40px", "0px 0px"], {
            ...clamp,
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        If the nerve to a finger is cut, that finger <span style={{ color: colors.pink }}>never wrinkles</span>.
      </Interactive.Div>
      <Interactive.Div
        name="CTA"
        style={{
          fontSize: 64,
          fontWeight: 800,
          textAlign: "center",
          marginTop: 140,
          color: colors.cyan,
          opacity: interpolate(frame, [3.6 * fps, 4 * fps], [0, 1], clamp),
          scale: interpolate(frame, [3.6 * fps, 4.2 * fps], [0.7, 1], {
            ...clamp,
            easing: Easing.spring({ damping: 11 }),
            output: "perceptual-scale",
          }),
        }}
      >
        What should I explain next?
      </Interactive.Div>
      <Interactive.Div
        name="CTA sub"
        style={{
          fontSize: 48,
          fontWeight: 500,
          color: colors.muted,
          marginTop: 20,
          opacity: interpolate(frame, [4.2 * fps, 4.6 * fps], [0, 1], clamp),
        }}
      >
        Comment below
      </Interactive.Div>
    </>
  );
};

export const ProofScene = Interactive.create({
  Component: ProofSceneInner,
  layout: "absolute-fill",
  schema: { ...Interactive.backgroundSchema },
});
