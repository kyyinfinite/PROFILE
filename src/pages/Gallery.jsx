import { useEffect, useMemo, useRef, useState } from 'react';
import { gsap, MQ, EASE, DUR, ScrollTrigger, prefersReducedMotion } from '../components/motion/gsap';
import { Page } from '../components/ui/Page';
import { PageHeading } from '../components/ui/Sections';
import { Reveal, onPageReady } from '../components/motion/Motion';
import { Lightbox } from '../components/ui/Lightbox';
import { useGallery } from '../context/ContentProvider';

const ALL = 'Semua';
const CLIP_HIDDEN = 'inset(0% 0% 100% 0%)';
const CLIP_SHOWN = 'inset(0% 0% 0% 0%)';

// Camera filenames (IMG_2026…, WA0076, DSC…) are not real titles; hide them from the UI.
const isFilename = (text = '') => /^(img|dsc|pxl|wa|vid|screenshot|photo)[\s_-]*\d/i.test(text.trim()) || /^[\d\s_-]{6,}$/.test(text.trim());
const cleanTitle = (text = '') => (isFilename(text) ? '' : text.trim());
const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(date);
};

/**
 * Editorial gallery.
 * Layout: a rhythm of wide / tall / square frames on a 12-column grid (desktop) and a 2-column stagger (tablet, phone).
 * Motion (shared curves from motion/gsap.js): batched reveal with a clip-path wipe (EASE.cover) + rise (EASE.out),
 * scrubbed parallax inside each frame, filter out/in transition, lightbox for full view.
 */
