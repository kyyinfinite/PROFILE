import { useEffect, useRef, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Globe2 } from 'lucide-react';
import { gsap, MQ } from '../motion/gsap';
import { useProjects } from '../../context/ContentProvider';
import { Reveal, TLink, MagneticLink, onPageReady } from '../motion/Motion';
import { ProjectCard } from '../projects/ProjectComponents';
import { useContent } from '../../context/ContentProvider';
import { RichText } from '../ui/RichText';
import { JOURNEY } from '../../data/journey';

function HeroSection() {
  const { contentValue } = useContent();
  const heroName = contentValue('home.hero.name', 'Kyyinfinite');
  const heroRole = contentValue('home.hero.role', 'Student & leader\nAI & Python');
  const heroLocation = contentValue('home.hero.location', 'Garut, Indonesia');
  const heroRef = useRef(null);
  const imageRef = useRef(null);
  const nameRef = useRef(null);

  // The entrance timeline is created paused (hidden start state applies immediately) and plays only
  // once the page transition curtain has opened, so it is never spent unseen underneath it.
  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add({ motion: MQ.motion, reduce: MQ.reduced }, (context) => {
      if (context.conditions.reduce) return undefined;

      const entrance = gsap.timeline({ paused: true, defaults: { ease: 'power4.out' } })
        .from('.hero-location', { autoAlpha: 0, x: -38, duration: 0.9 })
        .from('.home-hero-intro', { autoAlpha: 0, x: 34, duration: 0.8 }, '-=0.65')
        .from(nameRef.current, { yPercent: 115, duration: 1.25 }, '-=0.58')
        .from('.hero-scroll-cue', { autoAlpha: 0, y: 12, duration: 0.6 }, '-=0.65');
      const cancelWait = onPageReady(() => entrance.play());

      const scrollTrigger = { trigger: heroRef.current, start: 'top top', end: 'bottom top', scrub: 0.8 };
      gsap.to(imageRef.current, { yPercent: 8, scale: 1.08, ease: 'none', scrollTrigger });
      gsap.to(nameRef.current, { y: -48, ease: 'none', scrollTrigger: { ...scrollTrigger } });

      return () => { cancelWait(); entrance.kill(); };
    }, heroRef);
    return () => mm.revert();
  }, []);

  return (
    <section className="home-hero" ref={heroRef} aria-labelledby="hero-title">
      <div className="home-hero-image-wrap" aria-hidden="true">
        <img
          ref={imageRef}
          className="home-hero-image"
          src="/images/kyyinfinite-hero.jpg"
          alt=""
          width="1536"
          height="857"
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
      </div>
      <div className="home-hero-shade" aria-hidden="true" />

      <div className="hero-location" aria-label="Based in Garut, Indonesia">
        <div className="hero-location-copy">
          <span>{contentValue('home.hero.based_label', 'Based in')}</span>
          <strong>{heroLocation}</strong>
          <span>{contentValue('home.hero.worldwide', 'SMAN 10 Garut')}</span>
        </div>
        <span className="hero-location-icon"><Globe2 strokeWidth={1.2} /></span>
      </div>

      <div className="home-hero-intro">
        <ArrowDownRight className="hero-intro-arrow" strokeWidth={1.2} aria-hidden="true" />
        <p><RichText value={heroRole} /></p>
      </div>

      <div className="home-hero-name-wrap">
        <h1 id="hero-title" className="home-hero-name-mask">
          <span ref={nameRef} className="home-hero-name">{heroName}<span className="hero-name-period">.</span></span>
        </h1>
      </div>

      <a className="hero-scroll-cue" href="#selected-work" aria-label={contentValue('home.hero.scroll', 'Scroll to explore')}>
        <span>{contentValue('home.hero.scroll', 'Scroll to explore')}</span><ArrowDownRight size={17} />
      </a>
    </section>
  );
}

function IntroSection() {
  const { contentValue } = useContent();
  const sectionRef = useRef(null);
  const headlineRef = useRef(null);
  const copyRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;
    const mm = gsap.matchMedia();
    mm.add({ motion: MQ.motion, reduce: MQ.reduced }, (context) => {
      if (context.conditions.reduce) return undefined;
      const headline = headlineRef.current;
      const copy = copyRef.current;
      gsap.set([headline, copy], { autoAlpha: 0, y: 26 });
      const cancelWait = onPageReady(() => {
        gsap.timeline({ defaults: { ease: 'power3.out' }, scrollTrigger: { trigger: section, start: 'top 78%', once: true } })
          .to(headline, { autoAlpha: 1, y: 0, duration: 0.85 })
          .to(copy, { autoAlpha: 1, y: 0, duration: 0.7 }, '-=0.42');
      });
      return () => cancelWait();
    }, section);
    return () => mm.revert();
  }, []);

  return (
    <section id="intro" className="intro home-intro section-pad" ref={sectionRef} aria-labelledby="home-intro-title">
      <p className="eyebrow home-intro-eyebrow">{contentValue('home.intro.eyebrow', 'STUDENT · ORGANIZER · AI & PYTHON')}</p>
      <h2 id="home-intro-title" ref={headlineRef} className="home-intro-headline">
        <RichText value={contentValue('home.intro.heading', 'A high school student who leads, competes, and builds with AI and Python.')} />
      </h2>
      <div className="intro-bottom" ref={copyRef}>
        <p className="intro-support">{contentValue('home.intro.copy', 'Active in Pramuka and school organizations, and exploring AI architecture and Python on the side. Berintegritas, berprestasi, dan bersiap memberi kontribusi terbaik.')}</p>
        <MagneticLink className="about-orb" to="/about" aria-label="About me">{contentValue('home.intro.about_label', 'About me')} <ArrowUpRight size={18} /></MagneticLink>
      </div>
    </section>
  );
}

