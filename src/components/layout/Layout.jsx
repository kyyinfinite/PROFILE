import { ArrowUpRight } from 'lucide-react';
import { TLink } from '../motion/Motion';
import { Header } from './Header';
import { Footer } from './Footer';

/** Legacy contact band. Kept for reuse; pages now end with <PageCta/> followed by the global footer CTA. */
function ContactCta() {
  return (
    <section className="contact-cta section-pad camera-scene">
      <p className="eyebrow">HAVE A PROJECT IN MIND?</p>
      <TLink to="/contact" className="cta-heading">
        Let's talk<br /><em>about it</em><ArrowUpRight className="cta-arrow" />
      </TLink>
      <div className="cta-foot">
        <span>Have a good one in mind?</span>
        <TLink to="/contact" className="text-link">Get in touch <ArrowUpRight size={16} /></TLink>
      </div>
    </section>
  );
}

export { Header, ContactCta, Footer };
