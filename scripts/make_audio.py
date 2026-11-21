"""Generate narration + word timings for an explainer video spec.

Usage:
  python scripts/make_audio.py <kokoro_dir> src/videos/wrinkle.json [voice] [speed]

Writes public/audio/<id>/beatN.wav and src/videos/<name>.timing.json.
Kokoro (https://github.com/thewh1teagle/kokoro-onnx) does not return word
timestamps, so they are estimated: speech regions are found in each beat's
audio, phrase breaks are matched to the longest pauses, and words are spread
inside each phrase by length.
"""
import json
import os
import re
import sys

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

kokoro_dir, spec_path = sys.argv[1], sys.argv[2]
voice = sys.argv[3] if len(sys.argv) > 3 else "af_heart"
speed = float(sys.argv[4]) if len(sys.argv) > 4 else 1.15

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = json.load(open(spec_path))
out_dir = os.path.join(root, "public", "audio", spec["id"])
os.makedirs(out_dir, exist_ok=True)
k = Kokoro(f"{kokoro_dir}/kokoro-v1.0.int8.onnx", f"{kokoro_dir}/voices-v1.0.bin")


def speech_regions(samples, sr):
    hop = int(sr * 0.01)
    n = len(samples) // hop
    rms = np.array([np.sqrt(np.mean(samples[i * hop:(i + 1) * hop] ** 2)) for i in range(n)])
    on = rms > max(rms.max() * 0.06, 1e-4)
    regions, start = [], None
    for i, v in enumerate(on):
        if v and start is None:
            start = i
        if not v and start is not None:
            regions.append([start, i])
            start = None
    if start is not None:
        regions.append([start, n])
    merged = []
    for r in regions:  # merge gaps shorter than 60 ms (inside words)
        if merged and r[0] - merged[-1][1] < 6:
            merged[-1][1] = r[1]
        else:
            merged.append(r)
    return [(a * 0.01, b * 0.01) for a, b in merged]


def word_timings(text, samples, sr):
    words = text.split()
    # phrase = run of words ending in punctuation
    phrases, cur = [], []
    for w in words:
        cur.append(w)
        if re.search(r"[,.?!:;]$", w):
            phrases.append(cur)
            cur = []
    if cur:
        phrases.append(cur)
    regions = speech_regions(samples, sr)
    start, end = regions[0][0], regions[-1][1]
    gaps = sorted(
        [(regions[i + 1][0] - regions[i][1], regions[i][1], regions[i + 1][0]) for i in range(len(regions) - 1)],
        reverse=True,
    )[: len(phrases) - 1]
    cuts = sorted(gaps, key=lambda g: g[1])
    spans, s = [], start
    for g in cuts:
        spans.append((s, g[1]))
        s = g[2]
    spans.append((s, end))
    if len(spans) != len(phrases):  # fall back to one span
        spans, phrases = [(start, end)], [words]
    out = []
    for (a, b), ph in zip(spans, phrases):
        weights = [len(re.sub(r"\W", "", w)) + 2 for w in ph]
        total, t = sum(weights), a
        for w, wt in zip(ph, weights):
            d = (b - a) * wt / total
            out.append({"word": w, "start": round(t, 3), "end": round(t + d, 3)})
            t += d
    return out


beats = []
for i, beat in enumerate(spec["beats"], 1):
    samples, sr = k.create(beat["text"], voice=voice, speed=speed, lang="en-us")
    fname = f"beat{i}.wav"
    sf.write(os.path.join(out_dir, fname), samples, sr)
    beats.append({
        "file": f"audio/{spec['id']}/{fname}",
        "duration": round(len(samples) / sr, 3),
        "words": word_timings(beat["text"], samples, sr),
    })

timing_path = spec_path.replace(".json", ".timing.json")
json.dump({"voice": voice, "speed": speed, "beats": beats}, open(timing_path, "w"), indent=1)
print(spec["id"], "total", round(sum(b["duration"] for b in beats), 2), "s ->", timing_path)
