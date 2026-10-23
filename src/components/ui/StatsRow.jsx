import { useEffect, useRef } from 'react';
import { gsap, MQ } from '../motion/gsap';
import { Reveal } from '../motion/Motion';

/** Count-up statistics. Each number runs once as it enters the viewport; reduced motion shows the final value. */
export function StatsRow({ stats }) {
  const rootRef = useRef(null);
  const signature = stats.map((item) => `${item.label}:${item.value}`).join('|');

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add({ motion: MQ.motion, reduce: MQ.reduced }, (context) => {
      if (context.conditions.reduce) return undefined;
      const nodes = rootRef.current.querySelectorAll('[data-count]');
      nodes.forEach((node) => {
        const target = Number(node.dataset.count);
        const counter = { v: 0 };
        node.textContent = '0';
        gsap.to(counter, {
          v: target, duration: 1.3, ease: 'power2.out', snap: { v: 1 },
          onUpdate: () => { node.textContent = String(counter.v); },
          scrollTrigger: { trigger: node, start: 'top 92%', once: true },
        });
      });
      return () => nodes.forEach((node) => { node.textContent = node.dataset.count; });
    }, rootRef);
    return () => mm.revert();
  }, [signature]);

  return (
    <Reveal className="journey-stats" distance={26}>
      <div ref={rootRef} className="journey-stats-grid">
        {stats.map(({ label, value }) => (
          <div key={label}><strong data-count={value}>{value}</strong><span className="eyebrow">{label}</span></div>
        ))}
      </div>
    </Reveal>
  );
}
