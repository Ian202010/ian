import { useCurrentFrame, useVideoConfig } from "remotion";
import { fontFamily } from "../TopTikTok/theme";

// Progress bar + title pill, so viewers always know what they're watching and how long is left.
export const TopBar: React.FC<{ title: string; accent: string; accent2: string }> = ({ title, accent, accent2 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <>
      <div style={{ position: "absolute", top: 70, left: 80, right: 80, height: 12, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.15)" }}>
        <div
          style={{
            height: "100%",
            borderRadius: 6,
            width: `${(frame / (durationInFrames - 1)) * 100}%`,
            background: `linear-gradient(90deg, ${accent2}, ${accent})`,
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          top: 120,
          width: "100%",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: 50,
            color: "#fff",
            padding: "14px 36px",
            borderRadius: 999,
            backgroundColor: "rgba(0,0,0,0.45)",
            border: `3px solid ${accent}`,
          }}
        >
          {title}
        </div>
      </div>
    </>
  );
};
