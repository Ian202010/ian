import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { fontFamily } from "../TopTikTok/theme";
import { Finger } from "./Finger";
import type { Beat } from "./types";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const Emoji: React.FC<{ code: string; size: number; x: number; y: number; delay: number; tilt: number; skipIntro: boolean }> = ({
  code,
  size,
  x,
  y,
  delay,
  tilt,
  skipIntro,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = skipIntro ? 1 : spring({ frame: frame - delay, fps, config: { damping: 9, stiffness: 160 } });
  const bob = Math.sin((frame + delay * 7) / 11) * 14;
  return (
    <Img
      src={staticFile(`emoji/${code}.webp`)}
      style={{
        position: "absolute",
        width: size,
        height: size,
        left: x - size / 2,
        top: y - size / 2,
        scale: String(pop),
        translate: `0px ${bob}px`,
        rotate: `${(1 - pop) * -25 + tilt + Math.sin(frame / 17) * 3}deg`,
        filter: "drop-shadow(0 30px 40px rgba(0,0,0,0.45))",
      }}
    />
  );
};

const Rain: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => {
        const y = ((frame * (9 + (i % 3) * 3) + i * 230) % 1000) + 260;
        return (
          <Img
            key={i}
            src={staticFile("emoji/1f4a7.webp")}
            style={{ position: "absolute", width: 70 + (i % 3) * 20, left: 90 + i * 135, top: y, opacity: interpolate(y, [260, 340, 1150, 1260], [0, 0.85, 0.85, 0], clamp) }}
          />
        );
      })}
    </>
  );
};

const WrinklingFinger: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const wrinkle = interpolate(frame, [4, durationInFrames * 0.7], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  return (
    <div style={{ position: "absolute", left: 540 - 190, top: 300, rotate: `${Math.sin(frame / 15) * 3}deg` }}>
      <Finger wrinkle={wrinkle} width={380} />
    </div>
  );
};

// The visual for one beat: keyword + 3D emoji (or a custom drawing), with a camera push.
export const BeatVisual: React.FC<{
  beat: Beat;
  accent: string;
  durationInFrames: number;
  isFirst: boolean;
}> = ({ beat, accent, durationInFrames, isFirst }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const emojis = beat.emojis ?? [];
  const hasKeyword = Boolean(beat.keyword);
  const cy = hasKeyword ? 900 : 820;
  const keywordPop = isFirst ? 1 : spring({ frame: frame - 2, fps, config: { damping: 10, stiffness: 200 } });
  const camera =
    interpolate(frame, [0, durationInFrames], [1, 1.06], clamp) *
    (isFirst ? 1 : interpolate(frame, [0, 6], [1.08, 1], { ...clamp, easing: Easing.out(Easing.cubic) }));

  return (
    <AbsoluteFill style={{ scale: String(camera) }}>
      {/* glow behind the main visual */}
      <div
        style={{
          position: "absolute",
          width: 700,
          height: 700,
          left: 540 - 350,
          top: cy - 350,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accent}66 0%, transparent 65%)`,
          scale: String(1 + Math.sin(frame / 9) * 0.05),
        }}
      />
      {beat.special === "rain" ? <Rain /> : null}
      {beat.special === "finger" ? <WrinklingFinger durationInFrames={durationInFrames} /> : null}
      {emojis[0] ? <Emoji code={emojis[0]} size={480} x={emojis[1] ? 470 : 540} y={cy} delay={0} tilt={-4} skipIntro={isFirst} /> : null}
      {emojis[1] ? <Emoji code={emojis[1]} size={270} x={760} y={cy - 230} delay={5} tilt={10} skipIntro={isFirst} /> : null}
      {hasKeyword ? (
        <div
          style={{
            position: "absolute",
            top: 330,
            width: "100%",
            textAlign: "center",
            fontFamily,
            fontWeight: 800,
            fontSize: (beat.keyword ?? "").length > 7 ? 118 : 170,
            color: accent,
            letterSpacing: 2,
            WebkitTextStroke: "12px #0b0b12",
            paintOrder: "stroke fill",
            textShadow: "0 12px 0 rgba(0,0,0,0.35)",
            scale: String(keywordPop),
            rotate: "-4deg",
          }}
        >
          {beat.keyword}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
