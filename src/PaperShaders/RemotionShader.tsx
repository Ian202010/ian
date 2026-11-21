import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

/**
 * Drives any Paper Shaders component from Remotion's timeline so every
 * rendered frame is deterministic (no wall-clock animation).
 *
 * Paper's `frame` prop is "milliseconds since the animation started" and
 * `speed` multiplies it, so we freeze the internal clock (speed=0) and feed
 * the elapsed time ourselves, scaled by `timeScale`.
 */
export function RemotionShader<P extends object>({
  shader: Shader,
  timeScale = 1,
  style,
  ...props
}: {
  shader: React.ComponentType<P & { speed?: number; frame?: number; style?: React.CSSProperties }>;
  timeScale?: number;
  style?: React.CSSProperties;
} & P) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = (frame / fps) * 1000 * timeScale;
  return (
    <AbsoluteFill style={style}>
      <Shader
        {...(props as unknown as P)}
        speed={0}
        frame={ms}
        style={{ width: "100%", height: "100%" }}
      />
    </AbsoluteFill>
  );
}
