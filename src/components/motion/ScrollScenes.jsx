import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { gsap, ScrollTrigger, MQ } from './gsap';
import { useContent } from '../../context/ContentProvider';

/**
 * Route-level scroll motion (scoped by gsap.matchMedia, fully reverted on route change/unmount).
 *  - .camera-scene      sections settle upward by a few pixels as they enter
 *  - media parallax     project / detail / gallery artwork eases from slightly zoomed to rest
 *  - .parallax-media    about portrait drifts inside its fixed frame
 * Only transforms are animated, so no layout shift and no horizontal overflow.
 */
export function ScrollScenes() {
  const { pathname } = useLocation();
  const { version } = useContent();

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add({ motion: MQ.motion, reduce: MQ.reduced, mobile: MQ.mobile }, (context) => {
      const { reduce, mobile } = context.conditions;
      if (reduce) return;
      const scrub = (desktop, small) => (mobile ? small : desktop);

      gsap.utils.toArray('.camera-scene').forEach((section) => {
        gsap.fromTo(section, { y: mobile ? 10 : 18 }, {
          y: 0,
          ease: 'none',
          scrollTrigger: { trigger: section, start: 'top bottom', end: 'top 35%', scrub: scrub(0.45, 0.2), invalidateOnRefresh: true },
        });
      });

      gsap.utils.toArray('.project-visual .artwork, .detail-art .artwork, .gallery-art .artwork').forEach((media) => {
        gsap.fromTo(media, { scale: mobile ? 1.035 : 1.09 }, {
          scale: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: media.closest('.project-visual, .detail-art, .gallery-art') || media,
            start: 'top bottom',
            end: 'center center',
            scrub: scrub(0.45, 0.2),
            invalidateOnRefresh: true,
          },
        });
      });

      gsap.utils.toArray('.parallax-media img').forEach((image) => {
        gsap.fromTo(image, { yPercent: mobile ? -4 : -8 }, {
          yPercent: mobile ? 4 : 8,
          ease: 'none',
          scrollTrigger: { trigger: image.parentElement, start: 'top bottom', end: 'bottom top', scrub: scrub(0.6, 0.3), invalidateOnRefresh: true },
        });
      });
    });
    return () => mm.revert();
  }, [pathname, version]);

  // Recalculate trigger positions once fonts and images have settled.
  useEffect(() => {
    let timer;
    let active = true;
    const refresh = () => { if (!active) return; clearTimeout(timer); timer = window.setTimeout(() => { if (active) ScrollTrigger.refresh(); }, 120); };
    const onImageLoad = () => refresh();
    window.addEventListener('load', refresh);
    document.addEventListener('load', onImageLoad, true);
    document.fonts?.ready.then(refresh);
    refresh();
    return () => { active = false; clearTimeout(timer); window.removeEventListener('load', refresh); document.removeEventListener('load', onImageLoad, true); };
  }, [version]);

  return null;
}
