"""Builds every score for the Meaning series. Run: python3 scripts/build_audio.py"""
import json, math, os, subprocess, sys, tempfile
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "public", "audio")

def time_with_parents():
    ev = [{"t": 0.0, "type": "boom", "gain": 0.5}]
    for k in range(1, 20):  # one tick per 5 squares burned (burn curve is quadratic)
        ev.append({"t": 0.35 + 2.45 * math.sqrt(k * 5 / 95), "type": "tick", "gain": 0.7 + k * 0.02, "pan": (k % 2) * 0.4 - 0.2})
    for t in (3.6, 11.2, 15.4, 19.4): ev.append({"t": t, "type": "whoosh", "gain": 0.6})
    ev.append({"t": 11.4, "type": "boom", "gain": 0.45})
    for i, n in enumerate([74, 76, 78, 81, 83]): ev.append({"t": 21.2 + i * 0.12, "type": "chime", "note": n, "gain": 0.6})
    ev += [{"t": 23.6, "type": "riser", "dur": 1.6, "gain": 0.8}, {"t": 23.6, "type": "boom", "gain": 0.6}]
    notes = [74, 78, 81, 86, 85, 81, 78, 81, 86, 90]
    for i in range(10): ev.append({"t": 25.0 + i * 0.25, "type": "chime", "note": notes[i], "gain": 0.45})
    return {"duration": 29, "bpm": 76, "beats_per_chord": 4,
            "chords": [[62, 66, 69, 73], [59, 62, 66, 69], [55, 59, 62, 66], [57, 61, 64, 69]],
            "style": "piano", "swell_at": 23.6, "events": ev, "end_fade": 0.6}

def not_late():
    ev = [{"t": 0.0, "type": "boom", "gain": 0.4}, {"t": 0.15, "type": "whoosh", "gain": 0.5}]
    notes = [72, 74, 76, 79, 84]
    for i, at in enumerate([3.4, 6.0, 8.6, 11.2, 13.8]):
        ev.append({"t": at, "type": "whoosh", "gain": 0.45})
        ev.append({"t": at + 0.6, "type": "tick", "gain": 1.0})
        ev.append({"t": at + 0.62, "type": "chime", "note": notes[i], "gain": 0.6})
    ev += [{"t": 16.6, "type": "whoosh", "gain": 0.6}, {"t": 20.8, "type": "boom", "gain": 0.4},
           {"t": 21.9, "type": "riser", "dur": 1.0, "gain": 0.6}, {"t": 21.9, "type": "boom", "gain": 0.6},
           {"t": 21.9, "type": "chime", "note": 84, "gain": 0.7}, {"t": 24.8, "type": "whoosh", "gain": 0.5}]
    return {"duration": 30, "bpm": 92, "beats_per_chord": 4,
            "chords": [[60, 64, 67, 72], [57, 60, 64, 69], [53, 57, 60, 65], [55, 59, 62, 67]],
            "style": "music_box", "swell_at": 20.8, "events": ev, "end_fade": 0.6,
            "arp": [0, 1, 2, 3, 2, 1, 2, 3]}

def pale_dot():
    ev = [{"t": 0.3, "type": "chime", "note": 88, "gain": 0.5},
          {"t": 3.0, "type": "riser", "dur": 1.6, "gain": 0.7}, {"t": 3.0, "type": "whoosh", "gain": 0.7},
          {"t": 4.6, "type": "boom", "gain": 0.45}]
    for i, at in enumerate([4.9, 5.3, 5.7, 6.1, 6.5, 6.9]):
        ev.append({"t": at, "type": "tick", "gain": 0.8, "pan": -0.4 + 0.16 * i})
    ev += [{"t": 8.5, "type": "whoosh", "gain": 0.8}, {"t": 10.4, "type": "riser", "dur": 1.9, "gain": 0.6},
           {"t": 10.4, "type": "chime", "note": 91, "gain": 0.45}, {"t": 13.2, "type": "whoosh", "gain": 0.4},
           {"t": 13.9, "type": "chime", "note": 86, "gain": 0.55}, {"t": 17.2, "type": "whoosh", "gain": 0.4},
           {"t": 24.3, "type": "boom", "gain": 0.35}, {"t": 24.3, "type": "chime", "note": 84, "gain": 0.6}]
    return {"duration": 27, "bpm": 64, "beats_per_chord": 4,
            "chords": [[60, 64, 67, 71], [57, 60, 64, 71], [53, 57, 60, 64], [55, 59, 62, 64]],
            "style": "piano", "swell_at": 17.2, "events": ev, "end_fade": 0.6, "arp": [0, 2, 3, 1, 2, 3, 1, 2]}

SPECS = {"time-with-parents": time_with_parents, "not-late": not_late, "pale-dot": pale_dot}

if __name__ == "__main__":
    only = sys.argv[1:] or list(SPECS)
    for name in only:
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f:
            json.dump(SPECS[name](), f)
        subprocess.run([sys.executable, os.path.join(HERE, "score.py"), f.name, os.path.join(OUT, name + ".wav")], check=True)
