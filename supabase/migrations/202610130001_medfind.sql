-- MedFind Ethiopia schema. Apply this migration in a Supabase project's SQL Editor.
-- No real pharmacy or inventory rows are seeded here.

create or replace function public.medfind_opening_hours_valid(candidate jsonb)
returns boolean language sql immutable parallel safe set search_path = pg_catalog
as $$
  select case when jsonb_typeof(candidate) <> 'object' then false
  else not exists (
    select 1 from jsonb_each(candidate) as hours(day, period)
    where length(hours.day) > 20
      or jsonb_typeof(hours.period) <> 'string'
      or length(hours.period #>> '{}') > 100
  ) end
$$;

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.pharmacies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  address text not null check (length(trim(address)) between 5 and 250),
  neighborhood text not null check (length(trim(neighborhood)) between 2 and 80),
  phone text not null check (length(trim(phone)) between 7 and 30),
  contact_email text check (contact_email is null or (length(contact_email) <= 200 and contact_email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$')),
  latitude numeric(9,6),
  longitude numeric(9,6),
  opening_hours jsonb not null default '{}'::jsonb check (public.medfind_opening_hours_valid(opening_hours)),
  is_approved boolean not null default false,
  is_verified boolean not null default false,
  suspended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pharmacy_coordinates_valid check ((latitude is null and longitude is null) or (latitude between -90 and 90 and longitude between -180 and 180))
);

create table if not exists public.pharmacy_registrations (
  id uuid primary key default gen_random_uuid(),
  pharmacy_name text not null check (length(trim(pharmacy_name)) between 2 and 120),
  contact_name text not null check (length(trim(contact_name)) between 2 and 100),
  contact_email text not null check (length(trim(contact_email)) <= 200 and contact_email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
  phone text not null check (length(trim(phone)) between 7 and 30),
  address text not null check (length(trim(address)) between 5 and 250),
  neighborhood text not null check (length(trim(neighborhood)) between 2 and 80),
  message text check (message is null or length(message) <= 500),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  linked_pharmacy_id uuid references public.pharmacies(id) on delete set null,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.pharmacy_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pharmacy_id uuid not null references public.pharmacies(id) on delete cascade,
  role text not null check (role in ('owner','manager','staff')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, pharmacy_id)
);

create table if not exists public.medicine_catalog (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 120),
  active_ingredient text check (active_ingredient is null or length(active_ingredient) <= 120),
  strength text not null default '' check (length(strength) <= 60),
  form text not null default '' check (length(form) <= 40),
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create unique index if not exists medicine_catalog_dedupe_idx
  on public.medicine_catalog (lower(name), lower(coalesce(active_ingredient,'')), lower(strength), lower(form));

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);
insert into public.app_settings (key, value)
values ('availability_expiry_hours', '{"hours":24}'::jsonb)
on conflict (key) do nothing;

create table if not exists public.inventory_confirmations (
  id uuid primary key default gen_random_uuid(),
  pharmacy_id uuid not null references public.pharmacies(id) on delete cascade,
  medicine_id uuid not null references public.medicine_catalog(id) on delete restrict,
  status text not null check (status in ('in_stock','unavailable','unknown')),
  source text not null default 'pharmacy_staff' check (source in ('pharmacy_staff')),
  confirmed_by uuid references auth.users(id) on delete set null,
  last_confirmed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pharmacy_id, medicine_id)
);
create index if not exists inventory_confirmations_expiry_idx on public.inventory_confirmations (expires_at);
create index if not exists inventory_confirmations_pharmacy_idx on public.inventory_confirmations (pharmacy_id, last_confirmed_at desc);
create index if not exists inventory_confirmations_medicine_idx on public.inventory_confirmations (medicine_id, last_confirmed_at desc);

create table if not exists public.availability_reports (
  id uuid primary key default gen_random_uuid(),
  pharmacy_id uuid not null references public.pharmacies(id) on delete cascade,
  confirmation_id uuid references public.inventory_confirmations(id) on delete set null,
  category text not null check (category in ('stock_inaccurate','business_details','other')),
  details text check (details is null or length(details) <= 1000),
  status text not null default 'pending' check (status in ('pending','reviewed','resolved','dismissed')),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewer_id uuid references auth.users(id) on delete set null
);
create index if not exists availability_reports_status_idx on public.availability_reports (status, submitted_at desc);

create or replace function public.is_medfind_admin()
returns boolean language sql stable security definer set search_path = pg_catalog
as $$ select exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin') $$;

create or replace function public.is_medfind_pharmacy_member(target_pharmacy_id uuid)
returns boolean language sql stable security definer set search_path = pg_catalog
as $$ select exists (
  select 1 from public.pharmacy_members
  where user_id = auth.uid() and pharmacy_id = target_pharmacy_id and is_active = true
) $$;

create or replace function public.is_medfind_pharmacy_operational(target_pharmacy_id uuid)
returns boolean language sql stable security definer set search_path = pg_catalog
as $$ select exists (
  select 1
  from public.pharmacy_members m
  join public.pharmacies p on p.id = m.pharmacy_id
  where m.user_id = auth.uid() and m.pharmacy_id = target_pharmacy_id
    and m.is_active = true and p.is_approved = true and p.suspended_at is null
) $$;

create or replace function public.is_medfind_pharmacy_editable(target_pharmacy_id uuid)
returns boolean language sql stable security definer set search_path = pg_catalog
as $$ select exists (
  select 1
  from public.pharmacy_members m
  join public.pharmacies p on p.id = m.pharmacy_id
  where m.user_id = auth.uid() and m.pharmacy_id = target_pharmacy_id
    and m.is_active = true and p.suspended_at is null
) $$;

revoke all on function public.is_medfind_admin() from public;
revoke all on function public.is_medfind_pharmacy_member(uuid) from public;
revoke all on function public.is_medfind_pharmacy_operational(uuid) from public;
revoke all on function public.is_medfind_pharmacy_editable(uuid) from public;
grant execute on function public.is_medfind_admin() to anon, authenticated;
grant execute on function public.is_medfind_pharmacy_member(uuid) to anon, authenticated;
grant execute on function public.is_medfind_pharmacy_operational(uuid) to anon, authenticated;
grant execute on function public.is_medfind_pharmacy_editable(uuid) to authenticated;

create or replace function public.set_medfind_updated_at()
returns trigger language plpgsql set search_path = pg_catalog
as $$ begin new.updated_at = now(); return new; end $$;

create or replace function public.protect_pharmacy_review_fields()
returns trigger language plpgsql security definer set search_path = pg_catalog
as $$
begin
  if not public.is_medfind_admin() then
    new.is_approved := old.is_approved;
    new.is_verified := old.is_verified;
    new.suspended_at := old.suspended_at;
  end if;
  return new;
end $$;

create or replace function public.stamp_medfind_inventory_confirmation()
returns trigger language plpgsql security definer set search_path = pg_catalog
as $$
declare
  expiry_hours integer := 24;
begin
  select case
    when (value->>'hours') ~ '^[0-9]+$' then (value->>'hours')::integer
    else 24
  end
  into expiry_hours
  from public.app_settings where key = 'availability_expiry_hours';
  expiry_hours := greatest(1, least(coalesce(expiry_hours, 24), 720));
  new.source := 'pharmacy_staff';
  new.confirmed_by := auth.uid();
  new.last_confirmed_at := clock_timestamp();
  new.expires_at := new.last_confirmed_at + make_interval(hours => expiry_hours);
  new.updated_at := now();
  return new;
end $$;

create or replace function public.set_medicine_creator()
returns trigger language plpgsql security definer set search_path = pg_catalog
as $$ begin new.created_by := auth.uid(); return new; end $$;

create or replace function public.set_setting_updated_at()
returns trigger language plpgsql security definer set search_path = pg_catalog
as $$ begin new.updated_at := now(); new.updated_by := auth.uid(); return new; end $$;

drop trigger if exists pharmacies_updated_at on public.pharmacies;
create trigger pharmacies_updated_at before update on public.pharmacies for each row execute function public.set_medfind_updated_at();
drop trigger if exists pharmacies_protect_review_fields on public.pharmacies;
create trigger pharmacies_protect_review_fields before update on public.pharmacies for each row execute function public.protect_pharmacy_review_fields();
drop trigger if exists inventory_stamp_confirmation on public.inventory_confirmations;
create trigger inventory_stamp_confirmation before insert or update on public.inventory_confirmations for each row execute function public.stamp_medfind_inventory_confirmation();
drop trigger if exists medicine_set_creator on public.medicine_catalog;
create trigger medicine_set_creator before insert on public.medicine_catalog for each row execute function public.set_medicine_creator();
drop trigger if exists app_settings_updated_at on public.app_settings;
create trigger app_settings_updated_at before update on public.app_settings for each row execute function public.set_setting_updated_at();

alter table public.user_roles enable row level security;
alter table public.pharmacies enable row level security;
alter table public.pharmacy_registrations enable row level security;
alter table public.pharmacy_members enable row level security;
alter table public.medicine_catalog enable row level security;
alter table public.app_settings enable row level security;
alter table public.inventory_confirmations enable row level security;
alter table public.availability_reports enable row level security;

create policy user_roles_self_or_admin_read on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.is_medfind_admin());
create policy user_roles_admin_write on public.user_roles for all to authenticated
  using (public.is_medfind_admin()) with check (public.is_medfind_admin());

