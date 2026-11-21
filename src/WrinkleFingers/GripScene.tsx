import { Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Finger } from "./Finger";
import { clamp, colors } from "./theme";

// A tire tread with water draining through its grooves.
const Tread = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const grooves = [0, 1, 2, 3, 4, 5];
  return (
    <svg viewBox="0 0 800 260" width={800} height={260}>
      <rect x={0} y={0} width={800} height={260} rx={40} fill="#2a2a36" />
      {grooves.map((g) => {
        const x = 70 + g * 130;
        const drop = ((frame / fps) * 1.4 + g * 0.17) % 1;
        return (
          <g key={g}>
            <path d={`M${x} 0 L${x + 60} 130 L${x} 260`} stroke={colors.bg} strokeWidth={34} fill="none" />
            <circle
              cx={x + 60 * (drop < 0.5 ? drop * 2 : 2 - drop * 2)}
              cy={drop * 260}
              r={13}
              fill={colors.water}
            />
          </g>
        );
      })}
    </svg>
  );
};

const GripBar = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ width: 800, height: 40, borderRadius: 20, backgroundColor: colors.card, overflow: "hidden" }}>
      <Interactive.Div
        name="Grip fill"
        style={{
          height: "100%",
          borderRadius: 20,
          backgroundColor: colors.green,
          width: `${interpolate(frame, [3.4 * fps, 4.6 * fps], [55, 100], {
            ...clamp,
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          })}%`,
        }}
      />
    </div>
  );
};

const GripSceneInner = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      <Interactive.Div
        name="Kicker"
        style={{
          fontSize: 52,
          fontWeight: 500,
          color: colors.muted,
          letterSpacing: 5,
          textTransform: "uppercase",
          opacity: interpolate(frame, [0, 0.4 * fps], [0, 1], clamp),
        }}
      >
        But why?
      </Interactive.Div>
      <Interactive.Div
        name="Headline"
        style={{
          fontSize: 100,
          fontWeight: 800,
          textAlign: "center",
          lineHeight: 1.1,
          marginBottom: 60,
          opacity: interpolate(frame, [0.2 * fps, 0.6 * fps], [0, 1], clamp),
        }}
      >
        Rain tires <span style={{ color: colors.water }}>for your hands</span>
      </Interactive.Div>
      <Interactive.Div
        name="Tread"
        style={{
          opacity: interpolate(frame, [0.6 * fps, 1 * fps], [0, 1], clamp),
          translate: interpolate(frame, [0.6 * fps, 1 * fps], ["0px 40px", "0px 0px"], {
            ...clamp,
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        <Tread />
      </Interactive.Div>
      <Interactive.Div
        name="Explanation"
        style={{
          fontSize: 54,
          fontWeight: 500,
          textAlign: "center",
          lineHeight: 1.25,
          margin: "60px 0 50px",
          opacity: interpolate(frame, [1.6 * fps, 2 * fps], [0, 1], clamp),
        }}
      >
        Scientists think the wrinkles channel water away, like tire treads, so you grip wet things better.
      </Interactive.Div>
      <Interactive.Div
        name="Stat"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
          opacity: interpolate(frame, [3.2 * fps, 3.6 * fps], [0, 1], clamp),
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
          <Finger wrinkle={1} width={90} />
          <div style={{ fontSize: 60, fontWeight: 800 }}>
            Up to <span style={{ color: colors.green }}>12% faster</span>
            <div style={{ fontSize: 44, fontWeight: 500, color: colors.muted }}>moving wet objects (2013 study)</div>
          </div>
        </div>
        <GripBar />
      </Interactive.Div>
    </>
  );
};

export const GripScene = Interactive.create({
  Component: GripSceneInner,
  layout: "absolute-fill",
  schema: { ...Interactive.backgroundSchema },
});
