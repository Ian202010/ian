"""Original score + SFX synthesizer for the Meaning series.

Usage: python3 scripts/score.py <spec.json> <out.wav>
Spec: {duration, bpm, key_root_midi, chords:[[midi...],...], beats_per_chord,
       style: "piano"|"pad"|"music_box", events:[{t, type, gain?}], swell_at?, end_fade?}
Everything is generated from scratch (no samples), so the audio is copyright-free.
"""
import json, sys, numpy as np

SR = 44100
rng = np.random.default_rng(7)

def midi_hz(m): return 440.0 * 2 ** ((m - 69) / 12)

def env_adsr(n, a, d, s, r):
    a, d, r = int(a*SR), int(d*SR), int(r*SR)
    e = np.full(n, s, dtype=np.float64)
    a = min(a, n); e[:a] = np.linspace(0, 1, a, endpoint=False)
    dd = min(d, n - a)
    if dd > 0: e[a:a+dd] = np.linspace(1, s, dd, endpoint=False)
    if r > 0 and r < n: e[-r:] *= np.linspace(1, 0, r)
    return e

def onepole_lp(x, cutoff):
    # vectorised-ish one-pole lowpass via chunks (fine for our lengths)
    a = np.exp(-2*np.pi*cutoff/SR)
    y = np.empty_like(x); prev = 0.0
    for i in range(len(x)):
        prev = (1-a)*x[i] + a*prev; y[i] = prev
    return y

def piano_note(m, dur, vel=0.5):
    n = int((dur + 1.8) * SR); t = np.arange(n)/SR; f = midi_hz(m)
    sig = np.zeros(n)
    for k, amp in enumerate([1, .45, .22, .12, .06], start=1):
        sig += amp * np.sin(2*np.pi*f*k*t * (1 + 0.0004*k)) * np.exp(-t*(1.2 + k*0.9))
    att = np.minimum(1, t/0.004)
    return sig * att * vel

def music_box(m, vel=0.4):
    n = int(2.2*SR); t = np.arange(n)/SR; f = midi_hz(m)
    sig = np.sin(2*np.pi*f*t)*np.exp(-t*2.2) + .3*np.sin(2*np.pi*f*4.01*t)*np.exp(-t*6)
    return sig * np.minimum(1, t/0.002) * vel

def pad_chord(notes, dur, vel=0.12):
    n = int((dur + 1.5) * SR); t = np.arange(n)/SR; sig = np.zeros(n)
    for m in notes:
        f = midi_hz(m)
        for det in (-0.07, 0, 0.07):
            ff = f * 2 ** (det/12)
            sig += np.sin(2*np.pi*ff*t + rng.uniform(0, 6.28)) + 0.25*np.sin(2*np.pi*2*ff*t)
    sig /= max(1, len(notes)*3)
    sig *= env_adsr(n, 1.2, 0.5, 0.85, 1.5) * (1 + 0.08*np.sin(2*np.pi*0.25*t))
    return sig * vel

def tick(vel=0.25):
    n = int(0.05*SR); t = np.arange(n)/SR
    return (np.sin(2*np.pi*2200*t) * np.exp(-t*90) + 0.4*rng.standard_normal(n)*np.exp(-t*200)) * vel

def whoosh(dur=0.7, vel=0.35):
    n = int(dur*SR); t = np.arange(n)/SR
    noise = rng.standard_normal(n)
    # crude band sweep: mix lowpassed noise with rising cutoff blend
    lo = onepole_lp(noise, 600); hi = noise - onepole_lp(noise, 2500)
    sweep = np.sin(np.pi * t/dur) ** 2
    mixk = t/dur
    return (lo*(1-mixk) + hi*mixk*0.6) * sweep * vel

def boom(vel=0.6):
    n = int(1.6*SR); t = np.arange(n)/SR
    f = 55 * np.exp(-t*1.5) + 38
    ph = 2*np.pi*np.cumsum(f)/SR
    return np.sin(ph) * np.exp(-t*2.4) * np.minimum(1, t/0.005) * vel

