# Setup Supabase — Kyyinfinite Portfolio

This cumulative build includes the Supabase content provider and offline defaults, a private `/admin` editor (Auth, content tables, project CRUD, image/CV upload), plus the contact form inbox. Use the public **anon/publishable** key only. Never use a service-role key in the frontend or share it.

## 1. Create a project from your phone

1. Open [supabase.com](https://supabase.com), sign in, and create a project.
2. Save the database password somewhere private; it is not needed in the frontend.
3. Open **SQL Editor → New query**.
4. Copy all of `supabase/schema.sql` into the editor and run it.
5. Open another query, paste `supabase/seed.sql`, and run it. The seed is based on the original site's project, skill, experience, focus, milestone, FAQ, and site text data. It uses `ON CONFLICT DO NOTHING` so rerunning it will not overwrite content you have edited in Admin.

## 2. Create the admin identity safely

1. In Supabase open **Authentication → Providers → Email**.
2. Turn **off** *Allow new users to sign up* (label may vary slightly in the dashboard). Save.
3. Open **Authentication → Users → Add user / Create new user** and create your own email/password. Do not add a signup page to the site.
4. Copy that user's UUID from the Users table.
5. In SQL Editor run the following after replacing the UUID with your own user UUID:

```sql
insert into public.admins (user_id)
values ('PASTE-YOUR-ADMIN-USER-UUID-HERE')
on conflict (user_id) do nothing;
```

Only a user whose authenticated UUID is in `public.admins` passes `public.is_admin()`. Never place the service-role key in the website, `.env`, a zip, or chat.

## 3. Add frontend environment variables

1. Copy `.env.example` to `.env` in the root `portfolio/` folder.
2. In Supabase open **Project Settings → API** (or **Connect**), copy the Project URL and the **anon/publishable** key.
3. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`.
4. Restart Vite after changing env values.

The anon key is intended for frontend use; security depends on RLS. Do not use `service_role`.

## 4. Vercel deployment

In Vercel open the project → **Settings → Environment Variables** and add the same two `VITE_` variables for Production (and Preview if needed). Redeploy after saving. `vercel.json` rewrites deep links such as `/work/form-and-field` and `/admin` to the SPA entrypoint.

## 5. Check RLS

Follow every test in `supabase/verify.md`. The message test creates a test inbox row; remove it afterward from Admin → Inbox or Supabase Table Editor.

## 6. Images and spam

The `portfolio` Storage bucket is public-read, limited to 5 MiB per object, and allows JPEG, PNG, WebP, and PDF. SVG is intentionally disallowed. Upload/delete is admin-only. The public bucket means anyone who knows an object's URL can view it; do not upload private files.

A honeypot alone is not robust spam protection. Rate limiting, an Edge Function, or CAPTCHA is a later hardening step before relying on public message submissions at scale.

## Current limitations

- Contact-form spam protection is only a honeypot plus database checks. Rate limiting, an Edge Function, and CAPTCHA remain future hardening.
- Supabase Auth email/password login must be enabled. Keep public signups disabled and create admin users manually, then insert their UUID into `public.admins`.
- A network timeout or any table/query error leaves the current static site data in place. Storage paths are prepared for public images, but project gallery rows currently seed metadata only because the repository has no actual gallery image files.
- Public text rendering remains React text/JSX; do not store HTML or use `dangerouslySetInnerHTML`.

## Fixing project image uploads

If uploads report success but project covers or gallery images do not appear, run `supabase/storage-fix.sql` in Supabase SQL Editor after `schema.sql`. It reconciles the `portfolio` bucket as public-read with a 5 MB limit and an allowlist of JPEG, PNG, WebP, and PDF; only users listed in `public.admins` can mutate Storage objects. It also prints the bucket configuration and the policies for verification.

After uploading, the admin now verifies that the object can be listed in the target folder and shows a preview for the saved cover/gallery items. Project image paths are stored as bucket-relative paths such as `projects/my-project/123456-ab12cd34.webp`, not as a local file path. The public site converts those paths to the Supabase public URL. If an upload fails, read the exact Storage error shown in Admin and check that the signed-in user's UUID exists in `public.admins`.
