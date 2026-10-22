create extension if not exists pgcrypto;

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public, auth
as $$ select exists (select 1 from public.admins where user_id = auth.uid()) $$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create table if not exists public.site_content (
  key text primary key check (length(key) between 1 and 120),
  value text not null check (length(value) <= 10000),
  updated_at timestamptz not null default now()
);

alter table public.site_content drop constraint if exists site_content_validation;
alter table public.site_content add constraint site_content_validation check (
  length(value) <= 10000
  and (key not like 'social.%' or value = '' or value ~* '^https?://')
  and (key <> 'contact.email' or value = '' or (length(value) <= 254 and value ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'))
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 80),
  title text not null check (length(title) between 1 and 120),
  type text not null default '' check (length(type) <= 120),
  year text not null default '' check (length(year) <= 12),
  client text not null default '' check (length(client) <= 160),
  role text not null default '' check (length(role) <= 160),
  services text[] not null default '{}',
  category text not null default '' check (length(category) <= 80),
  description text not null default '' check (length(description) <= 4000),
  challenge text not null default '' check (length(challenge) <= 6000),
  approach text not null default '' check (length(approach) <= 6000),
  outcome text not null default '' check (length(outcome) <= 6000),
  tone text not null default '#d9d5cb' check (tone ~ '^#[0-9A-Fa-f]{6}$'),
  shape text not null default 'arch' check (shape in ('arch','orbit','sun','grid')),
  cover_path text check (cover_path is null or length(cover_path) <= 500),
  repo_url text not null default '' check (length(repo_url) <= 2000 and (repo_url = '' or repo_url ~* '^https?://')),
  live_url text not null default '' check (length(live_url) <= 2000 and (live_url = '' or live_url ~* '^https?://')),
  tech text[] not null default '{}',
  published boolean not null default false,
  featured boolean not null default false,
  sort_order integer not null default 0 check (sort_order between -100000 and 100000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_gallery (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null default '' check (length(title) <= 160),
  caption text not null default '' check (length(caption) <= 1000),
  shape text not null default 'arch' check (shape in ('arch','orbit','sun','grid')),
  tone text not null default '#d9d5cb' check (tone ~ '^#[0-9A-Fa-f]{6}$'),
  image_path text not null default '' check (length(image_path) <= 500),
  sort_order integer not null default 0 check (sort_order between -100000 and 100000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  code text not null default '' check (length(code) <= 12),
  title text not null unique check (length(title) between 1 and 160),
  copy text not null default '' check (length(copy) <= 2000),
  tags text not null default '' check (length(tags) <= 500),
  sort_order integer not null default 0,
  visible boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.focus_areas (
  id uuid primary key default gen_random_uuid(),
  title text not null unique check (length(title) between 1 and 160),
  copy text not null default '' check (length(copy) <= 2000),
  tags text not null default '' check (length(tags) <= 500),
  sort_order integer not null default 0,
  visible boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.experience (
  id uuid primary key default gen_random_uuid(),
  period text not null default '' check (length(period) <= 80),
  role text not null check (length(role) between 1 and 160),
  place text not null default '' check (length(place) <= 240),
  sort_order integer not null default 0,
  visible boolean not null default true,
  updated_at timestamptz not null default now(),
  unique(role, place)
);

create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  title text not null unique check (length(title) between 1 and 160),
  copy text not null default '' check (length(copy) <= 2000),
  sort_order integer not null default 0,
  visible boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null unique check (length(question) between 1 and 500),
  answer text not null check (length(answer) between 1 and 3000),
  sort_order integer not null default 0,
  visible boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 120),
  email text not null check (length(email) between 3 and 254 and email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
  subject text not null default '' check (length(subject) <= 160),
  message text not null check (length(trim(message)) between 10 and 5000),
  created_at timestamptz not null default now(),
  is_read boolean not null default false
);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public
as $$ begin new.updated_at = now(); return new; end $$;

do $$ declare t text; begin
  foreach t in array array['site_content','projects','project_gallery','skills','focus_areas','experience','milestones','faqs'] loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

alter table public.admins enable row level security;
alter table public.site_content enable row level security;
alter table public.projects enable row level security;
alter table public.project_gallery enable row level security;
alter table public.skills enable row level security;
alter table public.focus_areas enable row level security;
alter table public.experience enable row level security;
alter table public.milestones enable row level security;
alter table public.faqs enable row level security;
alter table public.messages enable row level security;

do $$ declare t text; begin
  foreach t in array array['admins','site_content','projects','project_gallery','skills','focus_areas','experience','milestones','faqs','messages'] loop
    execute format('drop policy if exists admin_select on public.%I', t);
    execute format('drop policy if exists admin_insert on public.%I', t);
    execute format('drop policy if exists admin_update on public.%I', t);
    execute format('drop policy if exists admin_delete on public.%I', t);
    execute format('create policy admin_select on public.%I for select to authenticated using (public.is_admin())', t);
    execute format('create policy admin_insert on public.%I for insert to authenticated with check (public.is_admin())', t);
    execute format('create policy admin_update on public.%I for update to authenticated using (public.is_admin()) with check (public.is_admin())', t);
    execute format('create policy admin_delete on public.%I for delete to authenticated using (public.is_admin())', t);
  end loop;
end $$;

drop policy if exists public_site_content_read on public.site_content;
create policy public_site_content_read on public.site_content for select to anon, authenticated using (true);
drop policy if exists public_projects_read on public.projects;
create policy public_projects_read on public.projects for select to anon, authenticated using (published = true or public.is_admin());
drop policy if exists public_gallery_read on public.project_gallery;
create policy public_gallery_read on public.project_gallery for select to anon, authenticated using (exists (select 1 from public.projects p where p.id = project_id and (p.published = true or public.is_admin())));
drop policy if exists public_skills_read on public.skills;
create policy public_skills_read on public.skills for select to anon, authenticated using (visible = true or public.is_admin());
drop policy if exists public_focus_read on public.focus_areas;
create policy public_focus_read on public.focus_areas for select to anon, authenticated using (visible = true or public.is_admin());
drop policy if exists public_experience_read on public.experience;
create policy public_experience_read on public.experience for select to anon, authenticated using (visible = true or public.is_admin());
drop policy if exists public_milestones_read on public.milestones;
create policy public_milestones_read on public.milestones for select to anon, authenticated using (visible = true or public.is_admin());
drop policy if exists public_faqs_read on public.faqs;
create policy public_faqs_read on public.faqs for select to anon, authenticated using (visible = true or public.is_admin());
drop policy if exists public_message_insert on public.messages;
create policy public_message_insert on public.messages for insert to anon, authenticated with check (length(trim(name)) between 1 and 120 and length(email) between 3 and 254 and email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' and length(trim(message)) between 10 and 5000 and length(subject) <= 160);

revoke all on public.admins, public.site_content, public.projects, public.project_gallery, public.skills, public.focus_areas, public.experience, public.milestones, public.faqs, public.messages from anon, authenticated;
grant select on public.site_content, public.projects, public.project_gallery, public.skills, public.focus_areas, public.experience, public.milestones, public.faqs to anon, authenticated;
grant insert on public.messages to anon, authenticated;
grant select, insert, update, delete on public.admins, public.site_content, public.projects, public.project_gallery, public.skills, public.focus_areas, public.experience, public.milestones, public.faqs, public.messages to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio','portfolio',true,5242880,array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update set public = true, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg','image/png','image/webp','application/pdf'];
drop policy if exists portfolio_public_read on storage.objects;
create policy portfolio_public_read on storage.objects for select to anon, authenticated using (bucket_id = 'portfolio');
drop policy if exists portfolio_admin_insert on storage.objects;
create policy portfolio_admin_insert on storage.objects for insert to authenticated with check (bucket_id = 'portfolio' and public.is_admin());
drop policy if exists portfolio_admin_update on storage.objects;
create policy portfolio_admin_update on storage.objects for update to authenticated using (bucket_id = 'portfolio' and public.is_admin()) with check (bucket_id = 'portfolio' and public.is_admin());
drop policy if exists portfolio_admin_delete on storage.objects;
create policy portfolio_admin_delete on storage.objects for delete to authenticated using (bucket_id = 'portfolio' and public.is_admin());
