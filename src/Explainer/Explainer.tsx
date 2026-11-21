import { Audio } from "@remotion/media";
import { AbsoluteFill, interpolate, Sequence, staticFile, useVideoConfig } from "remotion";
import { Background } from "./Background";
import { BeatVisual } from "./BeatVisual";
import { Captions } from "./Captions";
import { TopBar } from "./TopBar";
import { beatFrames, type Timing, type VideoSpec } from "./types";

// Reusable explainer template. The video is generated from a spec
// (src/videos/*.json) and its narration timing (src/videos/*.timing.json),
// so beats are not individually editable in Studio: edit the JSON instead.
export const Explainer: React.FC<{ spec: VideoSpec; timing: Timing }> = ({ spec, timing }) => {
  const { durationInFrames } = useVideoConfig();
  const frames = beatFrames(timing);
  const words = timing.beats.flatMap((b, i) =>
    b.words.map((w) => ({ ...w, start: w.start + frames[i].startSec, end: w.end + frames[i].startSec })),
  );

  return (
    <AbsoluteFill>
      <Background bg={spec.bg} accent={spec.accent} accent2={spec.accent2} />
      {spec.beats.map((beat, i) => {
        const isLast = i === spec.beats.length - 1;
        const len = isLast ? durationInFrames - frames[i].from : frames[i].durationInFrames;
        return (
          <Sequence key={i} name={`Beat ${i + 1}`} from={frames[i].from} durationInFrames={len}>
            <BeatVisual beat={beat} accent={spec.accent} durationInFrames={len} isFirst={i === 0} />
            <Audio src={staticFile(timing.beats[i].file)} />
            {beat.sfx && i > 0 ? (
              <Audio src={staticFile(`audio/sfx/${beat.sfx}.wav`)} volume={beat.sfx === "whoosh" ? 0.3 : 0.4} />
            ) : null}
          </Sequence>
        );
      })}
      <Captions words={words} />
      <TopBar title={spec.title} accent={spec.accent} accent2={spec.accent2} />
      <Audio
        name="Music"
        src={staticFile("audio/sfx/music.wav")}
        volume={(f) =>
          interpolate(f, [0, 10, durationInFrames - 30, durationInFrames], [0.1, 0.1, 0.1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />
    </AbsoluteFill>
  );
};
