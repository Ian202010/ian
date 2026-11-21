import sys, json, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
d, out = sys.argv[1], sys.argv[2]
k = Kokoro(f"{d}/kokoro-v1.0.int8.onnx", f"{d}/voices-v1.0.bin")
scripts = {
 "WrinkleFingers": [
  "Your fingers aren't soaking up water. They're doing this on purpose.",
  "Most people think your skin just soaks up water and swells. Wrong.",
  "It's your nervous system. After about five minutes in water, your nerves tell your blood vessels to shrink, so the skin folds in.",
  "But why? Scientists think the wrinkles work like rain tires. They channel water away, so you grip wet things better. Up to twelve percent faster.",
  "The proof? If the nerve to a finger is cut, that finger never wrinkles. What should I explain next?",
 ],
 "CringeMemories": [
  "It's three A M. And your brain goes: remember that thing you said in twenty fourteen?",
  "Your brain files embarrassment under danger. For early humans, getting pushed out of the group could mean not surviving.",
  "And strong emotion is a save button. Stress hormones tell your memory: keep this one.",
  "And every replay makes it stronger. That three A M cringe? You're re-saving it.",
  "Good news. People guess half the room noticed their mistake. Actually? Only about a quarter did. What should I explain next?",
 ],
}
lens = {}
for vid, lines in scripts.items():
    lens[vid] = []
    for i, line in enumerate(lines, 1):
        s, sr = k.create(line, voice="af_heart", speed=1.12, lang="en-us")
        sf.write(f"{out}/{vid}/scene{i}.wav", s, sr)
        lens[vid].append(round(len(s) / sr, 2))
print(json.dumps(lens))