def chime(m=84, vel=0.35):
    out = music_box(m, vel) ; o2 = music_box(m+7, vel*0.6)
    n = max(len(out), len(o2)+int(0.09*SR)); s = np.zeros(n)
    s[:len(out)] += out; s[int(0.09*SR):int(0.09*SR)+len(o2)] += o2
    return s

def riser(dur=1.5, vel=0.25):
    n = int(dur*SR); t = np.arange(n)/SR
    noise = rng.standard_normal(n) - onepole_lp(rng.standard_normal(n), 1500)
    tone = np.sin(2*np.pi*np.cumsum(200 + 600*(t/dur)**2)/SR)
    return (noise*0.5 + tone*0.3) * (t/dur)**2 * vel

def add(buf, sig, at, pan=0.0):
    i = int(at*SR); 
    if i >= buf.shape[0]: return
    j = min(buf.shape[0], i+len(sig)); s = sig[:j-i]
    l, r = np.cos((pan+1)*np.pi/4), np.sin((pan+1)*np.pi/4)
    buf[i:j, 0] += s*l*1.41; buf[i:j, 1] += s*r*1.41

def main(spec_path, out):
    spec = json.load(open(spec_path))
    D = spec["duration"]; N = int(D*SR)
    buf = np.zeros((N + SR*3, 2))
    beat = 60/spec["bpm"]; bpc = spec.get("beats_per_chord", 4)
    chords = spec["chords"]; style = spec.get("style", "piano")
    t = spec.get("music_start", 0.0); ci = 0
    arp = spec.get("arp", [0, 2, 1, 2, 3, 2, 1, 2])
    while t < D:
        ch = chords[ci % len(chords)]
        lift = 1.0 + (0.5 if spec.get("swell_at") and t >= spec["swell_at"] else 0)
        add(buf, pad_chord([ch[0]-12] + ch, beat*bpc, 0.10*lift), t)
        for b in range(bpc*2):
            nt = t + b*beat/2
            if nt >= D: break
            m = ch[arp[b % len(arp)] % len(ch)] + 12
            v = (0.20 if b % 2 == 0 else 0.13) * lift
            if style == "music_box": add(buf, music_box(m + 12, v*1.2), nt, pan=0.3*np.sin(nt))
            else: add(buf, piano_note(m, beat/2, v), nt, pan=0.25*np.sin(nt*1.3))
        add(buf, piano_note(ch[0]-12, beat*bpc, 0.22*lift), t)
        t += beat*bpc; ci += 1
    fx = {"tick": tick, "whoosh": whoosh, "boom": boom, "chime": chime, "riser": riser}
    for e in spec.get("events", []):
        g = e.get("gain", 1.0); kind = e["type"]
        if kind == "chime": sig = chime(e.get("note", 84), 0.35*g)
        elif kind == "riser": sig = riser(e.get("dur", 1.5), 0.25*g); add(buf, sig, e["t"]-len(sig)/SR); continue
        else: sig = fx[kind]() * g
        add(buf, sig, e["t"], pan=e.get("pan", 0.0))
    # simple reverb: a few feedback delays
    wet = np.zeros_like(buf)
    for d, g in [(0.031, .35), (0.047, .3), (0.071, .25), (0.113, .2), (0.173, .15)]:
        k = int(d*SR); wet[k:] += buf[:-k]*g
    wet[int(0.2*SR):] += wet[:-int(0.2*SR)]*0.3
    mix = buf + wet*0.55
    mix = mix[:N]
    fade = spec.get("end_fade", 1.2); fi = int(fade*SR)
    mix[-fi:] *= np.linspace(1, 0, fi)[:, None]
    mix[:int(0.02*SR)] *= np.linspace(0, 1, int(0.02*SR))[:, None]
    mix = np.tanh(mix / (np.max(np.abs(mix))+1e-9) * 1.3) * 0.85
    import wave
    with wave.open(out, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((mix*32767).astype("<i2").tobytes())
    print("wrote", out, f"{D}s")

if __name__ == "__main__": main(sys.argv[1], sys.argv[2])
