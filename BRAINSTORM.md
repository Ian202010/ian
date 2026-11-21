# TikTok Animated Explainer Ideas

Short (20–45 s), vertical (1080×1920) animated videos that explain curiosities or useful things. Each idea has a **hook**: the first line on screen and in the voiceover, which has to stop the scroll in under 2 seconds.

---

## 1. "Why does…?" everyday curiosities (best for views)
People share these because they've always wondered about them and never looked it up.

| Idea | Hook |
|---|---|
| Why your fingers wrinkle in water | "Your fingers aren't soaking up water. They're doing this on purpose." |
| Why we yawn when others yawn | "You're about to yawn, and I can prove it." |
| Why time feels faster as you get older | "One summer at age 7 felt like 1/7 of your whole life." |
| Why cats knock things off tables | "Your cat isn't being a jerk. It's running an experiment." |
| Why airplane food tastes bland | "At 35,000 ft you lose about 30% of your taste." |
| Why you can't tickle yourself | "Your brain is spoiling the surprise." |
| Why onions make you cry | "Cutting an onion sets off a tiny chemical weapon." |
| Why the sky is blue but sunsets are orange | One animated sunbeam traveling through the air |
| Why your voice sounds weird on recordings | "That voice you hate is the one everyone else hears." |
| Why we get "brain freeze" | Animate the ice cream hitting the nerve at the roof of the mouth |

## 2. "What happens if…?" what-if scenarios
These get lots of comments because people argue about the answer.

- What if you stopped sleeping for 7 days? (show it day by day)
- What if the Moon disappeared tonight?
- What happens to your body if you drink only water for 30 days?
- What if everyone on Earth jumped at the same time?
- What if you fell into a black hole? (spaghettification is great to animate)
- What happens to your body in the first 60 seconds in space?

## 3. Useful life hacks, animated
These get saved and shared, which TikTok's algorithm rewards a lot.

- **The 2-minute rule**: how to stop procrastinating
- **How to fall asleep in 2 minutes** (the military method, step by step)
- **The 50/30/20 money rule**, shown as a pie chart that fills up
- **How compound interest turns $5/day into $100k+**, as an animated growing chart
- **Hidden phone features you never use** (iPhone and Android versions)
- **How to tell if an egg is still good** (the float test)
- **The 20-20-20 rule for your eyes**
- **How to remember anyone's name**
- **What to do in the first 5 minutes of a fire, earthquake or flood**

## 4. "How it works" (the inside of everyday things)
Cutaway animations do very well here.

- How a microwave actually heats food
- What happens when you press "send" on a text (its trip around the world in 1 second)
- How noise-cancelling headphones delete sound
- How a zipper works (it looks simple, but slow-motion is satisfying)
- How your credit card number is checked in milliseconds
- How a toilet flushes without any electricity
- How GPS knows exactly where you are

## 5. Mind-blowing scale and numbers
The "wait, WHAT?" reaction leads to rewatches.

- How big is a billion? (counting seconds = 31 years)
- If Earth's history were 24 hours, humans showed up at 11:59:59 PM
- The size of the biggest star vs. the Sun vs. Earth (zoom-out animation)
- How much one second of the Sun's energy is worth
- How deep the ocean really is (a dive animation with landmarks along the way)
- How many people have ever lived (about 117 billion)

## 6. Body and psychology facts
These are personal ("this is about YOU"), so people tag their friends.

- What 1 hour of phone scrolling does to your brain (dopamine loop)
- Why you remember embarrassing moments from 10 years ago
- The "doorway effect": why you forget things when you walk into a room
- What your body does in the 24 hours after you quit sugar
- Why you feel someone staring at you

## 7. History in 30 seconds
- The weirdest jobs that used to exist (human alarm clocks called "knocker-uppers")
- Why we have 24 hours in a day and 60 minutes in an hour
- How ancient people told the time with no clocks
- The origin of everyday words ("salary" comes from salt)
- Why keyboards aren't in ABC order (the QWERTY story)

---

## Series formats (to build followers, not just views)
Recurring series make people follow so they don't miss the next part.

1. **"Things you've done 1000 times but never understood"** (Part 1, 2, 3…)
2. **"60-second science"**: one question per day
3. **"Your body is weird"**: a weekly body fact
4. **"Money hacks school never taught you"**
5. **"Comment a question and I'll animate the answer"**: replying to comments with videos builds engagement

---

## What makes these get views
- **Hook in the first 1–2 seconds**: a surprising statement or question, both on screen and spoken.
- **Loop the ending**: the last frame flows back into the first, so it gets rewatched.
- **One idea per video**: don't cram in three facts.
- **Big on-screen captions**: about 80% of people watch with the sound off.
- **Fast pacing**: a new visual every 1.5–3 seconds.
- **End with a question** ("Did you know this?" / "What should I explain next?") to get comments.
- **Consistent character or style**: a recurring mascot makes the channel recognizable.
- **Post 1–2 a day at first**, then double down on whatever topic performs best.
- **Fact-check everything**: comment sections punish wrong facts hard.

## Making them with this repo
This repo is already a Remotion project, so each idea can be a composition at 1080×1920, 30 fps:
- Text and caption animations with `spring()` and `interpolate()`
- Simple shape and icon animations (charts, planets, cutaway diagrams)
- AI voiceover plus auto-generated captions
- A reusable template (hook → 3 beats → loop/CTA) so new videos are mostly new text
