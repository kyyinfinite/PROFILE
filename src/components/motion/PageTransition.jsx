import { createContext, forwardRef, useCallback, useContext, useEffect, useLayoutEffect, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { gsap, ScrollTrigger, DUR, EASE, prefersReducedMotion } from './gsap';
import { setCovered } from './pageState';

/**
 * PAGE TRANSITION SYSTEM
 *
 *   link click ─► go(to) ─► [cover]  old content lifts and dims, a dark panel with a curved top edge rises from below
 *                             │ onComplete
 *                             ▼
 *                        navigate(to)  (route changes ONLY once the page is fully covered)
 *                             │ layout effect (before paint)
 *                             ▼
 *                        [reveal]  scroll reset, the panel keeps travelling up and out of view,
 *                                  new content staggers in ([data-enter])
 *
 * - Browser back/forward changes the route before we can intercept it, so the layout effect
 *   covers the viewport instantly (before paint) and then runs the same reveal.
 * - Clicks during [cover] only update the target (last click wins); clicks during [reveal] are queued.
 * - A short GSAP watchdog recovers if a navigation never changes the location.
 * - The "Hello" greeting runs once per browser session (sessionStorage), never on internal navigation.
 */

const INTRO_KEY = 'ky-intro-seen';
// One oversized ellipse is the whole curtain: its top edge is the curved leading edge. Only the centre
// moves, so the same shape rises into view (below -> covered) and keeps travelling out (covered -> above).
const R = '150% 150%';
const SHAPE = {
  below: `ellipse(${R} at 50% 250%)`,
  covered: `ellipse(${R} at 50% 100%)`,
  above: `ellipse(${R} at 50% -150%)`,
};
const LABELS = { '/': 'Home', '/work': 'Projects', '/about': 'About', '/journey': 'Journey', '/gallery': 'Gallery', '/awards': 'Awards', '/contact': 'Contact' };

const labelFor = (path) => LABELS[path] || (path.startsWith('/work/') ? 'Project' : '—');

const TransitionContext = createContext({ go: () => {} });

/** Returns go(path): navigate with the page transition. */
export const useTransitionNavigate = () => useContext(TransitionContext).go;

export function PageTransition({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate; // react-router recreates `navigate` per pathname; keep `go` stable.

  const curtainRef = useRef(null);
  const wordRef = useRef(null);
  const phase = useRef('idle'); // idle | cover | reveal
  const target = useRef(null);
  const queued = useRef(null);
  const timeline = useRef(null);
  const watchdog = useRef(null);
  const ownNavigation = useRef(false);
  const prevPath = useRef(null);
  const introPending = useRef(null); // decided once; StrictMode re-runs must not re-read the (already mutated) class

  const resetCurtain = useCallback(() => {
    phase.current = 'idle';
    setCovered(false);
    if (curtainRef.current) gsap.set(curtainRef.current, { autoAlpha: 0, pointerEvents: 'none' });
    const main = document.querySelector('main');
    if (main) gsap.set(main, { clearProps: 'transform,opacity,visibility' });
  }, []);

  const go = useCallback((to) => {
    const url = new URL(to, window.location.href);
    if (url.origin !== window.location.origin) {
      window.location.assign(url.href);
      return;
    }
    const next = url.pathname + url.search + url.hash;
    const samePage = url.pathname === window.location.pathname && url.search === window.location.search;
    if (samePage) {
      if (url.hash) navigateRef.current(next);
      else window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
      return;
    }
    if (prefersReducedMotion()) {
      navigateRef.current(next);
      return;
    }
    if (phase.current === 'reveal') {
      queued.current = next;
      return;
    }
    target.current = next;
    if (wordRef.current) wordRef.current.textContent = labelFor(url.pathname);
    if (phase.current === 'cover') return; // last click wins; the running cover will use the new target

    phase.current = 'cover';
    setCovered(true);
    const curtain = curtainRef.current;
    const word = wordRef.current;
    const main = document.querySelector('main');

    timeline.current?.kill();
    timeline.current = gsap.timeline({
      onComplete: () => {
        ownNavigation.current = true;
        navigateRef.current(target.current);
        watchdog.current?.kill();
        watchdog.current = gsap.delayedCall(2, () => { if (phase.current === 'cover') resetCurtain(); });
      },
    });
    timeline.current.set(curtain, { clipPath: SHAPE.below, autoAlpha: 1, pointerEvents: 'auto' });
    if (main) timeline.current.to(main, { autoAlpha: 0.4, y: -64, duration: DUR.cover, ease: EASE.cover }, 0);
    timeline.current
      .to(curtain, { clipPath: SHAPE.covered, duration: DUR.cover, ease: EASE.cover }, 0)
      .fromTo(word, { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.35, ease: EASE.out }, '-=0.3');
  }, [resetCurtain]);

  // Take over scroll restoration: every route starts at the top and the transition owns the timing.
  useEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => {
      window.history.scrollRestoration = previous;
      watchdog.current?.kill();
      timeline.current?.kill();
    };
  }, []);

  useLayoutEffect(() => {
    const curtain = curtainRef.current;
    const word = wordRef.current;
    const path = location.pathname;
    const initial = prevPath.current === null;
    if (!curtain || (!initial && prevPath.current === path)) return undefined; // hash/search-only change
    prevPath.current = path;

    watchdog.current?.kill();
    timeline.current?.kill();
    const root = document.documentElement;

    if (!initial) window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    if (prefersReducedMotion()) {
      root.classList.remove('is-intro');
      ownNavigation.current = false;
      resetCurtain();
      return undefined;
    }

    const main = document.querySelector('main');
    const items = gsap.utils.toArray('main [data-enter]');
    if (main) gsap.set(main, { clearProps: 'transform,opacity,visibility' });
    if (items.length) gsap.set(items, { autoAlpha: 0, y: 32 });

    if (initial && introPending.current === null) introPending.current = root.classList.contains('is-intro');
    const intro = initial && introPending.current === true;
    let finished = false;

    const finish = () => {
      finished = true;
      introPending.current = false;
      watchdog.current?.kill();
      root.classList.remove('is-intro');
      phase.current = 'idle';
      ownNavigation.current = false;
      gsap.set(curtain, { autoAlpha: 0, pointerEvents: 'none' });
      setCovered(false);
      ScrollTrigger.refresh();
      if (queued.current) {
        const next = queued.current;
        queued.current = null;
        go(next);
      }
    };

    const enterTail = (tl) => {
      tl.call(() => { setCovered(false); ScrollTrigger.refresh(); }, null, '-=0.45');
      if (items.length) {
        tl.to(items, {
          autoAlpha: 1, y: 0, duration: DUR.enter, stagger: DUR.stagger, ease: EASE.out,
          clearProps: 'transform,opacity,visibility',
        }, '-=0.35');
      }
    };

    let tl;
    if (initial && !intro) {
      phase.current = 'idle';
      root.classList.remove('is-intro');
      gsap.set(curtain, { autoAlpha: 0, pointerEvents: 'none' });
      setCovered(false);
      tl = gsap.timeline({ onComplete: () => { finished = true; } });
      if (items.length) {
        tl.to(items, {
          autoAlpha: 1, y: 0, duration: DUR.enter, stagger: DUR.stagger, ease: EASE.out, delay: 0.1,
          clearProps: 'transform,opacity,visibility',
        });
      }
    } else if (intro) {
      phase.current = 'reveal';
      setCovered(true);
      word.textContent = 'Hello';
      tl = gsap.timeline({
        onComplete: () => {
          try { sessionStorage.setItem(INTRO_KEY, '1'); } catch { /* storage blocked */ }
          finish();
        },
      });
      tl.set(curtain, { clipPath: SHAPE.covered, autoAlpha: 1, pointerEvents: 'auto' })
        .call(() => root.classList.remove('is-intro'))
        .fromTo(word, { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, ease: EASE.out })
        .to(word, { y: -10, autoAlpha: 0, duration: 0.25, delay: 0.35 })
        .to(curtain, { clipPath: SHAPE.above, duration: DUR.reveal, ease: EASE.cover });
      enterTail(tl);
    } else {
      phase.current = 'reveal';
      setCovered(true);
      word.textContent = labelFor(path);
      tl = gsap.timeline({ onComplete: finish });
      // Back/forward: the route already changed, so cover instantly (still before paint), then reveal.
      tl.set(curtain, { clipPath: SHAPE.covered, autoAlpha: 1, pointerEvents: 'auto' })
        .set(word, { y: 0, autoAlpha: 1 })
        .to(word, { y: -10, autoAlpha: 0, duration: 0.25, delay: 0.1 })
        .to(curtain, { clipPath: SHAPE.above, duration: DUR.reveal, ease: EASE.cover }, '<0.05');
      enterTail(tl);
    }
    timeline.current = tl;

    if (intro) {
      watchdog.current = gsap.delayedCall(8, () => {
        if (finished) return;
        tl.kill();
        if (items.length) gsap.set(items, { clearProps: 'transform,opacity,visibility' });
        finish();
      });
    }

    return () => {
      tl.kill();
      if (intro && !finished) prevPath.current = null; // StrictMode re-run must still play the intro
    };
  }, [location.pathname]);

  return (
    <TransitionContext.Provider value={{ go }}>
      {children}
      <div ref={curtainRef} className="motion-curtain" aria-hidden="true">
        <span ref={wordRef} className="motion-curtain-word" />
        <i>© KYYINFINITE</i>
      </div>
    </TransitionContext.Provider>
  );
}

function makeHandler(go, to, target, onClick) {
  return (event) => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || target === '_blank') return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    go(to);
  };
}

/** Drop-in for <Link> that routes through the page transition. */
export const TLink = forwardRef(function TLink({ to, onClick, target, ...rest }, ref) {
  const go = useTransitionNavigate();
  return <Link ref={ref} to={to} target={target} onClick={makeHandler(go, to, target, onClick)} {...rest} />;
});

/** Drop-in for <NavLink> that routes through the page transition. */
export const TNavLink = forwardRef(function TNavLink({ to, onClick, target, ...rest }, ref) {
  const go = useTransitionNavigate();
  return <NavLink ref={ref} to={to} target={target} onClick={makeHandler(go, to, target, onClick)} {...rest} />;
});
