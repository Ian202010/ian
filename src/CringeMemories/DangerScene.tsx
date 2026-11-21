import { Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, colors } from "./theme";

// A tribe of dots; one gets pushed out and fades to grey.
const Tribe = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = interpolate(frame, [2.4 * fps, 3.6 * fps], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.65, 0, 0.35, 1),
  });
  const members = [
    [300, 200], [380, 150], [460, 200], [340, 290], [430, 290], [250, 280], [510, 280],
  ];
  return (
    <svg viewBox="0 0 800 460" width={800} height={460}>
      <circle cx={380} cy={230} r={200} fill={colors.cyan} opacity={0.08} />
      {members.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={40} fill={colors.cyan} />
      ))}
      <circle
        cx={380 + out * 330}
        cy={360 + out * -10}
        r={40}
        fill={out > 0.5 ? colors.muted : colors.cyan}
        opacity={1 - out * 0.4}
      />
    </svg>
  );
};

const DangerSceneInner = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      <Interactive.Div
        name="Headline"
        style={{
          fontSize: 88,
          fontWeight: 800,
          textAlign: "center",
          lineHeight: 1.12,
          opacity: interpolate(frame, [0, 0.4 * fps], [0, 1], clamp),
        }}
      >
        Your brain files embarrassment under
      </Interactive.Div>
      <Interactive.Div
        name="Danger"
        style={{
          fontSize: 170,
          fontWeight: 800,
          color: colors.pink,
          letterSpacing: 8,
          marginBottom: 40,
          opacity: interpolate(frame, [0.6 * fps, 0.8 * fps], [0, 1], clamp),
          scale: interpolate(frame, [0.6 * fps, 1.2 * fps], [1.6, 1], {
            ...clamp,
            easing: Easing.spring({ damping: 9 }),
            output: "perceptual-scale",
          }),
        }}
      >
        DANGER
      </Interactive.Div>
      <Interactive.Div name="Tribe" style={{ opacity: interpolate(frame, [1.2 * fps, 1.6 * fps], [0, 1], clamp) }}>
        <Tribe />
      </Interactive.Div>
      <Interactive.Div
        name="Explanation"
        style={{
          fontSize: 54,
          fontWeight: 500,
          textAlign: "center",
          lineHeight: 1.25,
          marginTop: 30,
          opacity: interpolate(frame, [1.6 * fps, 2 * fps], [0, 1], clamp),
        }}
      >
        For early humans, getting pushed out of the group could mean{" "}
        <span style={{ color: colors.pink, fontWeight: 800 }}>not surviving</span>.
      </Interactive.Div>
    </>
  );
};

export const DangerScene = Interactive.create({
  Component: DangerSceneInner,
  layout: "absolute-fill",
  schema: { ...Interactive.backgroundSchema },
});
