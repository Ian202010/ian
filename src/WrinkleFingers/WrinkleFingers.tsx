import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { useVideoConfig } from "remotion";
import { GripScene } from "./GripScene";
import { HookScene } from "./HookScene";
import { MythScene } from "./MythScene";
import { NerveScene } from "./NerveScene";
import { ProofScene } from "./ProofScene";
import { sceneStyle } from "./theme";

// Total: (3.5 + 4 + 5 + 6.5 + 5) s * 30 fps - 4 transitions * 12 frames = 672 frames
export const WrinkleFingers = () => {
  const { fps } = useVideoConfig();
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence name="Hook" durationInFrames={3.5 * fps}>
        <HookScene style={{ ...sceneStyle, flexDirection: "column" }} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={slide({ direction: "from-bottom" })} timing={linearTiming({ durationInFrames: 12 })} />
      <TransitionSeries.Sequence name="Myth" durationInFrames={4 * fps}>
        <MythScene style={{ ...sceneStyle, flexDirection: "column" }} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 12 })} />
      <TransitionSeries.Sequence name="Nerve" durationInFrames={5 * fps}>
        <NerveScene style={{ ...sceneStyle, flexDirection: "column", padding: "100px 80px" }} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: 12 })} />
      <TransitionSeries.Sequence name="Grip" durationInFrames={6.5 * fps}>
        <GripScene style={{ ...sceneStyle, flexDirection: "column", padding: "100px 80px" }} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 12 })} />
      <TransitionSeries.Sequence name="Proof" durationInFrames={5 * fps}>
        <ProofScene style={{ ...sceneStyle, flexDirection: "column" }} />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
