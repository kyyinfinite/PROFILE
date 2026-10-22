# Supabase portfolio integration — cumulative audit

## Codebase and motion risks

- React 19 + Vite 6 + React Router 7; plain JS/JSX; GSAP 3.13 with `ScrollTrigger`; existing dark editorial design and bundled Neue Montreal fonts.
- Static fallback content lives in `src/data/projects.js` and `src/data/site.js`; page text is distributed across page components, `HomeSections.jsx`, `Header.jsx`, `Footer.jsx`, project components, and `index.html`.
- The contact form originally validated `name`, `email`, `projectType`, `budget`, and `message`, then opened a `mailto:` draft. It now attempts a Supabase `messages` insert and falls back to `mailto:` on error/timeout; the honeypot is not full spam protection.
- Motion-critical files are `PageTransition.jsx`, `pageState.js`, `Reveal.jsx`, `ScrollScenes.jsx`, `HomeSections.jsx`, and `Footer.jsx`. The `PageTransition.jsx` intro/failsafe architecture is preserved.

## Cumulative implementation

- `@supabase/supabase-js` is pinned to exact version `2.57.4`. `src/lib/supabase.js` returns `null` when environment variables are missing.
- `ContentProvider` starts from repo defaults, reads public Supabase content with a 3.5-second timeout, uses guarded session/local storage cache, and updates document title/meta description.
- Public pages consume provider content for project data, skills, timeline, focus areas, milestones, FAQ, navigation count/labels, headings, copy, social links, contact email, footer copy, and SEO. `RichText` supports `*italic*` and newline breaks using React elements only.
- The lazy `/admin` route includes email/password sign-in, admin membership check, project CRUD/publish/order, content key editing, skills/focus/timeline/milestones/FAQ CRUD, inbox read/unread/delete, WebP compression, cover/gallery/portrait/CV upload, and logout. There is no signup UI.
- Contact messages are inserted into `messages`; if Supabase insert fails or times out, the form opens a mailto draft and tells the visitor it was not stored.
- `supabase/schema.sql`, repository-derived `seed.sql`, RLS curl checks, phone-friendly setup instructions, `.env.example`, and Vercel SPA rewrites are included.

## Security and verification notes

- Only the anon/publishable key is supported by frontend configuration. Do not put a service-role key in the site, environment example, archive, or chat.
- Public reads are constrained by RLS for published/visible records. Inbox reads and content writes require `public.is_admin()`; anonymous message insert is intentionally allowed subject to database checks. Storage is public-read but writes require admin membership and SVG is disallowed.
- `PageTransition.jsx`, `introPending`, the 8-second failsafe, and `resetCurtain` were not modified. Every `gsap.matchMedia().add(...)` still includes `motion: MQ.motion`; ScrollScenes/footer effects rebuild on content version and refresh after image/font events.
- JS/JSX syntax parsing and relative import resolution passed in this environment. `npm install` could not complete because npm registry DNS/network access failed (`EAI_AGAIN`); therefore Vite build, ESLint, browser animation behavior, real Supabase Auth/RLS, and live Storage upload remain unverified.
