import { Audio } from "@remotion/media";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { interpolate, staticFile, useVideoConfig } from "remotion";
import { GripScene } from "./GripScene";
import { HookScene } from "./HookScene";
import { MythScene } from "./MythScene";
import { NerveScene } from "./NerveScene";
import { ProofScene } from "./ProofScene";
import { clamp, sceneStyle } from "./theme";

// Scene lengths follow the narration (public/audio/WrinkleFingers/sceneN.wav).
// Total: (4.1 + 4.3 + 7.6 + 8.9 + 6.5) s * 30 fps - 4 transitions * 12 frames = 894 frames
export const WrinkleFingers = () => {
  const { fps, durationInFrames } = useVideoConfig();
  return (
    <>
      <TransitionSeries>
        <TransitionSeries.Sequence name="Hook" durationInFrames={4.1 * fps}>
          <HookScene style={{ ...sceneStyle, flexDirection: "column" }} />
          <Audio name="VO Hook" src={staticFile("audio/WrinkleFingers/scene1.wav")} />
          <Audio name="Pop" from={1.6 * fps} src={staticFile("audio/sfx/pop.wav")} volume={0.5} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-bottom" })} timing={linearTiming({ durationInFrames: 12 })} />
        <TransitionSeries.Sequence name="Myth" durationInFrames={4.3 * fps}>
          <MythScene style={{ ...sceneStyle, flexDirection: "column" }} />
          <Audio name="Whoosh" src={staticFile("audio/sfx/whoosh.wav")} volume={0.35} />
          <Audio name="VO Myth" src={staticFile("audio/WrinkleFingers/scene2.wav")} />
          <Audio name="Thud" from={2.7 * fps} src={staticFile("audio/sfx/thud.wav")} volume={0.6} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 12 })} />
        <TransitionSeries.Sequence name="Nerve" durationInFrames={7.6 * fps}>
          <NerveScene style={{ ...sceneStyle, flexDirection: "column", padding: "100px 80px" }} />
          <Audio name="Whoosh" src={staticFile("audio/sfx/whoosh.wav")} volume={0.35} />
          <Audio name="VO Nerve" src={staticFile("audio/WrinkleFingers/scene3.wav")} />
          <Audio name="Pop" from={0.8 * fps} src={staticFile("audio/sfx/pop.wav")} volume={0.4} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: 12 })} />
        <TransitionSeries.Sequence name="Grip" durationInFrames={8.9 * fps}>
          <GripScene style={{ ...sceneStyle, flexDirection: "column", padding: "100px 80px" }} />
          <Audio name="Whoosh" src={staticFile("audio/sfx/whoosh.wav")} volume={0.35} />
          <Audio name="VO Grip" src={staticFile("audio/WrinkleFingers/scene4.wav")} />
          <Audio name="Ding" from={6 * fps} src={staticFile("audio/sfx/ding.wav")} volume={0.35} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 12 })} />
        <TransitionSeries.Sequence name="Proof" durationInFrames={6.5 * fps}>
          <ProofScene style={{ ...sceneStyle, flexDirection: "column" }} />
          <Audio name="Whoosh" src={staticFile("audio/sfx/whoosh.wav")} volume={0.35} />
          <Audio name="VO Proof" src={staticFile("audio/WrinkleFingers/scene5.wav")} />
          <Audio name="Ding" from={3.6 * fps} src={staticFile("audio/sfx/ding.wav")} volume={0.35} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      <Audio
        name="Music"
        src={staticFile("audio/sfx/music.wav")}
        volume={(f) => interpolate(f, [0, 15, durationInFrames - 30, durationInFrames], [0, 0.12, 0.12, 0], clamp)}
      />
    </>
  );
};
