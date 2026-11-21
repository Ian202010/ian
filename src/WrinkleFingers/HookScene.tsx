import { Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Finger } from "./Finger";
import { clamp, colors } from "./theme";

const WrinklingFinger = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const wrinkle = interpolate(frame, [0.8 * fps, 2.8 * fps], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.45, 0, 0.55, 1),
  });
  return (
    <Interactive.Div
      name="Finger"
      style={{
        marginTop: 60,
        rotate: interpolate(frame, [0, 3.5 * fps], ["-4deg", "4deg"], clamp),
      }}
    >
      <Finger wrinkle={wrinkle} width={330} />
    </Interactive.Div>
  );
};

const HookSceneInner = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      <Interactive.Div
        name="Line 1"
        style={{
          fontSize: 92,
          fontWeight: 800,
          textAlign: "center",
          lineHeight: 1.1,
          opacity: interpolate(frame, [0, 0.4 * fps], [0, 1], clamp),
          translate: interpolate(frame, [0, 0.4 * fps], ["0px 40px", "0px 0px"], {
            ...clamp,
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        Your fingers aren't soaking up water.
      </Interactive.Div>
      <WrinklingFinger />
      <Interactive.Div
        name="Line 2"
        style={{
          fontSize: 88,
          fontWeight: 800,
          textAlign: "center",
          marginTop: 50,
          color: colors.cyan,
          opacity: interpolate(frame, [1.6 * fps, 2 * fps], [0, 1], clamp),
          scale: interpolate(frame, [1.6 * fps, 2.2 * fps], [1.4, 1], {
            ...clamp,
            easing: Easing.spring({ damping: 12 }),
            output: "perceptual-scale",
          }),
        }}
      >
        They do this ON PURPOSE.
      </Interactive.Div>
    </>
  );
};

export const HookScene = Interactive.create({
  Component: HookSceneInner,
  layout: "absolute-fill",
  schema: { ...Interactive.backgroundSchema },
});
