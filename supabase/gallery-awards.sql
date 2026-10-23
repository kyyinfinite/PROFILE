-- ============================================================================
-- Gallery & Awards  —  jalankan SEKALI di Supabase → SQL Editor (aman dijalankan ulang).
-- Prasyarat: schema.sql dan storage-fix.sql sudah pernah dijalankan
-- (tabel public.admins, fungsi public.is_admin(), public.set_updated_at(), bucket "portfolio").
-- Gambar disimpan di bucket "portfolio" pada folder gallery/ dan awards/.
-- ============================================================================

-- ---------- 1. Tabel ----------
create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  title text not null default '' check (length(title) <= 160),
  caption text not null default '' check (length(caption) <= 1000),
  alt_text text not null default '' check (length(alt_text) <= 300),
  category text not null default 'Kegiatan' check (length(category) between 1 and 60),
  taken_on date,
  image_path text not null check (length(image_path) between 1 and 500),
  width integer check (width is null or width between 1 and 20000),
  height integer check (height is null or height between 1 and 20000),
  featured boolean not null default false,
  visible boolean not null default true,
  sort_order integer not null default 0 check (sort_order between -100000 and 100000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.awards (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) between 1 and 200),
  issuer text not null default '' check (length(issuer) <= 200),
  rank text not null default '' check (length(rank) <= 60),
  level text not null default '' check (level in ('', 'sekolah', 'kecamatan', 'kabupaten', 'provinsi', 'nasional', 'internasional')),
  awarded_year smallint check (awarded_year is null or awarded_year between 1990 and 2100),
  description text not null default '' check (length(description) <= 2000),
  image_path text not null default '' check (length(image_path) <= 500),
  credential_url text not null default '' check (length(credential_url) <= 2000 and (credential_url = '' or credential_url ~* '^https?://')),
  featured boolean not null default false,
  visible boolean not null default true,
  sort_order integer not null default 0 check (sort_order between -100000 and 100000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists awards_title_issuer_key on public.awards (title, issuer);
create index if not exists gallery_items_sort_idx on public.gallery_items (visible, sort_order, created_at desc);
create index if not exists awards_sort_idx on public.awards (visible, sort_order);

-- ---------- 2. updated_at ----------
do $$ declare t text; begin
  foreach t in array array['gallery_items', 'awards'] loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- ---------- 3. Row Level Security ----------
alter table public.gallery_items enable row level security;
alter table public.awards enable row level security;

do $$ declare t text; begin
  foreach t in array array['gallery_items', 'awards'] loop
    execute format('drop policy if exists admin_select on public.%I', t);
    execute format('drop policy if exists admin_insert on public.%I', t);
    execute format('drop policy if exists admin_update on public.%I', t);
    execute format('drop policy if exists admin_delete on public.%I', t);
    execute format('drop policy if exists public_read on public.%I', t);
    execute format('create policy admin_select on public.%I for select to authenticated using (public.is_admin())', t);
    execute format('create policy admin_insert on public.%I for insert to authenticated with check (public.is_admin())', t);
    execute format('create policy admin_update on public.%I for update to authenticated using (public.is_admin()) with check (public.is_admin())', t);
    execute format('create policy admin_delete on public.%I for delete to authenticated using (public.is_admin())', t);
    -- Pengunjung hanya melihat item yang visible; admin melihat semuanya.
    execute format('create policy public_read on public.%I for select to anon, authenticated using (visible = true or public.is_admin())', t);
  end loop;
end $$;

revoke all on public.gallery_items, public.awards from anon, authenticated;
grant select on public.gallery_items, public.awards to anon, authenticated;
grant insert, update, delete on public.gallery_items, public.awards to authenticated;

-- ---------- 4. Storage ----------
-- Bucket "portfolio" sudah publik (read) dan hanya admin yang boleh upload/ubah/hapus
-- lewat storage-fix.sql. Blok ini memastikan bucket ada dan mengizinkan JPG/PNG/WebP/PDF 5 MB.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio', 'portfolio', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']::text[])
on conflict (id) do update
set public = true,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists portfolio_public_read on storage.objects;
create policy portfolio_public_read on storage.objects for select to anon, authenticated using (bucket_id = 'portfolio');
drop policy if exists portfolio_admin_insert on storage.objects;
create policy portfolio_admin_insert on storage.objects for insert to authenticated with check (bucket_id = 'portfolio' and public.is_admin());
drop policy if exists portfolio_admin_update on storage.objects;
create policy portfolio_admin_update on storage.objects for update to authenticated using (bucket_id = 'portfolio' and public.is_admin()) with check (bucket_id = 'portfolio' and public.is_admin());
drop policy if exists portfolio_admin_delete on storage.objects;
create policy portfolio_admin_delete on storage.objects for delete to authenticated using (bucket_id = 'portfolio' and public.is_admin());

-- ---------- 5. Data awal penghargaan (dari CV) ----------
insert into public.awards (title, issuer, rank, level, awarded_year, description, featured, sort_order) values
  ('Juara 1 Silat Tanding Putra — Internasional', 'Pakubumi Open', 'Juara 1', 'internasional', null, 'Juara pertama silat tanding putra tingkat internasional (tingkat SD).', true, 1),
  ('Juara 1 Silat Tanding Putra — Nasional', 'Bela Negara', 'Juara 1', 'nasional', null, 'Juara pertama silat tanding putra tingkat nasional (tingkat SD).', false, 2),
  ('Juara 1 Silat Tanding Putra — Nasional', 'Pakubumi Open', 'Juara 1', 'nasional', null, 'Juara pertama silat tanding putra tingkat nasional (tingkat SD).', false, 3),
  ('Juara 1 Silat Tanding Putra — Provinsi', 'Dandrem', 'Juara 1', 'provinsi', null, 'Juara pertama silat tanding putra tingkat provinsi (tingkat SD).', false, 4),
  ('Juara 1 Silat Tanding Putra — Kabupaten', 'Pesona Garut', 'Juara 1', 'kabupaten', null, 'Juara pertama silat tanding putra tingkat kabupaten (tingkat SMP).', true, 5),
  ('Finalis 50 Besar Google Jagoan Coding', 'Google Jagoan Coding', 'Finalis', '', null, 'Masuk 50 besar program coding Google Jagoan Coding.', true, 6),
  ('Finalis Siswa Teraktif Sekolah', 'SMP Negeri 1 Leuwigoong', 'Finalis', 'sekolah', null, 'Masuk finalis siswa teraktif di sekolah.', false, 7),
  ('Siswa Teraktif saat MPLS', 'SMA Negeri 10 Garut', 'Teraktif', 'sekolah', 2026, 'Dinilai paling aktif selama Masa Pengenalan Lingkungan Sekolah.', false, 8),
  ('Peserta Teraktif Perkemahan Masa Tamu', 'Pramuka · SMA Negeri 10 Garut', 'Teraktif', 'sekolah', 2026, 'Terpilih sebagai peserta teraktif dalam perkemahan Masa Tamu.', true, 9)
on conflict (title, issuer) do nothing;

-- ---------- 6. Verifikasi ----------
select 'gallery_items' as tabel, count(*) as baris from public.gallery_items
union all select 'awards', count(*) from public.awards;
