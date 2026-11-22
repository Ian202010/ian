import { useEffect, useRef } from 'react';
import Magnet from './components/reactbits/Magnet';
import ScrollReveal from './components/reactbits/ScrollReveal';
import SplitText from './components/reactbits/SplitText';
import Threads from './components/reactbits/Threads';
import { scenes } from './data';
import { gsap, scrollToTarget, startSmoothScroll, useGSAP } from './motion';

const CONTACT_EMAIL = 'hello@example.com'; // TODO: replace with your address

export function App() {
  useEffect(() => startSmoothScroll(), []);

  return (
    <>
      <header className="bar">
        <a className="wordmark" href="#top">
          Ian
        </a>
        <a href="#contact" onClick={(e) => (e.preventDefault(), scrollToTarget('#contact'))}>
          Contact
        </a>
      </header>
      <main id="top">
        <Hero />
        <Reel />
        <Process />
        <Contact />
      </main>
    </>
  );
}

function Hero() {
  return (
    <section className="hero">
      <div className="hero-threads" aria-hidden="true">
        <Threads color="#2747F5" accentColor="#9AA9F7" amplitude={1.4} lineCount={60} opacity={0.55} angle={18} />
      </div>
      <div className="hero-copy">
        <SplitText
          tag="h1"
          text="Short videos that explain one thing well."
          className="hero-title"
          splitType="words, chars"
          effect="rise"
          mask
          trigger="load"
          delay={22}
          duration={1.1}
          textAlign="left"
        />
        <p className="hero-lede">
          I write, design and animate vertical explainers in code, frame by frame, so every cut lands
          where it should.
        </p>
        <Magnet padding={80} magnetStrength={3} maxOffset={18}>
          <button className="button" onClick={() => scrollToTarget('#reel')}>
            Watch it scene by scene
          </button>
        </Magnet>
      </div>
    </section>
  );
}

/** Pinned section: vertical scroll moves the strip of scenes sideways. */
function Reel() {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLOListElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const distance = () => track.current!.scrollWidth - window.innerWidth;
        gsap.to(track.current, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: section.current,
            start: 'top top',
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        });
        gsap.to('.reel-progress-fill', {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: { trigger: section.current, start: 'top top', end: () => `+=${distance()}`, scrub: true },
        });
      });
      return () => mm.revert();
    },
    { scope: section },
  );

  return (
    <section className="reel" id="reel" ref={section}>
      <div className="reel-head">
        <h2>TopTikTok, scene by scene</h2>
        <p>
          Why the most-viewed TikTok worked, told in six short scenes.
        </p>
        <div className="reel-progress" aria-hidden="true">
          <span className="reel-progress-fill" />
        </div>
      </div>
      <ol className="reel-track" ref={track}>
        {scenes.map((scene, i) => (
          <li key={scene.name} className="frame">
            <span className="frame-index">{i + 1}</span>
            <div className="frame-body">
              <h3>{scene.name}</h3>
              <p>{scene.line}</p>
            </div>
            <span className="frame-time">{scene.seconds}s</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Process() {
  return (
    <section className="process">
      <ScrollReveal
        baseOpacity={0.12}
        enableBlur
        blurStrength={6}
        baseRotation={2}
        textClassName="process-text"
      >
        Every video starts as a script and ends as code. Timing is written down, not dragged on a
        timeline, so a change to one line moves everything after it. Nothing is left to luck.
      </ScrollReveal>
    </section>
  );
}

function Contact() {
  return (
    <section className="contact" id="contact">
      <h2>Have something that needs explaining?</h2>
      <Magnet padding={120} magnetStrength={2.5} maxOffset={28} tilt={6}>
        <a className="button button-large" href={`mailto:${CONTACT_EMAIL}`}>
          Email me about a video
        </a>
      </Magnet>
      <p className="footnote">Built with GSAP, Lenis and React Bits.</p>
    </section>
  );
}
