create extension if not exists pgcrypto;

create table if not exists public.booth_projects (
  id uuid primary key default gen_random_uuid(),
  owner_key text not null,
  template_id text not null,
  project_name text not null,
  share_url text,
  project jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_booth_projects_owner_updated
  on public.booth_projects (owner_key, updated_at desc);

create or replace function public.set_booth_project_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists booth_projects_set_timestamp on public.booth_projects;
create trigger booth_projects_set_timestamp
before update on public.booth_projects
for each row
execute function public.set_booth_project_timestamp();

alter table public.booth_projects enable row level security;

drop policy if exists "public booth project access" on public.booth_projects;
create policy "public booth project access"
on public.booth_projects
for all
using (true)
with check (true);
