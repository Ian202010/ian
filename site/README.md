# Site

A separate website for the videos, with motion wired in:

- **Lenis** handles smooth scrolling, driven by GSAP's ticker so it stays in sync with ScrollTrigger (`src/motion.ts`).
- **GSAP + ScrollTrigger** run the pinned, sideways-scrolling scene strip (`Reel` in `src/App.tsx`).
- **React Bits** components are copied into `src/components/reactbits/` (their license is in that folder):
  `SplitText` (hero headline), `ScrollReveal` (process paragraph), `Threads` (hero background), `Magnet` (buttons).

Visitors who prefer reduced motion get native scrolling and no pinning.

```console
cd site
npm i
npm run dev      # local dev server
npm run build    # type-check + production build into site/dist
```

Replace `CONTACT_EMAIL` in `src/App.tsx` with your address.
