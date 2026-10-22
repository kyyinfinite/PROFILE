import { useEffect, useRef } from 'react';
import { gsap, MQ, DUR, EASE } from './gsap';
import { TLink } from './PageTransition';
import { onPageReady } from './pageState';

/** Scroll-triggered reveal with scoped cleanup. Transform/opacity only, so it never causes layout shift. */
export function Reveal({ children, className = '', delay = 0, distance = 34, as: Tag = 'div' }) {
  const elementRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return undefined;
    const mm = gsap.matchMedia();
    mm.add({ motion: MQ.motion, reduce: MQ.reduced }, (context) => {
      if (context.conditions.reduce) return undefined;
      gsap.set(element, { y: distance, autoAlpha: 0 });
      return onPageReady(() => {
        context.add(() => {
          gsap.to(element, {
            y: 0,
            autoAlpha: 1,
            duration: DUR.enter + 0.15,
            delay,
            ease: 'power4.out',
            clearProps: 'transform,opacity,visibility',
            scrollTrigger: { trigger: element, start: 'top 88%', once: true },
          });
        });
      });
    });
    return () => mm.revert();
  }, [delay, distance]);

  return <Tag ref={elementRef} className={className}>{children}</Tag>;
}

/** Link with a small magnetic pull. Fine pointers only; never on touch or reduced motion. */
export function MagneticLink({ to, children, className = '', ...rest }) {
  const linkRef = useRef(null);

  useEffect(() => {
    const element = linkRef.current;
    return () => { if (element) gsap.killTweensOf(element); };
  }, []);

  const handlePointerMove = (event) => {
    if (!window.matchMedia(MQ.finePointer).matches || window.matchMedia(MQ.reduced).matches || !linkRef.current) return;
    const bounds = linkRef.current.getBoundingClientRect();
    gsap.to(linkRef.current, {
      x: (event.clientX - bounds.left - bounds.width / 2) * 0.12,
      y: (event.clientY - bounds.top - bounds.height / 2) * 0.12,
      duration: 0.35,
      ease: EASE.out,
      overwrite: 'auto',
    });
  };

  const resetPosition = () => {
    if (!linkRef.current) return;
    gsap.to(linkRef.current, { x: 0, y: 0, duration: 0.55, ease: 'elastic.out(1, .45)', overwrite: 'auto' });
  };

  return (
    <TLink
      ref={linkRef}
      to={to}
      className={className}
      onMouseMove={handlePointerMove}
      onMouseLeave={resetPosition}
      {...rest}
    >
      {children}
    </TLink>
  );
}
