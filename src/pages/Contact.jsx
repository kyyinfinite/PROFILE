import { useRef, useState } from 'react';
import { ArrowUpRight, Check, Send } from 'lucide-react';
import { useContent } from '../context/ContentProvider';
import { Page } from '../components/ui/Page';
import { RichText } from '../components/ui/RichText';
import { supabase } from '../lib/supabase';

const INITIAL = { name: '', email: '', projectType: 'AI and Python', budget: '', message: '', website: '' };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function insertMessage(payload) {
  let timer;
  const controller = new AbortController();
  try {
    return await Promise.race([
      supabase.from('messages').insert(payload).abortSignal(controller.signal),
      new Promise(resolve => { timer = window.setTimeout(() => { controller.abort(); resolve({ error: new Error('Contact request timed out') }); }, 5000); }),
    ]);
  } finally { window.clearTimeout(timer); }
}

function validate(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = 'Please tell me your name.';
  if (!values.email.trim()) errors.email = 'Please add an email address so I can reply.';
  else if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = 'That email address does not look right.';
  if (values.message.trim().length < 10) errors.message = 'A sentence or two is enough — at least 10 characters.';
  return errors;
}

/**
 * There is no backend, so this form never claims a message was sent. It validates, then drafts the
 * message in the visitor's email app (mailto:). The visible status says exactly that.
 */
