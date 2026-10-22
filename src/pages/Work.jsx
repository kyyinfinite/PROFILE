import { useEffect, useState } from 'react';
import { useProjects, useContent } from '../context/ContentProvider';
import { Page } from '../components/ui/Page';
import { PageHeading } from '../components/ui/Sections';
import { Reveal } from '../components/motion/Motion';
import { ProjectCard } from '../components/projects/ProjectComponents';

/** Dark editorial heading, then the same light canvas and project cards as the landing page's Selected Work. */
export function Work() {
  const projects = useProjects();
  const { contentValue } = useContent();
  const filters = [contentValue('work.filter.all', 'All'), ...new Set(projects.map((project) => project.category).filter(Boolean))];
  const [filter, setFilter] = useState('All');
  const visible = projects.filter((project) => filter === contentValue('work.filter.all', 'All') || project.category === filter);
  const filterSignature = filters.join('|');
  useEffect(() => { if (!filters.includes(filter)) setFilter(filters[0]); }, [filter, filterSignature]);

  return (
    <Page shell={false}>
      <section className="page-shell work-intro">
        <PageHeading title={<>{contentValue('work.heading', 'Project')} <em>{contentValue('work.heading_emphasis', 'index')}</em></>} />
      </section>

      <section className="work-section work-index section-pad" aria-label="Projects">
        <div className="filters" role="group" aria-label="Filter projects">
          {filters.map((item) => {
            const count = item === 'All' ? projects.length : projects.filter((project) => project.category === item).length;
            return (
              <button type="button" key={item} className={filter === item ? 'active' : ''} aria-pressed={filter === item} onClick={() => setFilter(item)}>
                {item} <sup>{count}</sup>
              </button>
            );
          })}
        </div>
        <div className="project-grid work-grid">
          {!visible.length && <p className="page-intro">{contentValue('work.empty', 'No projects are published here yet.')}</p>}
          {visible.map((project, index) => (
            <Reveal key={project.slug} className="reveal-card" delay={(index % 2) * 0.08} distance={34}>
              <ProjectCard project={project} index={index} />
            </Reveal>
          ))}
        </div>
      </section>
    </Page>
  );
}
