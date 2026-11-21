import { Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Rider } from "./Rider";
import { colors } from "./theme";

const FloatingRider = () => {
  const frame = useCurrentFrame();
  const bob = Math.sin(frame / 9) * 22;
  return (
    <div style={{ position: "relative", height: 760, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ translate: `0px ${bob}px` }}>
        <Rider showSecret={false} />
      </div>
      {/* ground shadow */}
      <div
        style={{
          width: 360,
          height: 40,
          borderRadius: "50%",
          backgroundColor: "rgba(0,0,0,0.55)",
          marginTop: 60,
          scale: `${1 - bob / 160}`,
        }}
      />
    </div>
  );
};

const IllusionSceneInner = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      <Interactive.Div
        name="Title"
        style={{
          fontSize: 92,
          fontWeight: 800,
          textAlign: "center",
          marginBottom: 40,
          opacity: interpolate(frame, [0, 0.4 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        He flies on a broom
      </Interactive.Div>
      <FloatingRider />
      <Interactive.Div
        name="Caption"
        style={{
          fontSize: 52,
          fontWeight: 500,
          color: colors.muted,
          textAlign: "center",
          marginTop: 40,
          opacity: interpolate(frame, [1.2 * fps, 1.8 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        Wizard-style, floating above the ground, in under 20 seconds
      </Interactive.Div>
    </>
  );
};

export const IllusionScene = Interactive.create({
  Component: IllusionSceneInner,
  layout: "absolute-fill",
  schema: { ...Interactive.backgroundSchema },
});
