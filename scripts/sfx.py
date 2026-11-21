import sys, numpy as np, soundfile as sf
out = sys.argv[1]; sr = 44100
rng = np.random.default_rng(7)
def t(sec): return np.arange(int(sec*sr))/sr

# --- Music: 96 BPM lo-fi loop, Am - F - C - G, 32 bars of 4 beats ≈ 40 s
bpm = 96; beat = 60/bpm; bar = 4*beat
def note(f): return 440*2**((f-69)/12)
chords = [[57,60,64,69],[53,57,60,65],[48,55,60,64],[55,59,62,67]]
bars = 16; total = int(bars*bar*sr)+sr
mix = np.zeros(total)
for b in range(bars):
    start = int(b*bar*sr); tt = t(bar)
    env = np.minimum(1, tt/0.4) * np.exp(-tt*0.35)
    pad = sum(np.sin(2*np.pi*note(m)*tt)*0.6 + np.sin(2*np.pi*note(m)*2*tt)*0.12 for m in chords[b%4])
    mix[start:start+len(tt)] += pad*env*0.09
    bass = np.sin(2*np.pi*note(chords[b%4][0]-12)*tt)*np.exp(-tt*1.2)
    mix[start:start+len(tt)] += bass*0.25
    for k in range(4):
        s = start+int(k*beat*sr)
        if k in (0,2):  # soft kick
            kt=t(0.25); kick=np.sin(2*np.pi*(50+80*np.exp(-kt*30))*kt)*np.exp(-kt*14)
            mix[s:s+len(kt)] += kick*0.5
        if k in (1,3):  # brushed snare
            st=t(0.18); mix[s:s+len(st)] += rng.normal(0,1,len(st))*np.exp(-st*25)*0.08
        for h in (0,0.5):  # hats
            hs=s+int(h*beat*sr); ht=t(0.05)
            hat=np.diff(rng.normal(0,1,len(ht)+1))*np.exp(-ht*80)*0.03
            mix[hs:hs+len(ht)] += hat
# warm it up: simple lowpass
k = np.ones(6)/6; mix = np.convolve(mix, k, mode="same")
mix /= np.abs(mix).max()/0.8
sf.write(f"{out}/music.wav", mix, sr)

# --- Whoosh: noise with a rising-then-falling band
tt=t(0.45); n=rng.normal(0,1,len(tt))
env=np.sin(np.pi*tt/0.45)**2
w=np.convolve(n, np.ones(8)/8, mode="same")*env
w=np.diff(np.concatenate([[0],w]))*0.5 + w*0.5
sf.write(f"{out}/whoosh.wav", w/np.abs(w).max()*0.7, sr)

# --- Pop: quick pitch drop
tt=t(0.15); pop=np.sin(2*np.pi*(900*np.exp(-tt*25)+200)*tt)*np.exp(-tt*30)
sf.write(f"{out}/pop.wav", pop*0.8, sr)

# --- Ding: bell for stats / reveals
tt=t(1.2); ding=sum(a*np.sin(2*np.pi*f*tt) for f,a in [(1318,0.6),(2637,0.25),(3951,0.1)])*np.exp(-tt*4)
sf.write(f"{out}/ding.wav", ding*0.6, sr)

# --- Thud: low impact for big words (WRONG, DANGER)
tt=t(0.4); thud=np.sin(2*np.pi*(40+120*np.exp(-tt*20))*tt)*np.exp(-tt*9)
thud+=rng.normal(0,1,len(tt))*np.exp(-tt*40)*0.2
sf.write(f"{out}/thud.wav", thud/np.abs(thud).max()*0.9, sr)
print("ok")
