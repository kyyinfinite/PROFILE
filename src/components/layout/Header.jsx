import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { gsap, MQ, EASE, prefersReducedMotion } from '../motion/gsap';
import { TLink, TNavLink } from '../motion/Motion';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useContent, useNavLinks } from '../../context/ContentProvider';

const SCROLL_THRESHOLD = 72;

/**
 * GLOBAL NAVIGATION (one component, every route)
 *
 * Desktop: inline links at the top. Past SCROLL_THRESHOLD the inline links fade out and a fixed round
 *          button takes over (the inline nav keeps its layout box, so nothing shifts).
 * Mobile:  the round button is always shown, top-right, inside the safe area.
 * Both:    the same <nav> is the fullscreen overlay. A circle grows from the button, links stagger in;
 *          closing plays the sequence in reverse. While closed in overlay mode the nav is `inert`
 *          (not focusable); while open, page scroll is locked and focus is trapped. Esc closes.
 */
export function Header() {
  const { pathname } = useLocation();
  const { contentValue } = useContent();
  const siteTitle = contentValue('site.title', 'Kyyinfinite®');
  const NAV_LINKS = useNavLinks();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isMobile = useMediaQuery(MQ.mobile);
  const overlayMode = isMobile || scrolled;

  const navRef = useRef(null);
  const toggleRef = useRef(null);
  const timelineRef = useRef(null);
  const openRef = useRef(false);
  const closingRef = useRef(false);
  const wasScrolled = useRef(false);
  openRef.current = open;

  const originFromToggle = () => {
    const rect = toggleRef.current?.getBoundingClientRect();
    return rect ? `${rect.left + rect.width / 2}px ${rect.top + rect.height / 2}px` : '92% 8%';
  };

  // Scroll state: one rAF-throttled listener; React ignores setState calls that do not change the value.
  useEffect(() => {
    let ticking = false;
    const update = () => { ticking = false; setScrolled(window.scrollY > SCROLL_THRESHOLD); };
    const onScroll = () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // The round button eases in when the desktop nav hands over to it.
  useLayoutEffect(() => {
    const toggle = toggleRef.current;
    const changed = scrolled !== wasScrolled.current;
    wasScrolled.current = scrolled;
    if (!changed || !scrolled || isMobile || !toggle || prefersReducedMotion()) return undefined;
    const tween = gsap.fromTo(toggle, { scale: 0.6, autoAlpha: 0 }, {
      scale: 1, autoAlpha: 1, duration: 0.45, ease: 'back.out(1.6)', clearProps: 'transform,opacity,visibility',
    });
    return () => tween.kill();
  }, [scrolled, isMobile]);

  // OPEN: set the closed clip-path before paint, then grow the circle and stagger the links.
  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!open || !nav) return undefined;
    const links = nav.querySelectorAll('a');
    const reset = () => gsap.set([nav, ...links], { clearProps: 'clipPath,opacity,visibility,pointerEvents,transform' });

    if (prefersReducedMotion()) {
      gsap.set(nav, { clipPath: 'inset(0 0 0 0)', autoAlpha: 1, pointerEvents: 'auto' });
      links[0]?.focus({ preventScroll: true });
      return reset;
    }

    const at = originFromToggle();
    timelineRef.current?.kill();
    timelineRef.current = gsap.timeline()
      .set(nav, { clipPath: `circle(0% at ${at})`, autoAlpha: 1, pointerEvents: 'auto' })
      .set(links, { x: 28, autoAlpha: 0 })
      .to(nav, { clipPath: `circle(155% at ${at})`, duration: 0.82, ease: EASE.cover })
      .to(links, { x: 0, autoAlpha: 1, duration: 0.46, stagger: 0.075, ease: EASE.out }, '-=0.12')
      .call(() => links[0]?.focus({ preventScroll: true }));
    return () => { timelineRef.current?.kill(); reset(); };
  }, [open]);

  // CLOSE: links leave first, then the circle collapses back into the button (reverse of opening).
  const close = useCallback(() => {
    if (!openRef.current || closingRef.current) return;
    const nav = navRef.current;
    const finish = () => {
      closingRef.current = false;
      setOpen(false);
      toggleRef.current?.focus({ preventScroll: true });
    };
    if (!nav || prefersReducedMotion()) { finish(); return; }
    closingRef.current = true;
    const links = nav.querySelectorAll('a');
    const at = originFromToggle();
    timelineRef.current?.kill();
    timelineRef.current = gsap.timeline({ onComplete: finish })
      .to(links, { x: 18, autoAlpha: 0, duration: 0.18, stagger: { each: 0.025, from: 'end' }, ease: EASE.in })
      .to(nav, { clipPath: `circle(0% at ${at})`, duration: 0.7, ease: EASE.cover }, '-=0.02');
  }, []);

  const toggle = () => (openRef.current ? close() : setOpen(true));

  // A route change (link, back/forward) closes the menu instantly; the page transition covers it anyway.
  useEffect(() => {
    if (!openRef.current) return;
    timelineRef.current?.kill();
    closingRef.current = false;
    setOpen(false);
  }, [pathname]);

  // Leaving overlay mode (resize/orientation) while open must not strand the overlay.
  useEffect(() => {
    if (open && !overlayMode) {
      timelineRef.current?.kill();
      closingRef.current = false;
      setOpen(false);
    }
  }, [open, overlayMode]);

  // Scroll lock exists only while the menu is open and is always removed on close/unmount.
  useEffect(() => {
    if (!open) return undefined;
    const root = document.documentElement;
    root.classList.add('is-menu-open');
    return () => root.classList.remove('is-menu-open');
  }, [open]);

  // Escape closes; Tab is trapped inside the overlay (button + links).
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); close(); return; }
      if (event.key !== 'Tab' || !navRef.current) return;
      const focusable = [toggleRef.current, ...navRef.current.querySelectorAll('a')].filter(Boolean);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, close]);

  // Choosing the page you are already on just closes the overlay.
  const closeIfCurrent = (to) => () => { if (openRef.current && window.location.pathname === to) close(); };

  return (
    <header className={`header header-home${scrolled ? ' header-scrolled' : ''}${open ? ' header-menu-open' : ''}`}>
      <TLink to="/" className="brand" aria-label={`${siteTitle} — portfolio home`} onClick={closeIfCurrent('/')}>
        © {siteTitle.replace(/®/g, "")}
      </TLink>

      <button
        ref={toggleRef}
        type="button"
        className={`menu-toggle${scrolled ? ' is-scrolled' : ''}`}
        onClick={toggle}
        aria-expanded={open}
        aria-controls="primary-navigation"
        aria-label={open ? 'Close menu' : 'Open menu'}
      >
        {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        <span>{open ? 'Close' : 'Menu'}</span>
      </button>

      <nav
        id="primary-navigation"
        ref={navRef}
        className={`nav${open ? ' open' : ''}${scrolled ? ' nav-scrolled' : ''}`}
        aria-label="Main navigation"
        inert={overlayMode && !open}
      >
        {NAV_LINKS.map(({ to, label, count, arrow }) => (
          <TNavLink key={to} to={to} onClick={closeIfCurrent(to)}>
            {label}
            {count && <sup>{count}</sup>}
            {arrow && <ArrowUpRight size={14} aria-hidden="true" />}
          </TNavLink>
        ))}
      </nav>
    </header>
  );
}
