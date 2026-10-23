import { useEffect, useMemo, useRef, useState } from 'react';
import { gsap, MQ, ScrollTrigger } from '../components/motion/gsap';
import { Page } from '../components/ui/Page';
import { PageHeading } from '../components/ui/Sections';
import { Reveal } from '../components/motion/Motion';
import { Lightbox } from '../components/ui/Lightbox';
import { useGallery } from '../context/ContentProvider';

const ALL = 'Semua';
const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(date);
};

/** Documentation gallery: masonry columns, scrubbed image settle, hover caption, and an accessible lightbox. */
export function Gallery() {
  const items = useGallery();
  const [filter, setFilter] = useState(ALL);
  const [active, setActive] = useState(-1);
  const gridRef = useRef(null);

  const categories = useMemo(() => [ALL, ...new Set(items.map((item) => item.category).filter(Boolean))], [items]);
  useEffect(() => { if (!categories.includes(filter)) setFilter(ALL); }, [categories, filter]);
  const visible = useMemo(() => items.filter((item) => filter === ALL || item.category === filter), [items, filter]);
  const slides = useMemo(() => visible.map((item) => ({ src: item.image, alt: item.alt_text || item.title, title: item.title, caption: [item.caption, formatDate(item.taken_on)].filter(Boolean).join(' · ') })), [visible]);

  // Each image starts slightly zoomed and settles as it crosses the viewport (scrubbed, reversible).
  useEffect(() => {
    if (!gridRef.current) return undefined;
    const mm = gsap.matchMedia();
    mm.add({ motion: MQ.motion, reduce: MQ.reduced, mobile: MQ.mobile }, (context) => {
      const { reduce, mobile } = context.conditions;
      if (reduce) return;
      gsap.utils.toArray('.gallery-frame img').forEach((image) => {
        gsap.fromTo(image, { scale: mobile ? 1.06 : 1.14 }, {
          scale: 1, ease: 'none',
          scrollTrigger: { trigger: image.parentElement, start: 'top bottom', end: 'center 55%', scrub: mobile ? 0.25 : 0.5, invalidateOnRefresh: true },
        });
      });
    }, gridRef);
    return () => mm.revert();
  }, [visible]);
  useEffect(() => { const id = requestAnimationFrame(() => ScrollTrigger.refresh()); return () => cancelAnimationFrame(id); }, [visible]);

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
        {categories.length > 2 && (
          <div className="filters" role="group" aria-label="Filter galeri">
            {categories.map((item) => {
              const total = item === ALL ? items.length : items.filter((entry) => entry.category === item).length;
              return <button type="button" key={item} className={filter === item ? 'active' : ''} aria-pressed={filter === item} onClick={() => setFilter(item)}>{item} <sup>{total}</sup></button>;
            })}
          </div>
        )}

        {!items.length ? (
          <Reveal className="gallery-empty">
            <p className="eyebrow">SEGERA HADIR</p>
            <h2>Foto kegiatan sedang dikurasi.</h2>
            <p>Dokumentasi akan muncul di sini setelah diunggah lewat halaman admin.</p>
          </Reveal>
        ) : (
          <div ref={gridRef} key={filter} className="gallery-grid">
            {visible.map((item, index) => (
              <Reveal key={item.id} className="gallery-item" delay={(index % 3) * 0.07} distance={38}>
                <button type="button" className="gallery-frame" style={{ aspectRatio: item.width && item.height ? `${item.width} / ${item.height}` : '4 / 5' }} onClick={() => setActive(index)} aria-label={`Buka foto: ${item.title || item.alt_text || `foto ${index + 1}`}`}>
                  <img src={item.image} alt={item.alt_text || item.title || ''} width={item.width || undefined} height={item.height || undefined} loading={index < 3 ? 'eager' : 'lazy'} decoding="async" />
                  <span className="gallery-hover"><span className="eyebrow">{item.category}</span>{item.title && <strong>{item.title}</strong>}</span>
                </button>
                {(item.title || item.taken_on) && (
                  <div className="gallery-meta"><span>{item.title}</span><span>{formatDate(item.taken_on)}</span></div>
                )}
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {active >= 0 && <Lightbox items={slides} index={Math.min(active, slides.length - 1)} onIndex={setActive} onClose={() => setActive(-1)} />}
    </Page>
  );
}
