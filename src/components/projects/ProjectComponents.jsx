import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { gsap } from '../motion/gsap';
import { TLink } from '../motion/Motion';
import { useContent } from '../../context/ContentProvider';

function Artwork({ project }) {
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => { setImageFailed(false); }, [project.image]);
  const hasImage = Boolean(project.image) && !imageFailed;
  const artworkIndex = String(Math.max(1, Number(project.sort_order ?? 1))).padStart(2, '0');
  const mark = project.shape === 'orbit' ? 'N°' : project.shape === 'sun' ? 'S/' : 'F.';

  return (
    <div
      className={`artwork ${project.shape}${hasImage ? ' has-image' : ''}`}
      style={{ '--art': project.tone }}
      aria-label={`${project.title} abstract project artwork`}
      role="img"
    >
      {hasImage ? <img src={project.image} alt={project.title} loading="lazy" decoding="async" onError={() => setImageFailed(true)} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0, aspectRatio: '4 / 3' }} /> : null}
      {!hasImage && <><span className="art-index">{artworkIndex}</span>
      <span className="art-mark">{mark}</span>
      <span className="art-caption">DIGITAL STUDY — {project.year}</span></>}
    </div>
  );
}

function ProjectCard({ project, index }) {
  const { contentValue } = useContent();
  const cardRef = useRef(null);
  const visualRef = useRef(null);

  useEffect(() => () => {
    if (!visualRef.current) return;
    gsap.killTweensOf(visualRef.current);
    const artwork = visualRef.current.querySelector('.artwork');
    if (artwork) gsap.killTweensOf(artwork);
  }, []);

  const handlePointerMove = (event) => {
    const isTouchOrReducedMotion = window.matchMedia(
      '(hover: none), (pointer: coarse), (prefers-reduced-motion: reduce)',
    ).matches;
    if (isTouchOrReducedMotion) return;

    const frame = visualRef.current;
    const artwork = frame?.querySelector('.artwork');
    if (!frame || !artwork) return;

    const bounds = frame.getBoundingClientRect();
    const offsetX = (event.clientX - bounds.left) / bounds.width - 0.5;
    const offsetY = (event.clientY - bounds.top) / bounds.height - 0.5;

    gsap.to(frame, {
      x: offsetX * 4,
      y: offsetY * 4,
      duration: 0.42,
      ease: 'power3.out',
      overwrite: 'auto',
    });
    gsap.to(artwork, {
      scale: 1.045,
      x: offsetX * -8,
      y: offsetY * -8,
      duration: 0.55,
      ease: 'power3.out',
      overwrite: 'auto',
    });
  };

  const resetPointerPosition = () => {
    const frame = visualRef.current;
    const artwork = frame?.querySelector('.artwork');
    if (!frame || !artwork) return;

    gsap.to(frame, { x: 0, y: 0, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
    gsap.to(artwork, { scale: 1, x: 0, y: 0, duration: 0.65, ease: 'power3.out', overwrite: 'auto' });
  };

  return (
    <TLink
      ref={cardRef}
      data-cursor="Explore"
      className={`project-card card-${index + 1}`}
      to={`/work/${project.slug}`}
      onMouseMove={handlePointerMove}
      onMouseLeave={resetPointerPosition}
    >
      <div className="project-visual" ref={visualRef}>
        <Artwork project={project} />
        <span className="view-project">{contentValue('work.view_project', 'View project')} <ArrowUpRight size={16} /></span>
      </div>
      <div className="project-meta">
        <div>
          <h3>{project.title}</h3>
          <p>{project.type}</p>
        </div>
        <div className="project-year">
          <span>{project.year}</span>
        </div>
      </div>
    </TLink>
  );
}

export { Artwork, ProjectCard };
