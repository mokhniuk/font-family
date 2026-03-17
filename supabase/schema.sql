-- ============================================================
-- Font Family — Supabase Schema
-- Run this in your Supabase project's SQL editor
-- ============================================================

-- 1. Tables
-- ============================================================

create table public.font_families (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  category    text not null check (category in ('sans-serif', 'serif', 'monospace', 'display', 'handwriting')),
  author      text,
  description text,
  license     text,
  created_at  timestamptz not null default now()
);

create table public.font_files (
  id           uuid primary key default gen_random_uuid(),
  family_id    uuid not null references public.font_families(id) on delete cascade,
  weight       integer not null default 400,
  style        text not null default 'normal' check (style in ('normal', 'italic')),
  format       text not null,
  storage_path text not null,
  file_name    text not null
);

create index on public.font_files(family_id);


-- 2. Row Level Security
-- ============================================================

alter table public.font_families enable row level security;
alter table public.font_files    enable row level security;

-- Public read access (anyone can browse/use the CDN)
create policy "public read font_families"
  on public.font_families for select using (true);

create policy "public read font_files"
  on public.font_files for select using (true);

-- Authenticated (admin) write access
create policy "admin insert font_families"
  on public.font_families for insert
  with check (auth.role() = 'authenticated');

create policy "admin update font_families"
  on public.font_families for update
  using (auth.role() = 'authenticated');

create policy "admin delete font_families"
  on public.font_families for delete
  using (auth.role() = 'authenticated');

create policy "admin insert font_files"
  on public.font_files for insert
  with check (auth.role() = 'authenticated');

create policy "admin update font_files"
  on public.font_files for update
  using (auth.role() = 'authenticated');

create policy "admin delete font_files"
  on public.font_files for delete
  using (auth.role() = 'authenticated');


-- 3. Storage bucket
-- ============================================================
-- Run this in the SQL editor OR create the bucket manually in
-- the Supabase dashboard (Storage → New bucket → name: fonts, Public: on)

insert into storage.buckets (id, name, public)
values ('fonts', 'fonts', true)
on conflict (id) do nothing;

-- Storage RLS policies
create policy "public read fonts storage"
  on storage.objects for select
  using (bucket_id = 'fonts');

create policy "admin upload fonts storage"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'fonts');

create policy "admin update fonts storage"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'fonts');

create policy "admin delete fonts storage"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'fonts');
