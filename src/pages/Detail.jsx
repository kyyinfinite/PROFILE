import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useProjects, useContent } from '../context/ContentProvider';
import { Page } from '../components/ui/Page';
import { MetaGrid } from '../components/ui/Sections';
import { Reveal, TLink } from '../components/motion/Motion';
import { Artwork } from '../components/projects/ProjectComponents';

function GalleryImage({ item, project }) {
  const [failed, setFailed] = useState(false);
  return item.image && !failed
    ? <img src={item.image} alt={item.title || project.title} loading="lazy" decoding="async" onError={() => setFailed(true)} style={{ width: '100%', height: '100%', objectFit: 'cover', aspectRatio: '4 / 3' }} />
    : <Artwork project={{ ...project, ...item, image: '' }} />;
}

export function Detail() {
  const { slug } = useParams();
  const projects = useProjects();
  const { contentValue, ready } = useContent();
  const enterAttrs = ready ? {} : { 'data-enter': '' };
  const project = projects.find((item) => item.slug === slug);

  if (!project) {
    return (
      <Page>
        <p className="eyebrow" {...enterAttrs}>{contentValue('detail.notfound.eyebrow', '404 / PROJECT NOT FOUND')}</p>
        <h1 {...enterAttrs}>{contentValue('detail.notfound.heading', 'Nothing here')}<span className="period">.</span></h1>
        <p className="page-intro" {...enterAttrs}>{contentValue('detail.notfound.intro', 'This project may have moved, or the link may be incorrect.')}</p>
        <TLink className="text-link" to="/work">{contentValue('detail.back', 'Back to all work')} <ArrowUpRight size={16} /></TLink>
      </Page>
    );
  }

  const index = projects.indexOf(project);
  const next = projects.length > 1 ? projects[(index + 1) % projects.length] : null;
  const previous = projects.length > 1 ? projects[(index - 1 + projects.length) % projects.length] : null;
  const number = String(index + 1).padStart(2, '0');
  const total = String(projects.length).padStart(2, '0');

  return (
    <Page className="detail-page">
      <div className="detail-topline" {...enterAttrs}>
        <TLink className="text-link" to="/work">← {contentValue('detail.all_projects', 'All projects')}</TLink>
        <p className="eyebrow">{number} — {total}</p>
      </div>

      <div className="detail-title-row">
        <h1 {...enterAttrs}>{project.title}<span className="period">.</span></h1>
        <MetaGrid items={[
          [contentValue('detail.meta.role', 'ROLE'), project.role],
          [contentValue('detail.meta.year', 'YEAR'), project.year],
          [contentValue('detail.meta.client', 'CLIENT'), project.client],
          [contentValue('detail.meta.tech', 'TECH'), project.tech?.length ? project.tech.join(' · ') : project.services?.join(' · ')],
        ]} />
      </div>

      <Reveal className="detail-art detail-hero-art" distance={24}>
        <Artwork project={project} />
      </Reveal>
      {(project.repo_url || project.live_url) && <div className="detail-links">{project.live_url && <a className="text-link" href={project.live_url} target="_blank" rel="noreferrer">{contentValue('detail.live_link', 'Live project')} <ArrowUpRight size={16} /></a>}{project.repo_url && <a className="text-link" href={project.repo_url} target="_blank" rel="noreferrer">{contentValue('detail.repo_link', 'Source code')} <ArrowUpRight size={16} /></a>}</div>}

      <section className="case-study-copy">
        {project.challenge && <Reveal className="case-study-block"><p className="eyebrow">{contentValue('detail.challenge_label', 'THE CHALLENGE')}</p><p>{project.challenge}</p></Reveal>}
        {project.approach && <Reveal className="case-study-block"><p className="eyebrow">{contentValue('detail.approach_label', 'THE APPROACH')}</p><p>{project.approach}</p></Reveal>}
        {project.outcome && <Reveal className="case-study-block"><p className="eyebrow">{contentValue('detail.outcome_label', 'THE OUTCOME')}</p><p>{project.outcome}</p></Reveal>}
      </section>

      {project.gallery?.length > 0 && <section className="detail-gallery" aria-label={contentValue('detail.gallery.heading', 'Gallery')}>
        <div className="detail-gallery-grid">
          {project.gallery.map((item, itemIndex) => (
            <Reveal className={`gallery-item gallery-item-${itemIndex + 1}`} key={`${project.slug}-${item.title}`}>
              <div className="gallery-art">
                <GalleryImage item={item} project={project} />
              </div>
              {(item.title || item.caption) && <div className="gallery-caption"><h3>{item.title}</h3><p>{item.caption}</p></div>}
            </Reveal>
          ))}
        </div>
      </section>}

      {next && previous && <nav className="project-pagination" aria-label={contentValue('detail.pagination.label', 'Project navigation')}>
        <TLink to={`/work/${previous.slug}`} className="project-nav-link" data-cursor="Previous">
          <span className="eyebrow">{contentValue('detail.previous_label', 'PREVIOUS PROJECT')}</span>
          <span>↖ {previous.title}</span>
        </TLink>
        <TLink to={`/work/${next.slug}`} className="project-nav-link next" data-cursor="Next">
          <span className="eyebrow">{contentValue('detail.next_label', 'NEXT PROJECT')}</span>
          <span>{next.title} ↗</span>
        </TLink>
      </nav>}
    </Page>
  );
}
