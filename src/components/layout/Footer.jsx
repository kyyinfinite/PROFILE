import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { gsap, MQ, prefersReducedMotion } from '../motion/gsap';
import { TLink } from '../motion/Motion';
import { useContent } from '../../context/ContentProvider';
import { supabase } from '../../lib/supabase';

/**
 * GLOBAL FOOTER with the reversible "sagging page" curve.
 *
 * The page colour hangs over the footer as a half-ellipse (.footer-curve). It is deepest while the
 * footer is still far below the viewport and flattens into a straight edge as the footer settles in.
 * A single scrubbed timeline drives it, so scrolling back up replays the curve in reverse.
 * Only transform / opacity are animated (compositor-friendly, no layout work on scroll).
 */
export function Footer() {
  const { pathname } = useLocation();
  const { contentValue, version } = useContent();
  const CONTACT_EMAIL = contentValue('contact.email', 'ripkidwiput03@gmail.com');
  const CONTACT_PHONE = contentValue('contact.phone', '');
  const [localTime, setLocalTime] = useState(() => new Date());
  const portraitPath = contentValue('about.portrait_path', '');
  const portraitSrc = portraitPath && /^https?:\/\//i.test(portraitPath) ? portraitPath : portraitPath && supabase ? supabase.storage.from('portfolio').getPublicUrl(portraitPath).data.publicUrl : '/images/kyyinfinite-hero.jpg';
  const SOCIAL_LINKS = { github: contentValue('social.github', 'https://github.com/'), instagram: contentValue('social.instagram', 'https://www.instagram.com/'), linkedin: contentValue('social.linkedin', 'https://www.linkedin.com/') };
  const footerRef = useRef(null);
  const curveRef = useRef(null);
  const contentRef = useRef(null);
  // Keep the same footer silhouette and light aperture on every route.
  const cap = 'light';

  useEffect(() => {
    const tick = () => setLocalTime(new Date());
    tick();
    const timer = window.setInterval(tick, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const footer = footerRef.current;
    const curve = curveRef.current;
    const content = contentRef.current;
    if (!footer || !curve || !content) return undefined;

    const mm = gsap.matchMedia();
    mm.add({ motion: MQ.motion, reduce: MQ.reduced, mobile: MQ.mobile }, (context) => {
      const { reduce, mobile } = context.conditions;
      if (reduce) return;

      const orb = content.querySelector('.home-footer-orb');
      const lines = content.querySelectorAll('.home-footer-title-line');

      // Flat edge must be reachable even when the footer is shorter than the viewport:
      // the end line is clamped to the lowest position the footer top can actually reach.
      const end = () => {
        const vh = window.innerHeight;
        const reachable = vh - footer.offsetHeight + 2;
        return `top ${Math.round(Math.max(vh * (mobile ? 0.3 : 0.22), reachable))}px`;
      };

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: footer,
          start: 'top bottom',
          end,
          scrub: mobile ? 0.4 : 0.7,
          invalidateOnRefresh: true,
        },
      });

      // 1. The curve flattens: scaleY 1 -> 0 from the top edge of the footer.
      tl.fromTo(curve, { scaleY: 1 }, { scaleY: 0, ease: 'power2.out' }, 0)
        // 2. Content rises out from beneath the curve and fades in.
        .fromTo(content, { yPercent: mobile ? 5 : 9, opacity: 0.2 }, { yPercent: 0, opacity: 1, ease: 'power2.out' }, 0)
        // 3. Headline lines and the orb settle with a slight stagger.
        .fromTo(lines, { yPercent: 28 }, { yPercent: 0, stagger: 0.08, ease: 'power3.out' }, 0.05);
      if (orb) tl.fromTo(orb, { scale: 0.72 }, { scale: 1, ease: 'power3.out' }, 0.2);
    });
    return () => mm.revert();
  }, [pathname, version]);

  const scrollToTop = (event) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };

  return (
    <footer ref={footerRef} className="footer footer-rich" data-cap={cap}>
      <div ref={curveRef} className="footer-curve" aria-hidden="true" />
      {true ? (
        <div ref={contentRef} className="home-footer-content">
          <div className="home-footer-cta-row">
            <TLink to="/contact" className="home-footer-heading" aria-label={contentValue('footer.cta_aria', 'Let’s work together')}>
              <span className="home-footer-title-line"><img src={portraitSrc} alt="" className="home-footer-avatar" /><span>{contentValue('footer.cta_line_one', 'Let’s work')}</span></span>
              <span className="home-footer-title-line"><span>{contentValue('footer.cta_line_two', 'together')}</span></span>
            </TLink>
            <span className="home-footer-diagonal" aria-hidden="true">↙</span>
          </div>
          <div className="home-footer-contact-band">
            <span className="home-footer-rule" aria-hidden="true" />
            <TLink to="/contact" className="home-footer-orb">{contentValue('footer.contact_button', 'Get in touch')} <ArrowUpRight size={18} aria-hidden="true" /></TLink>
          </div>
          <div className="home-footer-contact-details">
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            {CONTACT_PHONE.trim() && <a href={`tel:${CONTACT_PHONE.replace(/[^+\d]/g, '')}`}>{CONTACT_PHONE}</a>}
          </div>
          <div className="home-footer-social-block">
            <span className="home-footer-label">{contentValue('footer.socials_label', 'SOCIALS')}</span>
            <div className="home-footer-socials">
              <a href={SOCIAL_LINKS.github} target="_blank" rel="noreferrer">{contentValue('footer.github_link', 'GitHub')} ↗</a>
              <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noreferrer">{contentValue('footer.instagram_link', 'Instagram')} ↗</a>
              <a href={SOCIAL_LINKS.linkedin} target="_blank" rel="noreferrer">{contentValue('footer.linkedin_link', 'LinkedIn')} ↗</a>
            </div>
          </div>
          <div className="home-footer-bottomline">
            <div><span className="home-footer-label">{contentValue('footer.version_label', 'VERSION')}</span><span className="home-footer-bottom-value">{contentValue('footer.copyright', '© Kyyinfinite 2026')}</span></div>
            <div className="home-footer-local-time"><span className="home-footer-label">{contentValue('footer.local_time_label', 'LOCAL TIME')}</span><span className="home-footer-bottom-value">{new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true, timeZoneName: 'short' }).format(localTime)}</span></div>
            <a className="home-footer-back-top" href="#top" onClick={scrollToTop} aria-label="Back to top">↑</a>
          </div>
        </div>
      ) : (
        <>
          <TLink to="/contact" className="footer-big-cta">
            {contentValue('footer.cta', 'Let’s start\na *conversation*').split('\n').map((line,index)=><span key={index}>{index>0&&<br/>}{line.startsWith('*')&&line.endsWith('*')?<em>{line.slice(1,-1)}</em>:line}</span>)}<ArrowUpRight aria-hidden="true" />
          </TLink>
          <div className="footer-links">
            <nav className="footer-nav" aria-label="Footer">
              {NAV_LINKS.map(({ to, label }) => <TLink key={to} to={to}>{label}</TLink>)}
            </nav>
            <div className="footer-social">
              <a href={`mailto:${CONTACT_EMAIL}`}>{contentValue('footer.email_link', 'Email')} ↗</a>
              <a href={SOCIAL_LINKS.github} target="_blank" rel="noreferrer">{contentValue('footer.github_link', 'GitHub')} ↗</a>
              <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noreferrer">{contentValue('footer.instagram_link', 'Instagram')} ↗</a>
              <a href={SOCIAL_LINKS.linkedin} target="_blank" rel="noreferrer">{contentValue('footer.linkedin_link', 'LinkedIn')} ↗</a>
            </div>
          </div>
          <div className="footer-bottomline">
            <span>{contentValue('footer.copyright', '© Kyyinfinite 2026')}</span>
            <a className="footer-top-link" href="#top" onClick={scrollToTop}>{contentValue('footer.back_to_top', 'Back to top')} <span aria-hidden="true">↑</span></a>
          </div>
        </>
      )}
    </footer>
  );
}
