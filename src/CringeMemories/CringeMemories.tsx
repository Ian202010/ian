import { Audio } from "@remotion/media";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { interpolate, staticFile, useVideoConfig } from "remotion";
import { DangerScene } from "./DangerScene";
import { HookScene } from "./HookScene";
import { ReplayScene } from "./ReplayScene";
import { SaveScene } from "./SaveScene";
import { SpotlightScene } from "./SpotlightScene";
import { clamp, sceneStyle } from "./theme";

// Scene lengths follow the narration (public/audio/CringeMemories/sceneN.wav).
// Total: (5 + 7 + 5.5 + 5 + 7.6) s * 30 fps - 4 transitions * 12 frames = 855 frames
export const CringeMemories = () => {
  const { fps, durationInFrames } = useVideoConfig();
  return (
    <>
      <TransitionSeries>
        <TransitionSeries.Sequence name="Hook" durationInFrames={5 * fps}>
          <HookScene style={{ ...sceneStyle, flexDirection: "column" }} />
          <Audio name="VO Hook" src={staticFile("audio/CringeMemories/scene1.wav")} />
          <Audio name="Pop" from={0.9 * fps} src={staticFile("audio/sfx/pop.wav")} volume={0.5} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-bottom" })} timing={linearTiming({ durationInFrames: 12 })} />
        <TransitionSeries.Sequence name="Danger" durationInFrames={7 * fps}>
          <DangerScene style={{ ...sceneStyle, flexDirection: "column", padding: "100px 80px" }} />
          <Audio name="Whoosh" src={staticFile("audio/sfx/whoosh.wav")} volume={0.35} />
          <Audio name="VO Danger" src={staticFile("audio/CringeMemories/scene2.wav")} />
          <Audio name="Thud" from={0.6 * fps} src={staticFile("audio/sfx/thud.wav")} volume={0.6} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 12 })} />
        <TransitionSeries.Sequence name="Save" durationInFrames={5.5 * fps}>
          <SaveScene style={{ ...sceneStyle, flexDirection: "column", padding: "100px 80px" }} />
          <Audio name="Whoosh" src={staticFile("audio/sfx/whoosh.wav")} volume={0.35} />
          <Audio name="VO Save" src={staticFile("audio/CringeMemories/scene3.wav")} />
          <Audio name="Stamp" from={3 * fps} src={staticFile("audio/sfx/thud.wav")} volume={0.5} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: 12 })} />
        <TransitionSeries.Sequence name="Replay" durationInFrames={5 * fps}>
          <ReplayScene style={{ ...sceneStyle, flexDirection: "column", padding: "100px 80px" }} />
          <Audio name="Whoosh" src={staticFile("audio/sfx/whoosh.wav")} volume={0.35} />
          <Audio name="VO Replay" src={staticFile("audio/CringeMemories/scene4.wav")} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 12 })} />
        <TransitionSeries.Sequence name="Spotlight" durationInFrames={7.6 * fps}>
          <SpotlightScene style={{ ...sceneStyle, flexDirection: "column", padding: "100px 80px" }} />
          <Audio name="Whoosh" src={staticFile("audio/sfx/whoosh.wav")} volume={0.35} />
          <Audio name="VO Spotlight" src={staticFile("audio/CringeMemories/scene5.wav")} />
          <Audio name="Pop guess" from={0.9 * fps} src={staticFile("audio/sfx/pop.wav")} volume={0.4} />
          <Audio name="Pop actual" from={1.6 * fps} src={staticFile("audio/sfx/pop.wav")} volume={0.4} />
          <Audio name="Ding" from={5 * fps} src={staticFile("audio/sfx/ding.wav")} volume={0.35} />
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
