import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, Image as ImageIcon } from 'lucide-react';
import { gsap, MQ, ScrollTrigger } from '../components/motion/gsap';
import { Page } from '../components/ui/Page';
import { PageHeading } from '../components/ui/Sections';
import { StatsRow } from '../components/ui/StatsRow';
import { Lightbox } from '../components/ui/Lightbox';
import { Reveal } from '../components/motion/Motion';
import { useAwards } from '../context/ContentProvider';
import { AWARD_LEVELS, levelLabel } from '../data/awards';

const ALL = 'Semua';

/** Awards & recognition: count-up stats, level filter, rows with a hover accent line, optional certificate viewer. */
export function Awards() {
  const awards = useAwards();
  const [filter, setFilter] = useState(ALL);
  const [active, setActive] = useState(-1);
  const listRef = useRef(null);

  const levels = useMemo(() => AWARD_LEVELS.filter((level) => awards.some((award) => award.level === level.id)), [awards]);
  const filters = [ALL, ...levels.map((level) => level.id)];
  useEffect(() => { if (!filters.includes(filter)) setFilter(ALL); }, [filters.join('|'), filter]); // eslint-disable-line react-hooks/exhaustive-deps
  const visible = useMemo(() => awards.filter((award) => filter === ALL || award.level === filter), [awards, filter]);

  const stats = useMemo(() => [
    { label: 'Penghargaan', value: awards.length },
    { label: 'Juara 1', value: awards.filter((award) => /^juara\s*1$/i.test(award.rank || '')).length },
    { label: 'Tingkat nasional+', value: awards.filter((award) => ['nasional', 'internasional'].includes(award.level)).length },
    { label: 'Finalis', value: awards.filter((award) => /finalis/i.test(award.rank || '')).length },
  ], [awards]);

  // Rows with certificates open in the lightbox; navigation stays within those items.
  const certificates = useMemo(() => visible.filter((award) => award.image).map((award) => ({ id: award.id, src: award.image, alt: `Sertifikat ${award.title}`, title: award.title, caption: [award.issuer, award.awarded_year].filter(Boolean).join(' · ') })), [visible]);

  // The accent rule under each row draws in on scroll (scrub), so it reverses when scrolling back.
  useEffect(() => {
    if (!listRef.current) return undefined;
    const mm = gsap.matchMedia();
    mm.add({ motion: MQ.motion, reduce: MQ.reduced }, (context) => {
      if (context.conditions.reduce) return;
      gsap.utils.toArray('.award-rule').forEach((rule) => {
        gsap.fromTo(rule, { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: rule, start: 'top 92%', end: 'top 62%', scrub: 0.4 } });
      });
    }, listRef);
    return () => mm.revert();
  }, [visible]);
  useEffect(() => { const id = requestAnimationFrame(() => ScrollTrigger.refresh()); return () => cancelAnimationFrame(id); }, [visible]);

  const openCertificate = (id) => { const index = certificates.findIndex((item) => item.id === id); if (index >= 0) setActive(index); };

  return (
    <Page shell={false}>
      <section className="page-shell work-intro">
        <PageHeading
          eyebrow="PRESTASI · PENGHARGAAN · SERTIFIKAT"
          title={<>Penghargaan <em>&amp; prestasi</em></>}
          intro="Pengakuan dari lomba, program, dan kegiatan sekolah — dari gelanggang silat sampai kompetisi coding."
        />
      </section>

      <section className="work-section awards-section section-pad" aria-label="Daftar penghargaan">
        <StatsRow stats={stats} />
        {filters.length > 2 && (
          <div className="filters" role="group" aria-label="Filter tingkat">
            {filters.map((id) => {
              const total = id === ALL ? awards.length : awards.filter((award) => award.level === id).length;
              return <button type="button" key={id} className={filter === id ? 'active' : ''} aria-pressed={filter === id} onClick={() => setFilter(id)}>{id === ALL ? ALL : levelLabel(id)} <sup>{total}</sup></button>;
            })}
          </div>
        )}

        <ol ref={listRef} key={filter} className="award-list">
          {!visible.length && <li className="page-intro">Belum ada penghargaan di kategori ini.</li>}
          {visible.map((award, index) => (
            <Reveal as="li" key={award.id} className={`award-row${award.featured ? ' is-featured' : ''}`} delay={Math.min(index, 4) * 0.04} distance={26}>
              <span className="eyebrow award-index">{String(index + 1).padStart(2, '0')}</span>
              <div className="award-main">
                <h3>{award.title}</h3>
                <p className="award-issuer">{[award.issuer, award.awarded_year].filter(Boolean).join(' · ')}</p>
                {award.description && <p className="award-desc">{award.description}</p>}
              </div>
              <div className="award-tags">
                {award.rank && <span className="award-rank">{award.rank}</span>}
                {award.level && <span className="award-level">{levelLabel(award.level)}</span>}
              </div>
              <div className="award-actions">
                {award.image && <button type="button" className="award-icon" onClick={() => openCertificate(award.id)} aria-label={`Lihat sertifikat ${award.title}`}><ImageIcon size={18} aria-hidden="true" /></button>}
                {award.credential_url && <a className="award-icon" href={award.credential_url} target="_blank" rel="noreferrer" aria-label={`Buka tautan ${award.title}`}><ArrowUpRight size={18} aria-hidden="true" /></a>}
              </div>
              <span className="award-rule" aria-hidden="true" />
            </Reveal>
          ))}
        </ol>
      </section>

      {active >= 0 && <Lightbox items={certificates} index={Math.min(active, certificates.length - 1)} onIndex={setActive} onClose={() => setActive(-1)} />}
    </Page>
  );
}
