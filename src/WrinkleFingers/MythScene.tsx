import { Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, colors } from "./theme";

const StrikeBar: React.FC<{ name: string; angle: string; start: number }> = ({ name, angle, start }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Interactive.Div
      name={name}
      style={{
        position: "absolute",
        left: "2%",
        width: "96%",
        top: "50%",
        height: 18,
        marginTop: -9,
        borderRadius: 9,
        backgroundColor: colors.pink,
        rotate: angle,
        transformOrigin: "center center",
        scale: `${interpolate(frame, [start * fps, (start + 0.3) * fps], [0, 1], {
          ...clamp,
          easing: Easing.bezier(0.65, 0, 0.35, 1),
        })} 1`,
      }}
    />
  );
};

const MythSceneInner = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      <Interactive.Div
        name="Kicker"
        style={{
          fontSize: 56,
          fontWeight: 500,
          color: colors.muted,
          letterSpacing: 6,
          textTransform: "uppercase",
          marginBottom: 50,
          opacity: interpolate(frame, [0, 0.4 * fps], [0, 1], clamp),
        }}
      >
        Most people think
      </Interactive.Div>
      <div style={{ position: "relative" }}>
        <Interactive.Div
          name="Myth"
          style={{
            fontSize: 96,
            fontWeight: 800,
            textAlign: "center",
            lineHeight: 1.15,
            padding: "30px 40px",
            borderRadius: 32,
            backgroundColor: colors.card,
            opacity: interpolate(frame, [0.3 * fps, 0.8 * fps], [0, 1], clamp),
            translate: interpolate(frame, [0.3 * fps, 0.8 * fps], ["0px 50px", "0px 0px"], {
              ...clamp,
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        >
          skin soaks up water and swells
        </Interactive.Div>
        <StrikeBar name="Strike 1" angle="-14deg" start={2.1} />
        <StrikeBar name="Strike 2" angle="14deg" start={2.4} />
      </div>
      <Interactive.Div
        name="Verdict"
        style={{
          fontSize: 140,
          fontWeight: 800,
          color: colors.pink,
          marginTop: 80,
          opacity: interpolate(frame, [2.7 * fps, 3 * fps], [0, 1], clamp),
          scale: interpolate(frame, [2.7 * fps, 3.3 * fps], [0.5, 1], {
            ...clamp,
            easing: Easing.spring({ damping: 10 }),
            output: "perceptual-scale",
          }),
        }}
      >
        WRONG.
      </Interactive.Div>
    </>
  );
};

export const MythScene = Interactive.create({
  Component: MythSceneInner,
  layout: "absolute-fill",
  schema: { ...Interactive.backgroundSchema },
});
