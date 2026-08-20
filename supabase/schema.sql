-- Red Dot Drive 2026 — Supabase schema / migration-safe version
create extension if not exists pgcrypto;

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  goal_amount numeric(12,2) not null check (goal_amount > 0),
  created_at timestamptz not null default now()
);

insert into public.campaigns(slug,name,goal_amount)
values('red-dot-drive-2026','Red Dot Drive 2026',500000)
on conflict(slug) do update set goal_amount=excluded.goal_amount;

create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id),
  amount numeric(12,2) not null check(amount > 0 and amount <= 500000),
  donor_name text,
  phone text,
  transaction_id text,
  transaction_snapshot_path text,
  transaction_note text,
  status text not null default 'pending' check(status in('pending','confirmed','rejected')),
  transaction_shared_at timestamptz,
  verified_at timestamptz,
  rejected_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now()
);

alter table public.donations add column if not exists phone text;
alter table public.donations add column if not exists transaction_id text;
alter table public.donations add column if not exists transaction_snapshot_path text;

-- Seed / preserve the already confirmed ₹25,003 starting balance.
update public.donations
set donor_name=coalesce(nullif(donor_name,''),'Initial campaign contribution'),
    phone=coalesce(nullif(phone,''),'SYSTEM'),
    transaction_id=coalesce(nullif(transaction_id,''),'SEED-25003'),
    transaction_note=coalesce(transaction_note,'Seeded starting balance')
where transaction_note='Seeded starting balance';

insert into public.donations(campaign_id,amount,donor_name,phone,transaction_id,transaction_note,status,verified_at)
select id,25003,'Initial campaign contribution','SYSTEM','SEED-25003','Seeded starting balance','confirmed',now()
from public.campaigns where slug='red-dot-drive-2026'
and not exists(select 1 from public.donations where transaction_id='SEED-25003');

create index if not exists donations_campaign_status_idx on public.donations(campaign_id,status);
create index if not exists donations_created_idx on public.donations(created_at desc);
create index if not exists donations_transaction_id_idx on public.donations(transaction_id) where transaction_id is not null;

do $$ begin
  alter table public.donations add constraint donations_donor_name_required
    check (length(trim(coalesce(donor_name,''))) > 0) not valid;
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.donations add constraint donations_phone_required
    check (length(regexp_replace(coalesce(phone,''),'[^0-9]','','g')) >= 10) not valid;
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.donations add constraint donations_transaction_proof_required
    check (length(trim(coalesce(transaction_id,''))) > 0 or length(trim(coalesce(transaction_snapshot_path,''))) > 0) not valid;
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.donations add constraint donations_snapshot_path_safe
    check (transaction_snapshot_path is null or transaction_snapshot_path like 'pending/%') not valid;
exception when duplicate_object then null; end $$;

create table if not exists public.admins(
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.campaigns enable row level security;
alter table public.donations enable row level security;
alter table public.admins enable row level security;
revoke all on public.donations from anon,authenticated;
revoke all on public.admins from anon,authenticated;
revoke all on public.campaigns from anon,authenticated;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.admins where user_id=(select auth.uid()));
$$;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('donation-proofs','donation-proofs',false,5242880,array['image/jpeg','image/png','image/webp','image/heic','image/heif'])
on conflict (id) do update set public=false, file_size_limit=5242880;

drop policy if exists "Public can upload donation proofs" on storage.objects;
create policy "Public can upload donation proofs"
on storage.objects for insert to anon,authenticated
with check (bucket_id='donation-proofs' and name like 'pending/%');

drop policy if exists "Admins can read donation proofs" on storage.objects;
create policy "Admins can read donation proofs"
on storage.objects for select to authenticated
using (bucket_id='donation-proofs' and public.is_admin());

drop policy if exists "Admins can delete donation proofs" on storage.objects;
create policy "Admins can delete donation proofs"
on storage.objects for delete to authenticated
using (bucket_id='donation-proofs' and public.is_admin());

