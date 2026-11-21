import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { GrainGradient, LiquidMetal, MeshGradient } from "@paper-design/shaders-react";
import { RemotionShader } from "./RemotionShader";

export const PaperShadersDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const scene = Math.floor(frame / 90) % 3;
  const opacity = interpolate(frame % 90, [0, 12, 78, 90], [0, 1, 1, 0]);
  const label = ["MeshGradient", "GrainGradient", "LiquidMetal"][scene];

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {scene === 0 && (
        <RemotionShader
          shader={MeshGradient}
          colors={["#5100ff", "#00ff80", "#ffcc00", "#ea00ff"]}
          distortion={1}
          swirl={0.8}
          timeScale={0.6}
        />
      )}
      {scene === 1 && (
        <RemotionShader
          shader={GrainGradient}
          colors={["#7300ff", "#eba8ff", "#00bfff", "#2b00ff"]}
          colorBack="#000000"
          softness={0.5}
          intensity={0.5}
          noise={0.25}
          shape="corners"
        />
      )}
      {scene === 2 && (
        <RemotionShader
          shader={LiquidMetal}
          colorBack="#aaaaac"
          colorTint="#ffffff"
          shape="diamond"
          repetition={2}
          softness={0.1}
          shiftRed={0.3}
          shiftBlue={0.3}
          distortion={0.07}
          contour={0.4}
          angle={70}
        />
      )}
      <AbsoluteFill style={{ justifyContent: "flex-end", padding: 160, opacity }}>
        <div style={{ fontFamily: "sans-serif", fontWeight: 800, fontSize: 110, color: "white", textShadow: "0 6px 30px rgba(0,0,0,.5)" }}>
          {label}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