export function Gallery() {
  const items = useGallery();
  const [filter, setFilter] = useState(ALL);
  const [active, setActive] = useState(-1);
  const gridRef = useRef(null);
  const switchingRef = useRef(false);

  const categories = useMemo(() => [ALL, ...new Set(items.map((item) => item.category).filter(Boolean))], [items]);
  useEffect(() => { if (!categories.includes(filter)) setFilter(ALL); }, [categories, filter]);
  const visible = useMemo(() => items.filter((item) => filter === ALL || item.category === filter), [items, filter]);
  const slides = useMemo(() => visible.map((item) => ({
    src: item.image, alt: item.alt_text || cleanTitle(item.title) || `Foto kegiatan ${item.category || ''}`.trim(),
    title: cleanTitle(item.title), caption: [item.caption, formatDate(item.taken_on)].filter(Boolean).join(' · '),
  })), [visible]);

  // Batched reveal + scrubbed parallax. Hidden state is applied immediately and released once the page curtain has opened.
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return undefined;
    const mm = gsap.matchMedia();
    mm.add({ motion: MQ.motion, reduce: MQ.reduced, mobile: MQ.mobile }, (context) => {
      const { reduce, mobile } = context.conditions;
      if (reduce) return undefined;
      const cards = gsap.utils.toArray('.gallery-item', grid);
      const frames = cards.map((card) => card.querySelector('.gallery-frame'));
      gsap.set(cards, { autoAlpha: 0, y: mobile ? 28 : 44 });
      gsap.set(frames, { clipPath: CLIP_HIDDEN });

      const cancelWait = onPageReady(() => {
        context.add(() => {
          ScrollTrigger.batch(cards, {
            start: 'top 90%',
            once: true,
            onEnter: (batch) => {
              batch.forEach((card, i) => {
                const frame = card.querySelector('.gallery-frame');
                gsap.timeline({ delay: i * DUR.stagger * 1.4, defaults: { overwrite: 'auto' } })
                  .to(card, { autoAlpha: 1, y: 0, duration: DUR.enter + 0.15, ease: EASE.out, clearProps: 'transform,opacity,visibility' }, 0)
                  .to(frame, { clipPath: CLIP_SHOWN, duration: DUR.reveal + 0.1, ease: EASE.cover, clearProps: 'clipPath' }, 0);
              });
            },
          });

          // The photo drifts slightly inside its frame as it crosses the viewport (reversible).
          frames.forEach((frame) => {
            const image = frame.querySelector('img');
            gsap.fromTo(image, { yPercent: mobile ? -4 : -7 }, {
              yPercent: mobile ? 4 : 7, ease: 'none',
              scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: mobile ? 0.3 : 0.6, invalidateOnRefresh: true },
            });
          });
        });
      });
      return () => cancelWait();
    }, grid);
    return () => mm.revert();
  }, [visible]);
  useEffect(() => { const id = requestAnimationFrame(() => ScrollTrigger.refresh()); return () => cancelAnimationFrame(id); }, [visible]);

  // Filter change: current cards leave (EASE.in), then the new set mounts and plays its own entrance.
  const changeFilter = (next) => {
    if (next === filter || switchingRef.current) return;
    const cards = gridRef.current ? gsap.utils.toArray('.gallery-item', gridRef.current) : [];
    if (!cards.length || prefersReducedMotion()) { setFilter(next); return; }
    switchingRef.current = true;
    gsap.to(cards, {
      autoAlpha: 0, y: -14, duration: 0.28, ease: EASE.in, stagger: { each: 0.018, from: 'start' },
      onComplete: () => {
        setFilter(next);
        switchingRef.current = false;
        window.scrollTo({ top: Math.min(window.scrollY, (gridRef.current?.getBoundingClientRect().top || 0) + window.scrollY - 140), behavior: 'auto' });
      },
    });
  };

  return (
    <Page shell={false}>
      <section className="page-shell work-intro">
        <PageHeading
          eyebrow="DOKUMENTASI · KEGIATAN"
          title={<>Galeri <em>kegiatan</em></>}
          intro="Potongan momen dari lapangan, tenda, panggung, dan ruang kelas — dokumentasi perjalanan organisasi dan belajar."
        />
      </section>

      <section className="work-section gallery-section section-pad" aria-label="Galeri foto">
        <div className="gallery-toolbar">
          {categories.length > 2 ? (
            <div className="filters" role="group" aria-label="Filter galeri">
              {categories.map((item) => {
                const total = item === ALL ? items.length : items.filter((entry) => entry.category === item).length;
                return <button type="button" key={item} className={filter === item ? 'active' : ''} aria-pressed={filter === item} onClick={() => changeFilter(item)}>{item} <sup>{total}</sup></button>;
              })}
            </div>
          ) : <span />}
          {items.length > 0 && <p className="gallery-count"><strong>{String(visible.length).padStart(2, '0')}</strong> foto <span>· ketuk untuk memperbesar</span></p>}
        </div>

        {!items.length ? (
          <Reveal className="gallery-empty">
            <p className="eyebrow">SEGERA HADIR</p>
            <h2>Foto kegiatan sedang dikurasi.</h2>
            <p>Dokumentasi akan muncul di sini setelah diunggah lewat halaman admin.</p>
          </Reveal>
        ) : (
          <div ref={gridRef} key={filter} className="gallery-grid">
            {visible.map((item, index) => {
              const title = cleanTitle(item.title);
              const date = formatDate(item.taken_on);
              return (
                <figure key={item.id} className="gallery-item">
                  <button type="button" className="gallery-frame" onClick={() => setActive(index)} aria-label={`Buka foto ${index + 1}${title ? `: ${title}` : ''}`}>
                    <img src={item.image} alt={item.alt_text || title || `Foto kegiatan ${item.category || ''}`.trim()} width={item.width || undefined} height={item.height || undefined} loading={index < 4 ? 'eager' : 'lazy'} decoding="async" />
                    <span className="gallery-view" aria-hidden="true">Lihat</span>
                  </button>
                  <figcaption className="gallery-meta">
                    <span className="eyebrow">{String(index + 1).padStart(2, '0')} — {item.category}</span>
                    {date && <span className="gallery-date">{date}</span>}
                    {title && <strong className="gallery-title">{title}</strong>}
                  </figcaption>
                </figure>
              );
            })}
          </div>
        )}
      </section>

      {active >= 0 && <Lightbox items={slides} index={Math.min(active, slides.length - 1)} onIndex={setActive} onClose={() => setActive(-1)} />}
    </Page>
  );
}
