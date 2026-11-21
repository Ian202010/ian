import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { fontFamily } from "../TopTikTok/theme";
import type { Word } from "./types";

const HIGHLIGHT = "#FFE14D";

// Spoken spellings (needed for the voice) shown the way people write them.
const MERGES: [string[], string][] = [
  [["three", "a", "m"], "3 AM"],
  [["a", "m"], "AM"],
  [["twenty", "fourteen"], "2014"],
  [["twelve", "percent"], "12%"],
  [["five", "minutes"], "5 minutes"],
];
const bare = (w: string) => w.toLowerCase().replace(/[^a-z']/g, "");

const merge = (words: Word[]) => {
  const out: Word[] = [];
  for (let i = 0; i < words.length; i++) {
    const rule = MERGES.find(([seq]) => seq.every((s, j) => words[i + j] && bare(words[i + j].word) === s));
    if (rule) {
      const n = rule[0].length;
      const last = words[i + n - 1];
      const trail = last.word.match(/[,.?!:;]$/)?.[0] ?? "";
      out.push({ word: rule[1] + trail, start: words[i].start, end: last.end });
      i += n - 1;
    } else {
      out.push(words[i]);
    }
  }
  return out;
};

// Groups words into chunks of up to 3, breaking after punctuation.
const toChunks = (words: Word[]) => {
  const chunks: Word[][] = [];
  let cur: Word[] = [];
  for (const w of words) {
    cur.push(w);
    if (cur.length === 3 || /[,.?!:;]$/.test(w.word)) {
      chunks.push(cur);
      cur = [];
    }
  }
  if (cur.length) chunks.push(cur);
  return chunks;
};

// TikTok-style word-by-word captions. `words` use absolute times in seconds.
export const Captions: React.FC<{ words: Word[] }> = ({ words }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const chunks = toChunks(merge(words));
  const idx = chunks.findIndex((c, i) => {
    const next = chunks[i + 1];
    return t >= c[0].start - 0.12 && (next ? t < next[0].start - 0.12 : t < c[c.length - 1].end + 0.6);
  });
  if (idx === -1) return null;
  const chunk = chunks[idx];
  const shownAt = Math.max(0, chunk[0].start - 0.12) * fps;
  const pop = idx === 0 && shownAt === 0 ? 1 : interpolate(frame, [shownAt, shownAt + 4], [0.75, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 1290,
        left: 90,
        right: 90,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "0 40px",
        fontFamily,
        fontWeight: 800,
        fontSize: 96,
        lineHeight: 1.15,
        textTransform: "uppercase",
        scale: String(pop),
      }}
    >
      {chunk.map((w, i) => {
        const active = t >= w.start - 0.05 && t < (chunk[i + 1]?.start ?? w.end + 0.6);
        return (
          <span
            key={i}
            style={{
              color: active ? HIGHLIGHT : "#ffffff",
              WebkitTextStroke: "14px #000",
              paintOrder: "stroke fill",
              textShadow: "0 8px 0 rgba(0,0,0,0.5)",
              scale: active ? "1.06" : "1",
              display: "inline-block",
            }}
          >
            {w.word.replace(/[,.:;]$/, "")}
          </span>
        );
      })}
    </div>
  );
};