export function Contact() {
  const { contentValue } = useContent();
  const CONTACT_EMAIL = contentValue('contact.email', 'ripkidwiput03@gmail.com');
  const SOCIAL_LINKS = { github: contentValue('social.github', 'https://github.com/'), instagram: contentValue('social.instagram', 'https://www.instagram.com/'), linkedin: contentValue('social.linkedin', 'https://www.linkedin.com/') };
  const HAS_PLACEHOLDER_EMAIL = CONTACT_EMAIL.endsWith('@example.com');
  const cvPath = contentValue('contact.cv_path', '');
  const cvUrl = cvPath && /^https?:\/\//i.test(cvPath) ? cvPath : cvPath && supabase ? supabase.storage.from('portfolio').getPublicUrl(cvPath).data.publicUrl : ''; 
  const formRef = useRef(null);
  const [values, setValues] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [drafted, setDrafted] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendState, setSendState] = useState('');

  const update = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => (current[name] ? { ...current, [name]: undefined } : current));
    setDrafted(false);
    setSendState('');
  };

  const submit = async (event) => {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    const firstInvalid = Object.keys(found)[0];
    if (firstInvalid) {
      setDrafted(false);
      formRef.current?.elements.namedItem(firstInvalid)?.focus();
      return;
    }
    if (values.website.trim()) return;
    const subjectText = `Message for Kyyinfinite — ${values.projectType}`;
    const messageText = `Topic: ${values.projectType}\nContext: ${values.budget || 'Not specified'}\n\n${values.message.trim()}`;
    if (sendState === 'fallback' && drafted) {
      const subject = encodeURIComponent(subjectText);
      const body = encodeURIComponent(`Hi Kyyinfinite,\n\nName: ${values.name.trim()}\nEmail: ${values.email.trim()}\n${messageText}\n`);
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
      return;
    }
    setSending(true);
    setSendState('');
    if (supabase) {
      try {
        const { error } = await insertMessage({
          name: values.name.trim(), email: values.email.trim(), subject: subjectText.slice(0, 160), message: messageText.slice(0, 5000),
        });
        if (!error) {
          setSendState('success');
          setDrafted(false);
          setValues(INITIAL);
          formRef.current?.reset();
          setSending(false);
          return;
        }
      } catch { /* Mail fallback below keeps the contact form usable during outages. */ }
    }
    const subject = encodeURIComponent(subjectText);
    const body = encodeURIComponent(`Hi Kyyinfinite,\n\nName: ${values.name.trim()}\nEmail: ${values.email.trim()}\n${messageText}\n`);
    setSendState('fallback');
    setDrafted(true);
    setSending(false);
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  };

  const field = (name) => ({
    name,
    value: values[name],
    onChange: update,
    'aria-invalid': errors[name] ? 'true' : undefined,
    'aria-describedby': errors[name] ? `${name}-error` : undefined,
  });
  const fieldError = (name) => errors[name] && <span className="field-error" id={`${name}-error`} role="alert">{errors[name]}</span>;
  const errorCount = Object.values(errors).filter(Boolean).length;

  return (
    <Page className="contact-page contact-page-v2">
      <p className="eyebrow" data-enter>{contentValue('contact.eyebrow', 'SAY HELLO — 04 / 04')}</p>
      <h1 data-enter><RichText value={contentValue('contact.heading', 'Let’s start\na *conversation*.')} /><span className="period">.</span></h1>
      <div className="contact-intro-row" data-enter>
        <p className="page-intro">{contentValue('contact.intro', 'I’m happy to connect about AI, Python, learning, or an interesting idea. A short message is enough to get started.')}</p>
        <a className="email-link" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL} <ArrowUpRight aria-hidden="true" /></a>
      </div>
      <div className="contact-form-layout">
        <aside className="contact-aside">
          <p className="eyebrow">{contentValue('contact.aside.eyebrow', 'A NOTE BEFORE YOU WRITE')}</p>
          <p>{contentValue('contact.aside.copy', 'Share a question, an idea, or something you think I should check out. I’ll read your message and reply when I can.')}</p>
          <div className="contact-aside-meta"><span className="status-dot" /> {contentValue('contact.status', 'Student · AI & Python')} <span>· {contentValue('site.year', '2026')}</span></div>
          {cvUrl && <p><a className="text-link" href={cvUrl} target="_blank" rel="noreferrer">View CV / résumé <ArrowUpRight aria-hidden="true" /></a></p>}
          <div className="contact-socials">
            <span className="eyebrow">{contentValue('contact.social.heading', 'PUBLIC PROFILES')}</span>
            <a href={SOCIAL_LINKS.github} target="_blank" rel="noreferrer">GitHub ↗</a>
            <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noreferrer">Instagram ↗</a>
            <a href={SOCIAL_LINKS.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a>
          </div>
        </aside>
        <form className="contact-form" ref={formRef} onSubmit={submit} noValidate>
          <label className="contact-honeypot" aria-hidden="true">Website<input name="website" value={values.website} onChange={update} tabIndex={-1} autoComplete="off" /></label>
          <p className="sr-only" role="status" aria-live="polite">
            {errorCount ? `${errorCount} field${errorCount > 1 ? 's' : ''} need attention.` : ''}
          </p>
          <label className="form-field"><span>{contentValue('contact.form.name.label', "01 / What's your name?")}</span>
            <input {...field('name')} autoComplete="name" placeholder={contentValue('contact.form.name.placeholder', 'Your name')} required />{fieldError('name')}</label>
          <label className="form-field"><span>{contentValue('contact.form.email.label', '02 / Where can I reach you?')}</span>
            <input {...field('email')} type="email" autoComplete="email" placeholder={contentValue('contact.form.email.placeholder', 'you@example.com')} required />{fieldError('email')}</label>
          <label className="form-field"><span>{contentValue('contact.form.topic.label', '03 / What would you like to discuss?')}</span>
            <select {...field('projectType')}><option>{contentValue('contact.topic.ai', 'AI and Python')}</option><option>{contentValue('contact.topic.school', 'School and learning')}</option><option>{contentValue('contact.topic.ideas', 'Technology ideas')}</option><option>{contentValue('contact.topic.collaboration', 'Collaboration')}</option><option>{contentValue('contact.topic.other', 'Something else')}</option></select></label>
          <label className="form-field"><span>{contentValue('contact.form.context.label', '04 / What best describes your message?')} <small>{contentValue('contact.form.optional', 'OPTIONAL')}</small></span>
            <select {...field('budget')}><option value="">{contentValue('contact.context.general', 'General message')}</option><option>{contentValue('contact.context.question', 'Question')}</option><option>{contentValue('contact.context.idea', 'Idea to share')}</option><option>{contentValue('contact.context.resource', 'Learning resource')}</option><option>{contentValue('contact.context.collaboration', 'Collaboration')}</option><option>{contentValue('contact.context.other', 'Other')}</option></select></label>
          <label className="form-field form-field-message"><span>{contentValue('contact.form.message.label', '05 / Your message')}</span>
            <textarea {...field('message')} placeholder={contentValue('contact.form.message.placeholder', 'Write your question or idea here…')} rows="5" required />{fieldError('message')}</label>
          <div className="form-submit-row">
            <p>{contentValue('contact.form.helper', 'Your message is sent to the site inbox when Supabase is available; email is the fallback.')}</p>
            <button className="submit-button" type="submit" disabled={sending}>{sending ? contentValue('contact.form.pending', 'Sending…') : drafted ? contentValue('contact.form.again', 'Open email again') : contentValue('contact.form.submit', 'Send message')} <Send size={16} aria-hidden="true" /></button>
          </div>
          {sendState === 'success' && <p className="form-success" role="status"><Check size={16} aria-hidden="true" /><span>{contentValue('contact.form.success', 'Pesan berhasil dikirim ke inbox situs. Terima kasih sudah menghubungi saya.')}</span></p>}
          {sendState === 'fallback' && (
            <p className="form-success" role="status">
              <Check size={16} aria-hidden="true" />
              <span>{contentValue('contact.form.fallback', 'Pesan tidak berhasil disimpan ke situs, jadi email app dibuka sebagai alternatif. Pesan belum terkirim sampai kamu menekan Send di aplikasi email. Jika tidak terbuka, tulis ke')} <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</span>
            </p>
          )}
          {HAS_PLACEHOLDER_EMAIL && (
            <p className="form-config-note" role="note">Setup note: <code>{CONTACT_EMAIL}</code> appears to be a placeholder address. Update it in Admin → Site content → Contact.</p>
          )}
        </form>
      </div>
    </Page>
  );
}