function JourneyHighlightsSection() {
  const featured = JOURNEY.filter((item) => item.featured);
  return (
    <section id="journey" className="journey-highlights section-pad camera-scene" aria-labelledby="journey-highlights-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">ORGANISASI · PRESTASI · KEGIATAN</p>
          <h2 id="journey-highlights-title">Perjalanan<span className="period">.</span></h2>
        </div>
        <TLink className="text-link" to="/journey">Lihat semua <ArrowUpRight size={16} /></TLink>
      </div>
      <div className="journey-hl-list">
        {featured.map((item, index) => (
          <Reveal key={item.id} className="journey-hl-row" delay={(index % 2) * 0.05}>
            <span className="eyebrow">{String(index + 1).padStart(2, '0')}</span>
            <h3>{item.title}</h3>
            <p>{item.place}</p>
            <span className="journey-hl-cross" aria-hidden="true">↗</span>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function SelectedWorkSection() {
  const projects = useProjects();
  const { contentValue, ready } = useContent();
  const featuredProjects = projects.filter(project => project.featured);
  const selectedProjects = ready && featuredProjects.length ? featuredProjects : projects;
  return (
    <section id="selected-work" className="work-section section-pad camera-scene">
      <div className="section-heading">
        <h2>{contentValue('home.work.heading', 'Personal projects')}<span className="period">.</span></h2>
        <TLink className="text-link" to="/work">{contentValue('home.work.link', 'All projects')} <ArrowUpRight size={16} /></TLink>
      </div>
      <div className="project-grid">
        {selectedProjects.slice(0, 3).map((project, index) => (
          <Reveal key={project.slug} className="reveal-card">
            <ProjectCard project={project} index={index} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}


function ManifestoSection() {
  const { contentValue } = useContent();
  return (
    <section className="manifesto section-pad camera-scene">
      <p className="eyebrow">{contentValue('home.manifesto.eyebrow', 'WHAT I VALUE')}</p>
      <Reveal><h2><RichText value={contentValue('home.manifesto.heading', 'Stay curious. Think clearly. *Keep learning.*\nLet practice do the talking.')} /></h2></Reveal>
      <TLink className="text-link light-link" to="/about">{contentValue('home.manifesto.link', 'More about me')} <ArrowUpRight size={16} /></TLink>
    </section>
  );
}


const processSteps = [
  ['01', 'Silat achievements', 'My CV records first-place finishes in silat competitions at international, national, provincial, and district levels.'],
  ['02', 'Google Jagoan Coding', 'Reached the top 50 finalists in the Google Jagoan Coding program during SMP.'],
  ['03', 'Pramuka Garuda', 'Reached the highest scouting level, Pramuka Garuda, during SMP.'],
  ['04', 'Leadership & speaking', 'Served in school and district-level student organizations and spoke at a leadership webinar.'],
];

function ProcessSection() {
  const { milestones, contentValue } = useContent();
  const { ready } = useContent();
  const items = ready ? milestones.map((item, index) => [String(index + 1).padStart(2, '0'), item.title, item.copy]) : processSteps;
  return <section className="process-section section-pad camera-scene">
    <div className="section-heading"><div><p className="eyebrow">{contentValue('home.process.eyebrow', 'MILESTONES SO FAR')}</p><h2><RichText value={contentValue('home.process.heading', 'Learning by\ndoing.')} /></h2></div><p className="process-intro">{contentValue('home.process.intro', 'These milestones come from school, competition, scouting, and leadership activities. I’m still learning and building what comes next.')}</p></div>
    <div className="process-list">{items.map(([number, title, copy]) => <Reveal className="process-row" key={number}><span className="eyebrow">{number}</span><h3>{title}</h3><p>{copy}</p><span className="process-cross">↗</span></Reveal>)}</div>
  </section>;
}

const faqs = [
  ['What are you learning?', 'I’m a high school student focused on AI architecture, Python development, and the logic behind intelligent systems.'],
  ['What experience do you have outside technology?', 'My CV includes silat competition wins, the top 50 of Google Jagoan Coding, Pramuka Garuda, and student leadership activities.'],
  ['What matters to you when working with others?', 'I value clear communication, teamwork, responsibility, and being willing to learn from feedback.'],
  ['How can we connect?', 'Send an email or visit one of my public profiles. I’m happy to talk about technology, learning, and ideas worth exploring.'],
];

function FaqSection() {
  const { faqs: remoteFaqs, contentValue, ready } = useContent();
  const [openIndex, setOpenIndex] = useState(-1);
  const faqItems = ready ? remoteFaqs.map((item) => [item.question, item.answer]) : faqs;
  return <section className="faq-section section-pad camera-scene">
    <div className="faq-heading"><h2><RichText value={contentValue('home.faq.heading', 'Good questions,\n*honest answers*.')} /></h2></div>
    <div className="faq-list">{faqItems.map(([question, answer], index) => <div className={`faq-item${openIndex === index ? ' is-open' : ''}`} key={question}><button type="button" aria-expanded={openIndex === index} onClick={() => setOpenIndex(openIndex === index ? -1 : index)}><span className="faq-number">0{index + 1}</span><span>{question}</span><span className="faq-toggle">{openIndex === index ? '−' : '+'}</span></button><div className="faq-answer" hidden={openIndex !== index}><p>{answer}</p></div></div>)}</div>
  </section>;
}

export { HeroSection, IntroSection, JourneyHighlightsSection, SelectedWorkSection, ManifestoSection, ProcessSection, FaqSection };
