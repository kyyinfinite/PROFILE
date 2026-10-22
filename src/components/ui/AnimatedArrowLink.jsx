import { ArrowUpRight } from 'lucide-react';
import { TLink } from '../motion/Motion';

/** Small reusable link treatment for secondary actions. Internal routes use the page transition. */
export function AnimatedArrowLink({ href, to, children, className = '' }) {
  const content = <><span>{children}</span><ArrowUpRight aria-hidden="true" size={16} /></>;
  if (to) return <TLink className={`animated-arrow-link ${className}`} to={to}>{content}</TLink>;
  return <a className={`animated-arrow-link ${className}`} href={href}>{content}</a>;
}