create policy pharmacies_public_or_member_read on public.pharmacies for select to anon, authenticated
  using ((is_approved and suspended_at is null) or public.is_medfind_pharmacy_member(id) or public.is_medfind_admin());
create policy pharmacies_admin_insert on public.pharmacies for insert to authenticated
  with check (public.is_medfind_admin());
create policy pharmacies_member_update on public.pharmacies for update to authenticated
  using (public.is_medfind_pharmacy_editable(id) or public.is_medfind_admin())
  with check (public.is_medfind_pharmacy_editable(id) or public.is_medfind_admin());
create policy pharmacies_admin_delete on public.pharmacies for delete to authenticated
  using (public.is_medfind_admin());

create policy pharmacy_registrations_public_submit on public.pharmacy_registrations for insert to anon, authenticated
  with check (status = 'pending' and linked_pharmacy_id is null and reviewed_at is null);
create policy pharmacy_registrations_admin_read on public.pharmacy_registrations for select to authenticated
  using (public.is_medfind_admin());
create policy pharmacy_registrations_admin_update on public.pharmacy_registrations for update to authenticated
  using (public.is_medfind_admin()) with check (public.is_medfind_admin());
create policy pharmacy_registrations_admin_delete on public.pharmacy_registrations for delete to authenticated
  using (public.is_medfind_admin());

