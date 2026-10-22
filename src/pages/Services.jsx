import { Page } from '../components/ui/Page';
import { PageHeading } from '../components/ui/Sections';
import { Reveal } from '../components/motion/Motion';
import { useContent, useFocusAreas } from '../context/ContentProvider';
import { RichText } from '../components/ui/RichText';

const OFFERINGS = [
  { n: '01', title: 'AI architecture', copy: 'Exploring how an AI companion can interpret commands, choose actions, and respond to changing situations using local logic.' },
  { n: '02', title: 'Python development', copy: 'Practicing software development by organizing code, testing behavior, and improving small tools step by step.' },
  { n: '03', title: 'Offline-first thinking', copy: 'Interested in systems that can run locally, work without external AI services, and keep their core behavior on-device.' },
  { n: '04', title: 'Learning through experiments', copy: 'Trying ideas, observing what happens, and refining the result instead of assuming the first attempt is finished.' },
];

/** Heading and a plain capability list; the footer carries the contact invitation. */
export function Services() {
  const remoteOfferings = useFocusAreas();
  const { contentValue, ready } = useContent();
  const offerings = ready ? remoteOfferings.map((item, index) => ({ ...item, n: String(index + 1).padStart(2, '0') })) : OFFERINGS;
  return (
    <Page className="services-page">
      <PageHeading title={<RichText value={contentValue('focus.heading', 'Ideas worth\n*exploring*')} />} />
      <section className="offerings-list focus-list" aria-label="Areas of interest">
        {offerings.map((item, index) => (
          <Reveal as="article" className="offering-row" key={item.n} delay={(index % 2) * 0.05}>
            <span className="eyebrow">{item.n}</span>
            <div><h2>{item.title}</h2><p>{item.copy}</p></div>
          </Reveal>
        ))}
      </section>
    </Page>
  );
}
