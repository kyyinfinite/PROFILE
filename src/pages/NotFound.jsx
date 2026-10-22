import { ArrowUpRight } from 'lucide-react';
import { Page } from '../components/ui/Page';
import { PageHeading } from '../components/ui/Sections';
import { TLink } from '../components/motion/Motion';
import { useContent } from '../context/ContentProvider';
import { RichText } from '../components/ui/RichText';

export function NotFound() {
  const { contentValue } = useContent();
  return (
    <Page className="not-found-page">
      <PageHeading
        eyebrow={contentValue('notfound.eyebrow', '404 — WRONG TURN, RIGHT PLACE')}
        title={<RichText value={contentValue('notfound.heading', 'Lost in\n*the scroll*')} />}
        intro={contentValue('notfound.intro', "This page doesn't exist, but there's plenty more to explore.")}
      />
      <div className="not-found-links">
        <TLink className="text-link" to="/">{contentValue('notfound.home_link', 'Back home')} <ArrowUpRight size={16} /></TLink>
        <TLink className="text-link" to="/work">{contentValue('notfound.work_link', 'Explore the work')} <ArrowUpRight size={16} /></TLink>
      </div>
    </Page>
  );
}
