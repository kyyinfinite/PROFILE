import { useEffect, useRef } from 'react';
import { gsap, MQ } from './gsap';

/** Desktop-only label / project-preview cursor. Not mounted behaviour on touch or reduced motion. */
export function CursorFollower() {
  const cursorRef = useRef(null);
  const labelRef = useRef(null);
  const previewRef = useRef(null);

  useEffect(() => {
    if (!window.matchMedia(MQ.finePointer).matches || window.matchMedia(MQ.reduced).matches) return undefined;
    const cursor = cursorRef.current;
    if (!cursor) return undefined;

    gsap.set(cursor, { xPercent: -50, yPercent: -50, scale: 0.72 });
    const moveX = gsap.quickTo(cursor, 'x', { duration: 0.24, ease: 'power3.out' });
    const moveY = gsap.quickTo(cursor, 'y', { duration: 0.24, ease: 'power3.out' });

    const handlePointerMove = (event) => {
      moveX(event.clientX);
      moveY(event.clientY);
      cursor.classList.add('is-visible');
    };

    const handlePointerOver = (event) => {
      const target = event.target instanceof Element ? event.target.closest('[data-cursor]') : null;
      if (!target) {
        cursor.classList.remove('is-active', 'is-preview');
        previewRef.current?.replaceChildren();
        return;
      }
      labelRef.current.textContent = target.dataset.cursor || 'View';
      cursor.classList.add('is-active');
      const artwork = target.querySelector('.artwork');
      if (artwork && previewRef.current) {
        previewRef.current.replaceChildren(artwork.cloneNode(true));
        cursor.classList.add('is-preview');
      } else {
        cursor.classList.remove('is-preview');
        previewRef.current?.replaceChildren();
      }
    };

    const handlePointerOut = (event) => {
      if (!event.relatedTarget) cursor.classList.remove('is-visible', 'is-active', 'is-preview');
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.addEventListener('pointerover', handlePointerOver);
    document.addEventListener('pointerout', handlePointerOut);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerover', handlePointerOver);
      document.removeEventListener('pointerout', handlePointerOut);
      gsap.killTweensOf(cursor);
    };
  }, []);

  return (
    <div className="cursor-follower" ref={cursorRef} aria-hidden="true">
      <div className="cursor-preview" ref={previewRef} />
      <span ref={labelRef}>View</span>
    </div>
  );
}