create policy pharmacy_members_self_or_admin_read on public.pharmacy_members for select to authenticated
  using (user_id = auth.uid() or public.is_medfind_admin());
create policy pharmacy_members_admin_manage on public.pharmacy_members for all to authenticated
  using (public.is_medfind_admin()) with check (public.is_medfind_admin());

create policy medicine_catalog_public_read on public.medicine_catalog for select to anon, authenticated
  using (is_active or public.is_medfind_admin());
create policy medicine_catalog_staff_insert on public.medicine_catalog for insert to authenticated
  with check (exists (select 1 from public.pharmacy_members m where m.user_id = auth.uid() and m.is_active and public.is_medfind_pharmacy_operational(m.pharmacy_id)) or public.is_medfind_admin());
create policy medicine_catalog_admin_update on public.medicine_catalog for update to authenticated
  using (public.is_medfind_admin()) with check (public.is_medfind_admin());
create policy medicine_catalog_admin_delete on public.medicine_catalog for delete to authenticated
  using (public.is_medfind_admin());

create policy inventory_public_read_approved on public.inventory_confirmations for select to anon, authenticated
  using (exists (
    select 1 from public.pharmacies p
    where p.id = pharmacy_id and p.is_approved and p.suspended_at is null
  ) or public.is_medfind_pharmacy_operational(pharmacy_id) or public.is_medfind_admin());
create policy inventory_member_insert_own on public.inventory_confirmations for insert to authenticated
  with check (public.is_medfind_pharmacy_operational(pharmacy_id) or public.is_medfind_admin());
create policy inventory_member_update_own on public.inventory_confirmations for update to authenticated
  using (public.is_medfind_pharmacy_operational(pharmacy_id) or public.is_medfind_admin())
  with check (public.is_medfind_pharmacy_operational(pharmacy_id) or public.is_medfind_admin());
create policy inventory_admin_delete on public.inventory_confirmations for delete to authenticated
  using (public.is_medfind_admin());

create policy availability_reports_public_submit on public.availability_reports for insert to anon, authenticated
  with check (status = 'pending' and reviewed_at is null and reviewer_id is null);
create policy availability_reports_admin_read on public.availability_reports for select to authenticated
  using (public.is_medfind_admin());
create policy availability_reports_admin_update on public.availability_reports for update to authenticated
  using (public.is_medfind_admin()) with check (public.is_medfind_admin());
create policy availability_reports_admin_delete on public.availability_reports for delete to authenticated
  using (public.is_medfind_admin());

create policy app_settings_admin_only on public.app_settings for all to authenticated
  using (public.is_medfind_admin()) with check (public.is_medfind_admin());

grant select on public.pharmacies to anon, authenticated;
revoke select on public.medicine_catalog, public.inventory_confirmations from anon, authenticated;
grant select (id, name, active_ingredient, strength, form, is_active) on public.medicine_catalog to anon, authenticated;
grant select (id, pharmacy_id, medicine_id, status, source, last_confirmed_at, expires_at) on public.inventory_confirmations to anon, authenticated;
grant select, insert, update, delete on public.user_roles, public.pharmacy_members, public.pharmacy_registrations, public.availability_reports, public.app_settings to authenticated;
grant insert on public.pharmacy_registrations, public.availability_reports to anon, authenticated;
grant insert, update, delete on public.pharmacies, public.medicine_catalog, public.inventory_confirmations to authenticated;

-- Bootstrap the first administrator only after that person signs up in Supabase Auth:
-- insert into public.user_roles (user_id, role)
-- select id, 'admin' from auth.users where email = 'YOUR_ADMIN_EMAIL';
-- Run manually as a project owner in the Supabase SQL Editor, replacing the placeholder.
