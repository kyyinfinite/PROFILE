import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { gsap, MQ, ScrollTrigger } from '../components/motion/gsap';
import { Page } from '../components/ui/Page';
import { PageHeading } from '../components/ui/Sections';
import { AffiliationLogos } from '../components/ui/AffiliationLogos';
import { StatsRow } from '../components/ui/StatsRow';
import { Reveal, TLink } from '../components/motion/Motion';
import { JOURNEY, JOURNEY_FILTERS, JOURNEY_LEVELS, journeyStats } from '../data/journey';

function JourneyLevel({ level, items }) {
  const sectionRef = useRef(null);
  const fillRef = useRef(null);
  const count = items.length;

  // The vertical line draws itself with scroll and un-draws when scrolling back (scrub).
  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add({ motion: MQ.motion, reduce: MQ.reduced }, (context) => {
      if (context.conditions.reduce) return;
      gsap.fromTo(fillRef.current, { scaleY: 0 }, {
        scaleY: 1, ease: 'none',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 72%', end: 'bottom 72%', scrub: 0.4, invalidateOnRefresh: true },
      });
    }, sectionRef);
    return () => mm.revert();
  }, [count]);

  return (
    <section ref={sectionRef} className="journey-level" aria-label={`${level.title} — ${level.place}`}>
      <Reveal className="journey-level-head" distance={22}>
        <p className="eyebrow">{level.period}</p>
        <h2>{level.title}<span className="period">.</span></h2>
        <p className="journey-place">{level.place}</p>
        {level.now && <span className="journey-now"><i aria-hidden="true" />Sekarang</span>}
      </Reveal>
      <ol className="journey-list">
        <span className="journey-line" aria-hidden="true"><span ref={fillRef} className="journey-line-fill" /></span>
        {items.map((item, index) => (
          <Reveal as="li" key={item.id} className={`journey-item${item.champion ? ' is-champion' : ''}`} delay={Math.min(index, 3) * 0.05} distance={28}>
            <span className="journey-dot" aria-hidden="true" />
            <p className="eyebrow">{item.category} · {item.place}</p>
            <h3>{item.title}</h3>
            <p className="journey-copy">{item.copy}</p>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}

export function Journey() {
  const [filter, setFilter] = useState('Semua');
  const stats = useMemo(journeyStats, []);
  const visible = JOURNEY.filter((item) => filter === 'Semua' || item.category === filter);
  // Filtering changes page height; let ScrollTrigger recalculate once the new rows are in the DOM.
  useEffect(() => { const id = requestAnimationFrame(() => ScrollTrigger.refresh()); return () => cancelAnimationFrame(id); }, [filter]);

  return (
    <Page shell={false}>
      <section className="page-shell work-intro">
        <PageHeading
          eyebrow="ORGANISASI · PRESTASI · KEGIATAN"
          title={<>Perjalanan <em>saya</em></>}
          intro="Dari lapangan silat dan tenda Pramuka sampai ruang kelas SMA — riwayat organisasi, prestasi, dan kegiatan yang membentuk cara saya memimpin dan belajar."
        />
      </section>

      <section className="work-section journey-section section-pad" aria-label="Riwayat perjalanan">
        <StatsRow stats={stats} />
        <div className="filters" role="group" aria-label="Filter riwayat">
          {JOURNEY_FILTERS.map((item) => {
            const total = item === 'Semua' ? JOURNEY.length : JOURNEY.filter((entry) => entry.category === item).length;
            return <button type="button" key={item} className={filter === item ? 'active' : ''} aria-pressed={filter === item} onClick={() => setFilter(item)}>{item} <sup>{total}</sup></button>;
          })}
        </div>
        {JOURNEY_LEVELS.map((level) => {
          const items = visible.filter((item) => item.level === level.id);
          return items.length ? <JourneyLevel key={`${level.id}-${filter}`} level={level} items={items} /> : null;
        })}

        <Reveal className="journey-affiliations">
          <p className="eyebrow">TERHUBUNG DENGAN</p>
          <AffiliationLogos />
          <TLink className="text-link" to="/work">Lihat project AI &amp; Python saya <ArrowUpRight size={16} /></TLink>
        </Reveal>
      </section>
    </Page>
  );
}
