import { useCallback, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { gsap, prefersReducedMotion } from '../motion/gsap';

/**
 * Full-screen image viewer shared by Gallery and Awards.
 * GSAP: backdrop fades, the image scales/slides in, and closing plays out before unmounting.
 * A11y: role=dialog + aria-modal, focus moves to Close and is trapped, Esc / ← / → work, focus returns to the opener,
 * background scroll is locked while open.
 */
export function Lightbox({ items, index, onClose, onIndex }) {
  const rootRef = useRef(null);
  const figureRef = useRef(null);
  const closeRef = useRef(null);
  const openerRef = useRef(typeof document !== 'undefined' ? document.activeElement : null);
  const closingRef = useRef(false);
  const item = items[index];
  const total = items.length;

  const close = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) { onClose(); return; }
    gsap.timeline({ onComplete: onClose })
      .to(figureRef.current, { y: 24, scale: 0.97, autoAlpha: 0, duration: 0.28, ease: 'power2.in' })
      .to(root, { autoAlpha: 0, duration: 0.25, ease: 'power1.out' }, '-=0.12');
  }, [onClose]);

  const step = useCallback((direction) => {
    if (total < 2) return;
    onIndex((index + direction + total) % total);
  }, [index, total, onIndex]);

  // Open animation + scroll lock + focus handoff.
  useEffect(() => {
    const root = rootRef.current;
    const html = document.documentElement;
    html.classList.add('is-lightbox-open');
    closeRef.current?.focus({ preventScroll: true });
    const opener = openerRef.current;
    if (!prefersReducedMotion()) {
      gsap.fromTo(root, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35, ease: 'power2.out' });
    }
    return () => {
      html.classList.remove('is-lightbox-open');
      opener?.focus?.({ preventScroll: true });
    };
  }, []);

  // Each new image slides/scales in.
  useEffect(() => {
    if (prefersReducedMotion() || !figureRef.current) return undefined;
    const tween = gsap.fromTo(figureRef.current, { y: 22, scale: 0.97, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: 0.55, ease: 'power3.out' });
    return () => tween.kill();
  }, [index]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); close(); }
      else if (event.key === 'ArrowRight') step(1);
      else if (event.key === 'ArrowLeft') step(-1);
      else if (event.key === 'Tab' && rootRef.current) {
        const focusable = [...rootRef.current.querySelectorAll('button:not([disabled])')];
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [close, step]);

  if (!item) return null;
  return (
    <div ref={rootRef} className="lightbox" role="dialog" aria-modal="true" aria-label={item.title || 'Image viewer'} onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
      <div className="lightbox-top">
        <span className="lightbox-count">{String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
        <button ref={closeRef} type="button" className="lightbox-btn" onClick={close} aria-label="Tutup"><X size={22} aria-hidden="true" /></button>
      </div>
      <figure ref={figureRef} className="lightbox-figure">
        <img src={item.src} alt={item.alt || item.title || ''} decoding="async" />
        {(item.title || item.caption) && (
          <figcaption>{item.title && <strong>{item.title}</strong>}{item.caption && <span>{item.caption}</span>}</figcaption>
        )}
      </figure>
      {total > 1 && (
        <div className="lightbox-nav">
          <button type="button" className="lightbox-btn" onClick={() => step(-1)} aria-label="Sebelumnya"><ArrowLeft size={22} aria-hidden="true" /></button>
          <button type="button" className="lightbox-btn" onClick={() => step(1)} aria-label="Berikutnya"><ArrowRight size={22} aria-hidden="true" /></button>
        </div>
      )}
    </div>
  );
}
