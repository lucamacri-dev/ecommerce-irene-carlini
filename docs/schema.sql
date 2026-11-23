-- Schema for the fake-door test (events, leads, admin allow-list).
-- Run once in the Lovable Cloud / Supabase SQL editor. It is intentionally NOT in
-- supabase/migrations/ (AGENTS.md: Lovable manages migrations there).

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  session_id text not null,
  event_type text not null check (event_type in
    ('landing','view_product','select_option','add_to_cart','begin_checkout','purchase_intent')),
  product_slug text,
  color text,
  size int,
  quantity int,
  path text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  meta jsonb not null default '{}'::jsonb
);
create index if not exists events_created_idx on public.events (created_at desc);
create index if not exists events_type_idx on public.events (event_type);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  session_id text,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  address text,
  city text,
  zip text,
  province text,
  notes text,
  marketing_consent boolean not null default false,
  items jsonb not null default '[]'::jsonb,
  total_eur numeric
);

-- Only people listed here can read the data. Add the emails of the admin accounts
-- (create the users first under Authentication, with email + password).
create table if not exists public.admin_emails (
  email text primary key
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_emails
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

alter table public.events enable row level security;
alter table public.leads enable row level security;
alter table public.admin_emails enable row level security;

-- Visitors (anonymous) can only INSERT. They can never read anything back.
create policy "anyone can insert events" on public.events
  for insert to anon, authenticated with check (true);
create policy "anyone can insert leads" on public.leads
  for insert to anon, authenticated with check (true);

-- Only admins can read.
create policy "admins read events" on public.events
  for select to authenticated using (public.is_admin());
create policy "admins read leads" on public.leads
  for select to authenticated using (public.is_admin());

-- admin_emails has no policies: nobody can read or write it through the API.
-- Manage it from the SQL editor, e.g.:
--   insert into public.admin_emails (email) values ('you@example.com'), ('client@example.com');
