-- Red Dot Drive live location (additive; does not modify donation tables/functions)
create table if not exists public.live_location (
  driver_id uuid primary key references auth.users(id) on delete cascade,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  accuracy_m double precision,
  speed_mps double precision,
  heading_deg double precision,
  updated_at timestamptz not null default now()
);

alter table public.live_location enable row level security;

-- Visitors can read the current live location only. No write access is granted to anon.
drop policy if exists "Public can view live location" on public.live_location;
create policy "Public can view live location"
on public.live_location
for select
using (true);

-- Explicit grants ensure the browser's anon/publishable client can perform the public SELECT.
grant select on public.live_location to anon, authenticated;

-- The authenticated driver can only manage their own location row.
drop policy if exists "Driver can insert own location" on public.live_location;
create policy "Driver can insert own location"
on public.live_location
for insert
to authenticated
with check (auth.uid() = driver_id);

drop policy if exists "Driver can update own location" on public.live_location;
create policy "Driver can update own location"
on public.live_location
for update
to authenticated
using (auth.uid() = driver_id)
with check (auth.uid() = driver_id);

drop policy if exists "Driver can delete own location" on public.live_location;
create policy "Driver can delete own location"
on public.live_location
for delete
to authenticated
using (auth.uid() = driver_id);

-- Enable Supabase Realtime for this table without failing if it is already enabled.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'live_location'
  ) then
    alter publication supabase_realtime add table public.live_location;
  end if;
end $$;
