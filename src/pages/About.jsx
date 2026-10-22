import { Page } from '../components/ui/Page';
import { PageHeading, SectionHeading, PageCta } from '../components/ui/Sections';
import { Reveal } from '../components/motion/Motion';
import { FaqSection } from '../components/home/HomeSections';
import { useContent, useExperience, useSkills } from '../context/ContentProvider';
import { RichText } from '../components/ui/RichText';
import { supabase } from '../lib/supabase';
import { ArrowUpRight } from 'lucide-react';

const FALLBACK_MILESTONES = [
  ['Silat achievements', 'First-place finishes in silat competitions at international, national, provincial, and district levels.'],
  ['Google Jagoan Coding', 'Top 50 finalists in the Google Jagoan Coding program during SMP.'],
  ['Pramuka Garuda', 'Reached the highest scouting level during SMP.'],
  ['Leadership & speaking', 'School and district-level student organizations, and a leadership webinar talk.'],
];

function storageImage(path) {
  if (!path || typeof path !== 'string' || !supabase) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const cleanPath = path.replace(/^\/+/, '').replace(/^portfolio\//, '');
  return supabase.storage.from('portfolio').getPublicUrl(cleanPath).data?.publicUrl || '';
}

export function About() {
  const SKILLS = useSkills();
  const EXPERIENCE = useExperience();
  const { contentValue, milestones, ready } = useContent();
  const portraitSrc = storageImage(contentValue('about.portrait_path', ''));
  const achievements = ready && milestones.length ? milestones.map((item) => [item.title, item.copy]) : FALLBACK_MILESTONES;

  return (
    <Page className="about-page about-editorial">
      <PageHeading
        eyebrow={contentValue('about.eyebrow', 'A PERSON BEHIND THE PROJECTS')}
        title={<RichText value={contentValue('about.heading', 'Curious by\n*nature*')} />}
        intro={contentValue('about.intro', 'I’m Ripki Dwi Putra, a high school student exploring AI architecture, Python development, and the ideas behind intelligent systems.')}
      />

      <section className="about-feature about-editorial-feature">
        <Reveal as="figure" className={`about-portrait about-editorial-portrait${portraitSrc ? ' has-portrait' : ' no-portrait'}`} distance={28}>
          {portraitSrc ? <img src={portraitSrc} alt="Portrait of Ripki Dwi Putra" loading="lazy" decoding="async" width="1200" height="1500" /> : (
            <div className="about-portrait-placeholder" role="img" aria-label="Profile photo can be uploaded from the admin page">
              <span className="eyebrow">KYYINFINITE / ABOUT</span><span className="about-placeholder-mark">K.</span><span className="about-placeholder-note">Portrait managed in Admin → Site content → About</span>
            </div>
          )}
          <figcaption className="about-image-caption"><span>RIPKI DWI PUTRA</span><span>STUDENT · BUILDER · LEARNER</span></figcaption>
        </Reveal>
        <div className="about-story about-editorial-story">
          <Reveal>
            <p className="eyebrow">{contentValue('about.story.eyebrow', 'ALWAYS EXPLORING')}</p>
            <h2><RichText value={contentValue('about.story', 'I believe progress comes from staying curious, learning the fundamentals, and turning ideas into *something real*.')} /></h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="about-secondary-copy">{contentValue('about.secondary', 'Right now, I’m learning by building small Python projects, studying how AI systems are structured, and testing ideas one experiment at a time. I’m still at the beginning—and that is what makes the process exciting.')}</p>
          </Reveal>
          <Reveal delay={0.12}>
            <div className="about-facts">
              <div><span className="eyebrow">{contentValue('about.fact1.label', 'CURRENTLY')}</span><p>{contentValue('about.fact1.copy', 'A high school student exploring AI architecture and Python development.')}</p></div>
              <div><span className="eyebrow">{contentValue('about.fact2.label', 'MY APPROACH')}</span><p>{contentValue('about.fact2.copy', 'Stay curious, build patiently, and learn from what does not work.')}</p></div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="about-list about-editorial-list" aria-label="Skills and interests">
        <SectionHeading eyebrow={contentValue('about.skills.eyebrow', 'WHAT I’M EXPLORING')} title={<>{contentValue('about.skills.heading', 'Areas of interest')}<span className="period">.</span></>} aside={<p className="about-section-aside">I’m sharing what I’m actively learning and practicing—not claiming to have mastered it all.</p>} />
        <div className="service-list">
          {SKILLS.map(({ n, title, copy, tags }, index) => (
            <Reveal className="service-row compact-row about-skill-row" key={n || title} delay={index * 0.05}>
              <span className="eyebrow">{n || String(index + 1).padStart(2, '0')}</span>
              <div><h3>{title}</h3>{copy && <p className="about-skill-copy">{copy}</p>}</div>
              <span className="offering-tags">{tags}</span>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="about-list about-editorial-list" aria-label="Milestones">
        <SectionHeading eyebrow={contentValue('about.milestones.eyebrow', 'SMALL STEPS, REAL PROGRESS')} title={<>{contentValue('about.milestones.heading', 'Milestones')}<span className="period">.</span></>} aside={<p className="about-section-aside">Experiences from school, competitions, scouting, and leadership that continue to shape how I learn.</p>} />
        <div className="service-list">
          {achievements.map(([title, copy], index) => (
            <Reveal className="service-row compact-row about-milestone-row" key={title} delay={index * 0.045}>
              <span className="eyebrow">{String(index + 1).padStart(2, '0')}</span><h3>{title}</h3><p>{copy}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="about-list about-editorial-list" aria-label="Learning timeline">
        <SectionHeading eyebrow={contentValue('about.timeline.eyebrow', 'SCHOOL & ACTIVITIES')} title={<>{contentValue('about.timeline.heading', 'The journey so far')}<span className="period">.</span></>} />
        <div className="service-list">
          {EXPERIENCE.map(({ period, role, place, placeholder }, index) => (
            <Reveal className="service-row compact-row about-timeline-row" key={period + role} delay={index * 0.04}>
              <span className="eyebrow">{period}</span><h3>{role}</h3><div><p>{place}</p>{placeholder && <span className="placeholder-tag">PLACEHOLDER — replace in src/data/site.js</span>}</div>
            </Reveal>
          ))}
        </div>
      </section>

      <Reveal className="about-end-note">
        <p className="eyebrow">{contentValue('about.cta.eyebrow', 'KEEP IN TOUCH')}</p>
        <h2>{contentValue('about.cta.heading', 'I’m learning, building, and always open to a good conversation.')}</h2>
        <a className="about-contact-link" href="/contact">Let’s talk <ArrowUpRight size={18} /></a>
      </Reveal>
      <FaqSection />
    </Page>
  );
}
