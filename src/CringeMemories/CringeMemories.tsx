import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { useVideoConfig } from "remotion";
import { DangerScene } from "./DangerScene";
import { HookScene } from "./HookScene";
import { ReplayScene } from "./ReplayScene";
import { SaveScene } from "./SaveScene";
import { SpotlightScene } from "./SpotlightScene";
import { sceneStyle } from "./theme";

// Total: (3.5 + 5 + 5 + 4.5 + 6) s * 30 fps - 4 transitions * 12 frames = 672 frames
export const CringeMemories = () => {
  const { fps } = useVideoConfig();
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence name="Hook" durationInFrames={3.5 * fps}>
        <HookScene style={{ ...sceneStyle, flexDirection: "column" }} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={slide({ direction: "from-bottom" })} timing={linearTiming({ durationInFrames: 12 })} />
      <TransitionSeries.Sequence name="Danger" durationInFrames={5 * fps}>
        <DangerScene style={{ ...sceneStyle, flexDirection: "column", padding: "100px 80px" }} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 12 })} />
      <TransitionSeries.Sequence name="Save" durationInFrames={5 * fps}>
        <SaveScene style={{ ...sceneStyle, flexDirection: "column", padding: "100px 80px" }} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: 12 })} />
      <TransitionSeries.Sequence name="Replay" durationInFrames={4.5 * fps}>
        <ReplayScene style={{ ...sceneStyle, flexDirection: "column", padding: "100px 80px" }} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 12 })} />
      <TransitionSeries.Sequence name="Spotlight" durationInFrames={6 * fps}>
        <SpotlightScene style={{ ...sceneStyle, flexDirection: "column", padding: "100px 80px" }} />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
