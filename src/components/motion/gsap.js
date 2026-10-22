import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
// Mobile browser chrome (URL bar) resizes the viewport while scrolling; do not rebuild every trigger for that.
ScrollTrigger.config({ ignoreMobileResize: true });

/** Single source of truth for motion media queries, easing and timing. */
export const MQ = {
  reduced: '(prefers-reduced-motion: reduce)',
  motion: '(prefers-reduced-motion: no-preference)',
  finePointer: '(hover: hover) and (pointer: fine)',
  mobile: '(max-width: 760px)',
  desktop: '(min-width: 761px)',
};

export const EASE = { cover: 'power4.inOut', out: 'power3.out', in: 'power2.in' };
export const DUR = { cover: 0.85, reveal: 0.95, enter: 0.9, stagger: 0.07 };

export const prefersReducedMotion = () => window.matchMedia(MQ.reduced).matches;

export { gsap, ScrollTrigger };
