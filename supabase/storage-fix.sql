-- Run this in Supabase SQL Editor after schema.sql.
-- Reconciles the public portfolio bucket and its access policies safely.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio',
  'portfolio',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']::text[]
)
on conflict (id) do update
set name = excluded.name,
    public = true,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Public visitors may only read objects in this bucket.
drop policy if exists portfolio_public_read on storage.objects;
create policy portfolio_public_read
on storage.objects for select
 to anon, authenticated
using (bucket_id = 'portfolio');

-- Uploads and mutations require an authenticated user registered in public.admins.
drop policy if exists portfolio_admin_insert on storage.objects;
create policy portfolio_admin_insert
on storage.objects for insert to authenticated
with check (bucket_id = 'portfolio' and public.is_admin());

drop policy if exists portfolio_admin_update on storage.objects;
create policy portfolio_admin_update
on storage.objects for update to authenticated
using (bucket_id = 'portfolio' and public.is_admin())
with check (bucket_id = 'portfolio' and public.is_admin());

drop policy if exists portfolio_admin_delete on storage.objects;
create policy portfolio_admin_delete
on storage.objects for delete to authenticated
using (bucket_id = 'portfolio' and public.is_admin());

-- Verify the bucket configuration and current policies after running this script.
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'portfolio';

select policyname, roles, cmd
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
  and policyname like 'portfolio_%'
order by policyname;
