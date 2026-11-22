import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

let lenis: Lenis | null = null;

/**
 * Lenis drives the scroll; GSAP's ticker drives Lenis, so ScrollTrigger and
 * smooth scroll share one clock and never drift apart.
 * Skipped entirely when the visitor prefers reduced motion.
 */
export function startSmoothScroll() {
  if (lenis || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};

  lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });
  lenis.on('scroll', ScrollTrigger.update);
  const tick = (time: number) => lenis?.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  return () => {
    gsap.ticker.remove(tick);
    lenis?.destroy();
    lenis = null;
  };
}

export function scrollToTarget(target: string) {
  if (lenis) lenis.scrollTo(target, { duration: 1.4 });
  else document.querySelector(target)?.scrollIntoView();
}

export { gsap, ScrollTrigger, useGSAP };
