"""Voiceover for the Meaning series, generated locally with Kokoro (Apache-2.0, open weights).

Setup (once):
  pip install kokoro-onnx soundfile
  mkdir -p .tts && cd .tts
  curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
  curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin

Run: python3 scripts/voice.py [name ...]
Each line has a start time (s) and a window (s) matching the on-screen beat. A line that
would overrun its window is sped up (max 1.25x); anything still too long is reported.
Numbers are spelled out so they're pronounced naturally.
"""
import os, sys
import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SR = 24000

SCRIPTS = {
    "time-with-parents": {
        "voice": "af_heart", "duration": 29, "base_speed": 1.05,
        "lines": [
            (0.05, 3.75, "By eighteen, you've spent ninety-five percent of your time with your parents."),
            (3.85, 3.2, "Here's the math. Until eighteen, you see them every day."),
            (7.1, 4.0, "After you move out? Maybe ten days a year. Three hundred and twenty days."),
            (11.35, 3.9, "Add it up, and you're already living in the last five percent."),
            (15.5, 3.8, "Three-twenty days. Less than a year, for the rest of their lives."),
            (19.5, 4.0, "The good news? It isn't fixed. Visit twice as often, and it doubles."),
            (23.9, 2.5, "So... call them."),
        ],
    },
    "not-late": {
        "voice": "af_heart", "duration": 30, "base_speed": 1.05,
        "lines": [
            (0.1, 3.3, "At thirty, none of these people had done what they're famous for."),
            (3.5, 2.5, "Toni Morrison. First novel at thirty-nine."),
            (6.1, 2.5, "Vera Wang. Became a designer at forty."),
            (8.7, 2.5, "Julia Child. First cookbook at forty-nine."),
            (11.3, 2.5, "Raymond Chandler. First novel, at fifty."),
            (13.85, 2.9, "Laura Ingalls Wilder. First book, at sixty-five."),
            (16.8, 3.8, "The deadline you're racing? It was never real."),
            (20.9, 1.0, "You're not late."),
            (21.95, 2.6, "You're early."),
            (24.9, 4.4, "Tell me your age, and the thing you're finally starting."),
        ],
    },
    "pale-dot": {
        "voice": "am_michael", "duration": 27, "base_speed": 1.0,
        "lines": [
            (0.1, 4.3, "Every problem you've ever had... is in this dot."),
            (4.7, 3.7, "Up close, it all feels so big."),
            (8.7, 4.4, "In nineteen ninety, Voyager One looked back from six billion kilometers."),
            (13.3, 3.8, "And Earth was just zero point one two of a single pixel."),
            (17.3, 4.2, "Everyone you've ever loved. Every worry. All of it, right there."),
            (21.7, 2.6, "Carl Sagan said this should make us kinder."),
            (24.4, 2.4, "Start with yourself."),
        ],
    },
}


def trim(a, thresh=0.01):
    idx = np.where(np.abs(a) > thresh)[0]
    return a if len(idx) == 0 else a[max(0, idx[0] - 240): idx[-1] + 1200]


def build(k, name, spec):
    track = np.zeros(int(spec["duration"] * SR) + SR, dtype=np.float32)
    for start, window, text in spec["lines"]:
        speed = spec["base_speed"]
        while True:
            audio, sr = k.create(text, voice=spec["voice"], speed=speed, lang="en-us")
            audio = trim(audio)
            dur = len(audio) / sr
            if dur <= window or speed >= 1.25:
                break
            speed = min(1.25, speed * dur / window + 0.01)
        flag = "  <-- OVERRUNS" if dur > window else ""
        print(f"  {start:5.2f}s  {dur:4.2f}/{window:.2f}s  x{speed:.2f}  {text}{flag}")
        i = int(start * SR)
        track[i:i + len(audio)] += audio
    track = track[: int(spec["duration"] * SR)]
    track = track / (np.max(np.abs(track)) + 1e-9) * 0.9
    out = os.path.join(ROOT, "public", "audio", f"vo-{name}.wav")
    sf.write(out, track, SR)
    print("wrote", out)


if __name__ == "__main__":
    k = Kokoro(os.path.join(ROOT, ".tts", "kokoro-v1.0.onnx"), os.path.join(ROOT, ".tts", "voices-v1.0.bin"))
    for name in sys.argv[1:] or list(SCRIPTS):
        print(name)
        build(k, name, SCRIPTS[name])
