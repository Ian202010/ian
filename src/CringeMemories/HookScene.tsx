import { Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, colors } from "./theme";

const Clock = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Blinking colon, like a bedside alarm clock.
  const colonOn = Math.floor(frame / (fps / 2)) % 2 === 0;
  return (
    <Interactive.Div
      name="Clock"
      style={{
        fontSize: 220,
        fontWeight: 800,
        color: colors.pink,
        letterSpacing: 4,
        textShadow: `0 0 50px ${colors.pink}`,
        opacity: interpolate(frame, [0, 0.4 * fps], [0, 1], clamp),
      }}
    >
      3<span style={{ opacity: colonOn ? 1 : 0.2 }}>:</span>07
      <span style={{ fontSize: 90, marginLeft: 20 }}>AM</span>
    </Interactive.Div>
  );
};

const HookSceneInner = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      <Clock />
      <Interactive.Div
        name="Speaker"
        style={{
          fontSize: 60,
          fontWeight: 500,
          color: colors.muted,
          marginTop: 90,
          alignSelf: "flex-start",
          opacity: interpolate(frame, [0.7 * fps, 1 * fps], [0, 1], clamp),
        }}
      >
        Your brain:
      </Interactive.Div>
      <Interactive.Div
        name="Speech bubble"
        style={{
          fontSize: 80,
          fontWeight: 800,
          lineHeight: 1.15,
          marginTop: 20,
          padding: "40px 50px",
          borderRadius: "48px 48px 48px 8px",
          backgroundColor: colors.card,
          border: `4px solid ${colors.cyan}`,
          opacity: interpolate(frame, [0.9 * fps, 1.2 * fps], [0, 1], clamp),
          scale: interpolate(frame, [0.9 * fps, 1.5 * fps], [0.6, 1], {
            ...clamp,
            easing: Easing.spring({ damping: 12 }),
            output: "perceptual-scale",
          }),
          transformOrigin: "left bottom",
        }}
      >
        "Remember that thing you said in <span style={{ color: colors.cyan }}>2014</span>?"
      </Interactive.Div>
    </>
  );
};

export const HookScene = Interactive.create({
  Component: HookSceneInner,
  layout: "absolute-fill",
  schema: { ...Interactive.backgroundSchema },
});
