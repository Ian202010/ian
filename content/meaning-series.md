# The "Meaning" series: posting kit

Three faceless, animated, text-led TikToks (1080×1920, 30fps, 27–30s). Each one:

- **Hooks in the first second** with on-screen text, motion, and a sound hit together.
- **Makes one true claim**, proves it on screen, and shows the sources and assumptions.
- **Loops**: the last frame matches the first, so replays feel seamless.
- **Ends on a share or comment prompt** that fits the message. No "follow for more."
- **Has an original score.** It was synthesized from scratch (`scripts/score.py`), so there is no copyright risk, and it can become your own "original sound."

**Voiceover:** every video has a narrated VO, generated locally with the open-source **Kokoro** TTS model (Apache-2.0). Videos 1 and 2 use the `af_heart` voice (warm female) and video 3 uses `am_michael` (calm male). The VO script lives in `scripts/voice.py`. Each line is timed to its on-screen beat and sped up slightly only if it would overrun. The music is ducked to 42% under the voice. The on-screen text matches the VO, so the videos still work with the sound off.

**Disclosure:** turn on TikTok's **"AI-generated content"** toggle when posting, because the voice is synthetic. Want your own voice instead? Record each line from `scripts/voice.py` on your phone, save the clips as `public/audio/vo-<name>.wav` at the same timings, and re-render. A real voice usually beats AI on TikTok.

Source: `src/Meaning/*.tsx`. Preview with `npm run dev`. Rendered files are in `out/`.

---

## 1. `TimeWithParents`: "~95%"

| Time | On screen | Visual | Sound |
|---|---|---|---|
| 0–3.6s | By the time you move out, you've already spent **~95%** of all the time you'll ever spend with your parents. | 100 glowing squares burn out one by one; 5 are left | sub hit + accelerating ticks |
| 3.6–11.2 | The math: 18 yrs × 365 = **6,570 days**. After you move out? ~10 days/yr × 32 yrs = **320 days** | A long bar next to a tiny bar | whoosh |
| 11.2–15.4 | You're already living in **the last 5%**. | Grid returns; 5 squares pulse | low hit |
| 15.4–19.4 | **320 days.** Less than one year, spread across the rest of their lives. | | |
| 19.4–23.6 | The good news? The last 5% isn't fixed. Visit twice as often and it doubles. | 5 more squares light up | 5 rising chimes |
| 23.6–29 | ***Call them.*** (and send this to someone who should, too) | All 100 squares relight, matching frame 1 for the loop | riser, swell, sparkle |

**Caption:**
> did the math on time with my parents and had to sit down for a minute. the last 5% isn't fixed though 🧡 #timewithparents #lifeperspective #callyourparents #lifeinweeks #perspectiveshift

**Pinned comment (builds trust and starts replies):**
> math: 18 yrs × 365 = 6,570 days at home. after moving out ~10 days/yr for ~32 yrs (parents ~30 yrs older, living to ~80) = 320 days. 6,570 / 6,890 ≈ 95%. your numbers will differ. what are yours?

**Best time to post:** Sunday evening, or the week before Mother's or Father's Day (it gets re-shared every year).

---

## 2. `NotLate`: "At 30, none of these people had done what they're famous for"

| Time | On screen | Visual |
|---|---|---|
| 0–3.4s | **At 30,** none of these people had done what they're famous for. | Age ruler 20–70; a red "YOU" needle at 30 |
| 3.4–16.6 | Toni Morrison, first novel **at 39** · Vera Wang, became a fashion designer **at 40** · Julia Child, first cookbook **at 49** · Raymond Chandler, first novel **at 50** · Laura Ingalls Wilder, *Little House in the Big Woods* **at 65** | The needle travels to each age and drops a pin |
| 16.6–20.8 | The deadline you're racing was ***never*** real. | The needle returns to "YOU" at 30 |
| 20.8–24.8 | You're not late. ***You're early.*** | |
| 24.8–30 | Drop it in the comments: your age + the thing you're finally starting. | A hand-drawn underline; the ruler matches frame 1 |

**Caption:**
> for everyone who thinks they missed their window 📍 #latebloomer #notlate #startatanyage #motivation #careerchange

**Pinned comment (sources):**
> Morrison, The Bluest Eye (1970) · Wang left Ralph Lauren for bridal design (1989/90) · Child, Mastering the Art of French Cooking (1961) · Chandler, The Big Sleep (1939) · Wilder, Little House in the Big Woods (1932). I'll go first: [your age], [what you're starting].

**Why it travels:** the CTA asks for a personal answer, and comments like "34 and starting nursing school" start reply threads, which is a strong reach signal.

---

## 3. `PaleDot`: "0.12 pixels"

| Time | On screen | Visual |
|---|---|---|
| 0–3s | Every problem you've ever had is in this ***dot.*** | A single pale-blue pixel in scattered sunbeams; a ring draws around it |
| 3–8.5 | Up close, it all feels huge: | Zoom into Earth. Worry labels pop up: the exam, what they think of you, the group chat, the 3am thought, money, your ex |
| 8.5–13.2 | Feb 14, 1990. Voyager 1 turned around, 6 billion km from home, and took this photo. | Fast zoom out; the worries shrink into the dot |
| 13.2–17.2 | In that picture, Earth took up **0.12 pixels.** | A magnified pixel grid with Earth as a sliver of one pixel |
| 17.2–21.6 | Every person you've loved. Every worry. Every war. All of it, right there. | |
| 21.6–27 | Carl Sagan said this photo should make us kinder to each other. ***Start with yourself.*** | Back to the circled dot, matching frame 1 |

**Caption:**
> needed this reminder today. the pale blue dot, Voyager 1, 1990 🌍 #palebluedot #carlsagan #voyager1 #space #perspective

**Pinned comment:**
> NASA's caption for the photo: Earth is "a crescent only 0.12 pixel in size." Taken Feb 14, 1990, about 6 billion km away. Sagan wrote that it underscores our responsibility "to deal more kindly with one another."

**Best time to post:** around Feb 14 (the photo's anniversary), or on any heavy news day.

---

## Posting checklist (applies to all three)

1. Upload the MP4 from `out/`. Keep the original audio on. It's yours and copyright-free.
2. Optional: add a trending *ambient or emotional* sound at about 10–15% volume under the score for an extra discovery boost. Skip it if nothing fits; a forced trend hurts.
3. Set the cover to the hook frame (frame 0 already reads well).
4. Paste the caption and post the pinned comment right away.
5. Reply to the first 20 comments within the first hour. Those replies feed the algorithm.
6. Space the three posts 2–3 days apart, and post them as a series. Viewers who like one will binge the others on your profile.

## Making more in this format

Each video is an ordinary React component. Copy a file in `src/Meaning/`, change the copy and timings, add a spec to `scripts/build_audio.py`, then run:

```bash
python3 scripts/build_audio.py           # regenerate scores
python3 scripts/voice.py                 # regenerate voiceovers (setup steps at the top of the file)
npx remotion render <CompositionId> out/<Name>.mp4 --browser-executable=/opt/pw-browsers/chromium_headless_shell
# then normalize loudness to TikTok's ~-14 LUFS:
ffmpeg -i out/<Name>.mp4 -c:v copy -af loudnorm=I=-14:TP=-1.5:LRA=11 -c:a aac -b:a 192k out/<Name>-final.mp4
```

(The `--browser-executable` flag is only needed in sandboxed environments that can't download Chrome.)

Formula: **one true, surprising number** → **show the math** → **reframe it as something you can act on** → **a share or comment prompt that fits** → **loop**.
