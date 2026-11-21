import { Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { colors } from "./theme";

const Reason = ({ n, title, body, delay }: { n: string; title: string; body: string; delay: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div
      style={{
        display: "flex",
        gap: 36,
        alignItems: "flex-start",
        marginTop: 56,
        width: "100%",
        opacity: interpolate(frame, [delay * fps, (delay + 0.4) * fps], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        translate: interpolate(frame, [delay * fps, (delay + 0.5) * fps], ["0px 60px", "0px 0px"], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
      }}
    >
      <div
        style={{
          minWidth: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: colors.pink,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: 64,
          fontWeight: 800,
        }}
      >
        {n}
      </div>
      <div>
        <div style={{ fontSize: 64, fontWeight: 800 }}>{title}</div>
        <div style={{ fontSize: 46, color: colors.muted, fontWeight: 500 }}>{body}</div>
      </div>
    </div>
  );
};

const WhySceneInner = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      <Interactive.Div
        name="Title"
        style={{
          fontSize: 96,
          fontWeight: 800,
          alignSelf: "flex-start",
          color: colors.cyan,
          opacity: interpolate(frame, [0, 0.4 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        Why it went viral
      </Interactive.Div>
      <Reason n="1" title="Instant wonder" body="A childhood dream: flying on a broom" delay={0.5} />
      <Reason n="2" title="Super short" body="Viewers replay it to spot the trick" delay={1.5} />
      <Reason n="3" title="The reveal" body="Showing the secret makes people share it" delay={2.5} />
    </>
  );
};

export const WhyScene = Interactive.create({
  Component: WhySceneInner,
  layout: "absolute-fill",
  schema: { ...Interactive.backgroundSchema },
});
