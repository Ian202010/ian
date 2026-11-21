export type Beat = {
  text: string;
  emojis?: string[];
  keyword?: string;
  special?: "rain" | "finger";
  sfx?: "pop" | "thud" | "ding" | "whoosh";
};

export type VideoSpec = {
  id: string;
  title: string;
  accent: string;
  accent2: string;
  bg: [string, string];
  beats: Beat[];
};

export type Word = { word: string; start: number; end: number };

export type Timing = {
  beats: { file: string; duration: number; words: Word[] }[];
};

export const FPS = 30;
export const GAP = 0.12; // seconds of breathing room after each beat
export const TAIL = 1; // seconds held after the last beat

export const beatFrames = (timing: Timing) => {
  let t = 0;
  return timing.beats.map((b) => {
    const from = Math.round(t * FPS);
    t += b.duration + GAP;
    return { from, durationInFrames: Math.round(t * FPS) - from, startSec: from / FPS };
  });
};

export const totalFrames = (timing: Timing) => {
  const frames = beatFrames(timing);
  const last = frames[frames.length - 1];
  return last.from + last.durationInFrames + TAIL * FPS;
};
