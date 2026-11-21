import { Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Rider } from "./Rider";
import { colors } from "./theme";

const Label = ({ text, color, delay, top, left }: { text: string; color: string; delay: number; top: number; left: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div
      style={{
        position: "absolute",
        top,
        left,
        fontSize: 44,
        fontWeight: 800,
        color: colors.bg,
        backgroundColor: color,
        padding: "12px 26px",
        borderRadius: 16,
        whiteSpace: "nowrap",
        opacity: interpolate(frame, [delay * fps, (delay + 0.3) * fps], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        scale: interpolate(frame, [delay * fps, (delay + 0.4) * fps], [0.6, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.spring({ damping: 12 }),
          output: "perceptual-scale",
        }),
      }}
    >
      {text}
    </div>
  );
};

const Diagram = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ position: "relative", width: 900, height: 820 }}>
      <div style={{ position: "absolute", left: 70, top: 120 }}>
        <Rider showSecret />
      </div>
      {/* the mirror panel: starts covering the lower half, then swings away */}
      <div
        style={{
          position: "absolute",
          left: 110,
          top: 560,
          width: 680,
          height: 220,
          borderRadius: 12,
          border: `6px solid ${colors.cyan}`,
          background: `linear-gradient(120deg, ${colors.bg} 0%, #22223a 45%, ${colors.bg} 55%, #181828 100%)`,
                    translate: interpolate(frame, [1.4 * fps, 2.3 * fps], ["0px 0px", "0px 260px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.65, 0, 0.35, 1),
          }),
          opacity: interpolate(frame, [1.6 * fps, 2.3 * fps], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />
      <Label text="🪞 Mirror hides the bottom" color={colors.cyan} delay={0.4} top={20} left={40} />
      <Label text="🛹 Skateboard" color={colors.pink} delay={2.4} top={730} left={420} />
      <Label text="🦵 Fake leg" color="#ffd166" delay={3} top={500} left={60} />
    </div>
  );
};

const SecretSceneInner = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      <Interactive.Div
        name="Title"
        style={{
          fontSize: 100,
          fontWeight: 800,
          color: colors.pink,
          marginBottom: 20,
          opacity: interpolate(frame, [0, 0.4 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        The secret
      </Interactive.Div>
      <Diagram />
      <Interactive.Div
        name="Explanation"
        style={{
          fontSize: 50,
          fontWeight: 500,
          textAlign: "center",
          marginTop: 20,
          opacity: interpolate(frame, [3.6 * fps, 4.2 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        The mirror reflects the floor, so the skateboard and his real leg vanish. He reveals it at the end of the clip.
      </Interactive.Div>
    </>
  );
};

export const SecretScene = Interactive.create({
  Component: SecretSceneInner,
  layout: "absolute-fill",
  schema: { ...Interactive.backgroundSchema },
});
