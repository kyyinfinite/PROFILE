import { ArrowUpRight } from 'lucide-react';
import { TLink } from '../motion/Motion';

/** Large editorial page heading. The data-enter hooks are staggered in by the page transition. */
export function PageHeading({ eyebrow, title, intro, children }) {
  return (
    <div className="page-heading">
      {eyebrow && <p className="eyebrow" data-enter>{eyebrow}</p>}
      <h1 data-enter>{title}<span className="period">.</span></h1>
      {intro && <p className="page-intro" data-enter>{intro}</p>}
      {children}
    </div>
  );
}

/** Reusable section heading: eyebrow + title on the left, optional aside on the right. */
export function SectionHeading({ eyebrow, title, aside }) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
      </div>
      {aside}
    </div>
  );
}

/** Label/value metadata grid used by project detail pages. */
export function MetaGrid({ items }) {
  return (
    <div className="detail-meta-grid">
      {items.filter(([, value]) => value).map(([label, value]) => (
        <div key={label}><span className="eyebrow">{label}</span><p>{value}</p></div>
      ))}
    </div>
  );
}

/** Compact end-of-page call to action; the global footer carries the big contact CTA right after it. */
export function PageCta({ eyebrow, title, links }) {
  return (
    <section className="page-cta" aria-label="Next steps">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <div className="page-cta-links">
        {links.map(({ to, label }) => (
          <TLink key={to} className="text-link" to={to}>{label} <ArrowUpRight size={16} /></TLink>
        ))}
      </div>
    </section>
  );
}
