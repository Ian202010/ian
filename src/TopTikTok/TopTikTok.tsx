import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { useVideoConfig } from "remotion";
import { CreatorScene } from "./CreatorScene";
import { HookScene } from "./HookScene";
import { IllusionScene } from "./IllusionScene";
import { RecordScene } from "./RecordScene";
import { SecretScene } from "./SecretScene";
import { sceneStyle } from "./theme";
import { WhyScene } from "./WhyScene";

export const TopTikTok = () => {
  const { fps } = useVideoConfig();
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence name="Hook" durationInFrames={4 * fps}>
        <HookScene style={{ ...sceneStyle, flexDirection: "column" }} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={slide({ direction: "from-bottom" })} timing={linearTiming({ durationInFrames: 12 })} />
      <TransitionSeries.Sequence name="Creator" durationInFrames={4.5 * fps}>
        <CreatorScene style={{ ...sceneStyle, flexDirection: "column" }} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 12 })} />
      <TransitionSeries.Sequence name="Illusion" durationInFrames={4.5 * fps}>
        <IllusionScene style={{ ...sceneStyle, flexDirection: "column" }} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: 12 })} />
      <TransitionSeries.Sequence name="Secret" durationInFrames={6.5 * fps}>
        <SecretScene style={{ ...sceneStyle, flexDirection: "column" }} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 12 })} />
      <TransitionSeries.Sequence name="Why" durationInFrames={5 * fps}>
        <WhyScene style={{ ...sceneStyle, flexDirection: "column" }} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={slide({ direction: "from-bottom" })} timing={linearTiming({ durationInFrames: 12 })} />
      <TransitionSeries.Sequence name="Record" durationInFrames={4.5 * fps}>
        <RecordScene style={{ ...sceneStyle, flexDirection: "column" }} />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
