create table if not exists public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.app_admins enable row level security;

create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.app_admins
    where user_id = auth.uid()
      and active = true
  );
$$;

revoke all on function public.is_app_admin() from public;
grant execute on function public.is_app_admin() to authenticated;

drop policy if exists "app_admins_read" on public.app_admins;
drop policy if exists "app_admins_write" on public.app_admins;

create policy "app_admins_read"
on public.app_admins
for select
to authenticated
using (user_id = auth.uid() or public.is_app_admin());

create policy "app_admins_write"
on public.app_admins
for all
to authenticated
using (public.is_app_admin())
with check (public.is_app_admin());

do $$
declare
  t text;
begin
  foreach t in array array[
    'clients',
    'client_watchlists',
    'source_items',
    'client_matches',
    'stakeholders',
    'stakeholder_relationships',
    'interactions',
    'tasks',
    'reports',
    'report_items',
    'ai_outputs'
  ]
  loop
    execute format('drop policy if exists "%1$s_read" on public.%1$s;', t);
    execute format('drop policy if exists "%1$s_write" on public.%1$s;', t);
    execute format(
      'create policy "%1$s_read" on public.%1$s for select to authenticated using (public.is_app_admin());',
      t
    );
    execute format(
      'create policy "%1$s_write" on public.%1$s for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin());',
      t
    );
  end loop;
end $$;
