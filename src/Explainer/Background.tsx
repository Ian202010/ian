import { AbsoluteFill, useCurrentFrame } from "remotion";

// Gradient + slowly drifting colour glows + a moving dot grid, so the frame is never static.
export const Background: React.FC<{ bg: [string, string]; accent: string; accent2: string }> = ({
  bg,
  accent,
  accent2,
}) => {
  const frame = useCurrentFrame();
  const blobs = [
    { color: accent, size: 900, x: 200 + Math.sin(frame / 70) * 160, y: 350 + Math.cos(frame / 90) * 140 },
    { color: accent2, size: 800, x: 800 + Math.cos(frame / 80) * 180, y: 1300 + Math.sin(frame / 60) * 160 },
    { color: accent, size: 600, x: 600 + Math.sin(frame / 50) * 200, y: 900 + Math.cos(frame / 75) * 220 },
  ];
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${bg[0]}, ${bg[1]})`, overflow: "hidden" }}>
      {blobs.map((b, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: b.size,
            height: b.size,
            left: b.x - b.size / 2,
            top: b.y - b.size / 2,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${b.color} 0%, transparent 65%)`,
            opacity: i === 2 ? 0.18 : 0.32,
          }}
        />
      ))}
      <AbsoluteFill
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.10) 2px, transparent 2px)",
          backgroundSize: "44px 44px",
          backgroundPosition: `0px ${(frame * 0.6) % 44}px`,
        }}
      />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)" }} />
    </AbsoluteFill>
  );
};
