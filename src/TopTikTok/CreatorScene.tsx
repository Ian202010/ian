import { Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { colors } from "./theme";

const Fact = ({ label, value, delay }: { label: string; value: string; delay: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div
      style={{
        width: "100%",
        backgroundColor: colors.card,
        borderLeft: `12px solid ${colors.cyan}`,
        borderRadius: 24,
        padding: "36px 44px",
        marginTop: 36,
        opacity: interpolate(frame, [delay * fps, (delay + 0.4) * fps], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        translate: interpolate(frame, [delay * fps, (delay + 0.5) * fps], ["-80px 0px", "0px 0px"], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
      }}
    >
      <div style={{ fontSize: 44, color: colors.muted, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 68, fontWeight: 800 }}>{value}</div>
    </div>
  );
};

const CreatorSceneInner = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      <Interactive.Div
        name="Question"
        style={{
          fontSize: 96,
          fontWeight: 800,
          alignSelf: "flex-start",
          marginBottom: 30,
          opacity: interpolate(frame, [0, 0.4 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        Who made it?
      </Interactive.Div>
      <Fact label="Creator" value="Zach King" delay={0.5} />
      <Fact label="Known as" value="The digital magician" delay={1.1} />
      <Fact label="Video" value={"“Magic Broomstick”"} delay={1.7} />
      <Fact label="Posted" value="December 9, 2019" delay={2.3} />
    </>
  );
};

export const CreatorScene = Interactive.create({
  Component: CreatorSceneInner,
  layout: "absolute-fill",
  schema: { ...Interactive.backgroundSchema },
});
