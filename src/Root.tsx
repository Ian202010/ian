import { Composition, Folder } from "remotion";
import { HelloWorld } from "./HelloWorld";
import { Logo } from "./HelloWorld/Logo";
import { Title } from "./HelloWorld/Title";
import { TopTikTok } from "./TopTikTok/TopTikTok";
import { Explainer } from "./Explainer/Explainer";
import { FPS, totalFrames, type Timing, type VideoSpec } from "./Explainer/types";
import cringeSpec from "./videos/cringe.json";
import cringeTiming from "./videos/cringe.timing.json";
import wrinkleSpec from "./videos/wrinkle.json";
import wrinkleTiming from "./videos/wrinkle.timing.json";

// Each <Composition> is an entry in the sidebar!

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="WrinkleFingers"
        component={Explainer}
        durationInFrames={totalFrames(wrinkleTiming as Timing)}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{ spec: wrinkleSpec as VideoSpec, timing: wrinkleTiming as Timing }}
      />
      <Composition
        id="CringeMemories"
        component={Explainer}
        durationInFrames={totalFrames(cringeTiming as Timing)}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{ spec: cringeSpec as VideoSpec, timing: cringeTiming as Timing }}
      />
      <Composition
        id="TopTikTok"
        component={TopTikTok}
        durationInFrames={810}
        fps={30}
        width={1080}
        height={1920}
      />
      <Folder name="Elements">
        <Composition
          id="Logo"
          component={Logo}
          durationInFrames={150}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            logoColor1: "#91EAE4",
            logoColor2: "#86A8E7",
          }}
        />
        <Composition
          id="Title"
          component={Title}
          durationInFrames={115}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            titleText: "Welcome to Remotion",
            titleColor: "#000000",
          }}
        />
      </Folder>
      <Composition
        // You can take the "id" to render a video:
        // bunx remotion render HelloWorld
        id="HelloWorld"
        component={HelloWorld}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        // You can override these props for each render:
        // https://www.remotion.dev/docs/parametrized-rendering
        defaultProps={{
          titleText: "Welcome to Remotion",
          titleColor: "#000000",
        }}
      />

    </>
  );
};