drop function if exists public.create_pending_donation(numeric,text,text);
create or replace function public.create_pending_donation(
  p_amount numeric,
  p_donor_name text,
  p_phone text,
  p_transaction_id text default null,
  p_snapshot_path text default null,
  p_transaction_note text default null
)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_campaign uuid; v_id uuid; v_name text; v_phone text; v_tx text; v_path text;
begin
  v_name=nullif(trim(coalesce(p_donor_name,'')),'');
  v_phone=nullif(trim(coalesce(p_phone,'')),'');
  v_tx=nullif(trim(coalesce(p_transaction_id,'')),'');
  v_path=nullif(trim(coalesce(p_snapshot_path,'')),'');
  if p_amount is null or p_amount<=0 or p_amount>500000 then raise exception 'Invalid donation amount'; end if;
  if v_name is null then raise exception 'Name is required'; end if;
  if length(regexp_replace(coalesce(v_phone,''),'[^0-9]','','g')) < 10 then raise exception 'A valid phone number is required'; end if;
  if v_tx is null and v_path is null then raise exception 'Transaction ID / UTR or transaction snapshot is required'; end if;
  if v_path is not null and v_path not like 'pending/%' then raise exception 'Invalid transaction snapshot path'; end if;
  select id into v_campaign from public.campaigns where slug='red-dot-drive-2026';
  if v_campaign is null then raise exception 'Campaign not found'; end if;
  insert into public.donations(campaign_id,amount,donor_name,phone,transaction_id,transaction_snapshot_path,transaction_note)
  values(v_campaign,round(p_amount,2),left(v_name,120),left(v_phone,40),left(v_tx,200),left(v_path,500),nullif(left(trim(coalesce(p_transaction_note,'')),500),''))
  returning id into v_id;
  return jsonb_build_object('id',v_id,'amount',round(p_amount,2),'status','pending');
end $$;

create or replace function public.mark_transaction_shared(p_donation_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
begin
 update public.donations set transaction_shared_at=coalesce(transaction_shared_at,now()) where id=p_donation_id and status='pending';
 return found;
end $$;

create or replace function public.get_donation_status(p_donation_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.donations;
begin
 select * into r from public.donations where id=p_donation_id;
 if not found then return null; end if;
 return jsonb_build_object('id',r.id,'amount',r.amount,'status',r.status,'verified_at',r.verified_at);
end $$;

create or replace function public.get_campaign_progress()
returns jsonb language sql security definer set search_path='' as $$
 select jsonb_build_object('raised',coalesce(sum(d.amount) filter(where d.status='confirmed'),0),'goal',c.goal_amount)
 from public.campaigns c left join public.donations d on d.campaign_id=c.id
 where c.slug='red-dot-drive-2026' group by c.goal_amount;
$$;

-- PostgreSQL cannot change the OUT/RETURNS TABLE row type with CREATE OR REPLACE.
-- Drop the old zero-argument function first so this migration is rerunnable.
drop function if exists public.admin_list_pending_donations();
create function public.admin_list_pending_donations()
returns table(id uuid,amount numeric,donor_name text,phone text,transaction_id text,transaction_snapshot_path text,transaction_note text,transaction_shared_at timestamptz,created_at timestamptz)
language sql security definer set search_path='' as $$
 select d.id,d.amount,d.donor_name,d.phone,d.transaction_id,d.transaction_snapshot_path,d.transaction_note,d.transaction_shared_at,d.created_at
 from public.donations d where d.status='pending' and public.is_admin() order by d.created_at asc;
$$;

create or replace function public.verify_donation(p_donation_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
begin
 if not public.is_admin() then raise exception 'Not authorized'; end if;
 update public.donations set status='confirmed',verified_at=now(),rejected_at=null,rejection_reason=null where id=p_donation_id and status='pending';
 return found;
end $$;

create or replace function public.reject_donation(p_donation_id uuid,p_reason text default null)
returns boolean language plpgsql security definer set search_path='' as $$
begin
 if not public.is_admin() then raise exception 'Not authorized'; end if;
 update public.donations set status='rejected',rejected_at=now(),rejection_reason=nullif(left(trim(coalesce(p_reason,'')),500),'') where id=p_donation_id and status='pending';
 return found;
end $$;

grant execute on function public.create_pending_donation(numeric,text,text,text,text,text) to anon,authenticated;
grant execute on function public.mark_transaction_shared(uuid) to anon,authenticated;
grant execute on function public.get_donation_status(uuid) to anon,authenticated;
grant execute on function public.get_campaign_progress() to anon,authenticated;
grant execute on function public.admin_list_pending_donations() to authenticated;
grant execute on function public.verify_donation(uuid) to authenticated;
grant execute on function public.reject_donation(uuid,text) to authenticated;
