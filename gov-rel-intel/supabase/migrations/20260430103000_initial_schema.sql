create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry text,
  description text,
  active boolean not null default true,
  primary_contact text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.client_watchlists (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  keyword text not null,
  category text,
  weight integer not null default 5 check (weight between 1 and 10),
  created_at timestamptz not null default now()
);

create table if not exists public.source_items (
  id uuid primary key default gen_random_uuid(),
  source_type text not null,
  source_name text,
  title text not null,
  url text,
  published_date date,
  raw_text text,
  clean_text text,
  summary text,
  topic_tags text[] not null default '{}',
  ministry text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (url)
);

create table if not exists public.client_matches (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  source_item_id uuid not null references public.source_items(id) on delete cascade,
  relevance_score integer check (relevance_score between 0 and 100),
  matched_keywords text[] not null default '{}',
  matched_themes text[] not null default '{}',
  relevance_explanation text,
  risk_level text check (risk_level in ('Low', 'Medium', 'High', 'Critical')),
  opportunity_level text check (opportunity_level in ('Low', 'Medium', 'High', 'Critical')),
  recommended_action text,
  should_include_in_client_report boolean not null default false,
  status text not null default 'New' check (
    status in ('New', 'Reviewed', 'Relevant', 'Not relevant', 'Action required', 'Added to report', 'Archived')
  ),
  human_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, source_item_id)
);

create table if not exists public.stakeholders (
  id uuid primary key default gen_random_uuid(),
  first_name text,
  last_name text,
  full_name text not null,
  title text,
  organization text,
  ministry text,
  riding text,
  stakeholder_type text,
  email text,
  phone text,
  linkedin_url text,
  website_url text,
  bio text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stakeholder_relationships (
  id uuid primary key default gen_random_uuid(),
  stakeholder_id uuid not null references public.stakeholders(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  relationship_strength text not null default 'Unknown' check (
    relationship_strength in (
      'Unknown',
      'No relationship',
      'Introductory contact',
      'Warm relationship',
      'Strong relationship',
      'Champion',
      'Concern/Opposed'
    )
  ),
  strategic_value text not null default 'Medium' check (
    strategic_value in ('Low', 'Medium', 'High', 'Critical')
  ),
  position_on_issue text not null default 'Unknown' check (
    position_on_issue in ('Unknown', 'Supportive', 'Neutral', 'Concerned', 'Opposed', 'Mixed')
  ),
  relationship_owner text,
  last_contact_date date,
  next_follow_up_date date,
  known_interests text,
  known_sensitivities text,
  engagement_angle text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (stakeholder_id, client_id)
);

create table if not exists public.interactions (
  id uuid primary key default gen_random_uuid(),
  stakeholder_id uuid references public.stakeholders(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  source_item_id uuid references public.source_items(id) on delete set null,
  interaction_type text not null check (
    interaction_type in (
      'Meeting',
      'Phone call',
      'Email',
      'Event conversation',
      'Letter sent',
      'Briefing sent',
      'Follow-up',
      'Introductory outreach',
      'Internal note'
    )
  ),
  interaction_date date not null,
  summary text,
  attendees text,
  outcome text,
  follow_up_required boolean not null default false,
  follow_up_deadline date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  client_id uuid references public.clients(id) on delete set null,
  stakeholder_id uuid references public.stakeholders(id) on delete set null,
  source_item_id uuid references public.source_items(id) on delete set null,
  owner text,
  due_date date,
  priority text not null default 'Medium' check (
    priority in ('Low', 'Medium', 'High', 'Urgent')
  ),
  status text not null default 'Not started' check (
    status in ('Not started', 'In progress', 'Waiting', 'Complete', 'Cancelled')
  ),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade,
  title text not null,
  report_type text not null,
  start_date date,
  end_date date,
  body text,
  status text not null default 'Draft' check (
    status in ('Draft', 'In review', 'Final')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.report_items (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  source_item_id uuid references public.source_items(id) on delete set null,
  client_match_id uuid references public.client_matches(id) on delete set null,
  sort_order integer not null default 0,
  custom_summary text,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_outputs (
  id uuid primary key default gen_random_uuid(),
  related_entity_type text not null,
  related_entity_id uuid not null,
  output_type text not null,
  prompt_version text,
  model text,
  input_snapshot jsonb,
  output_json jsonb,
  output_text text,
  created_at timestamptz not null default now()
);

create index if not exists idx_clients_active on public.clients(active);
create index if not exists idx_watchlists_client on public.client_watchlists(client_id);
create index if not exists idx_source_items_published_date on public.source_items(published_date desc);
create index if not exists idx_source_items_source_type on public.source_items(source_type);
create index if not exists idx_client_matches_client_status on public.client_matches(client_id, status);
create index if not exists idx_client_matches_score on public.client_matches(relevance_score desc);
create index if not exists idx_client_matches_created_at on public.client_matches(created_at desc);
create index if not exists idx_stakeholder_relationships_client on public.stakeholder_relationships(client_id);
create index if not exists idx_stakeholder_relationships_follow_up on public.stakeholder_relationships(next_follow_up_date);
create index if not exists idx_tasks_client_status on public.tasks(client_id, status);
create index if not exists idx_tasks_due_date on public.tasks(due_date);
create index if not exists idx_tasks_status on public.tasks(status);
create index if not exists idx_reports_client on public.reports(client_id);
create index if not exists idx_report_items_report on public.report_items(report_id);
create index if not exists idx_ai_outputs_related_entity on public.ai_outputs(related_entity_type, related_entity_id);

drop trigger if exists clients_updated_at on public.clients;
create trigger clients_updated_at
before update on public.clients
for each row execute function public.set_updated_at();

drop trigger if exists source_items_updated_at on public.source_items;
create trigger source_items_updated_at
before update on public.source_items
for each row execute function public.set_updated_at();

drop trigger if exists client_matches_updated_at on public.client_matches;
create trigger client_matches_updated_at
before update on public.client_matches
for each row execute function public.set_updated_at();

drop trigger if exists stakeholders_updated_at on public.stakeholders;
create trigger stakeholders_updated_at
before update on public.stakeholders
for each row execute function public.set_updated_at();

drop trigger if exists stakeholder_relationships_updated_at on public.stakeholder_relationships;
create trigger stakeholder_relationships_updated_at
before update on public.stakeholder_relationships
for each row execute function public.set_updated_at();

drop trigger if exists interactions_updated_at on public.interactions;
create trigger interactions_updated_at
before update on public.interactions
for each row execute function public.set_updated_at();

drop trigger if exists reports_updated_at on public.reports;
create trigger reports_updated_at
before update on public.reports
for each row execute function public.set_updated_at();

alter table public.clients enable row level security;
alter table public.client_watchlists enable row level security;
alter table public.source_items enable row level security;
alter table public.client_matches enable row level security;
alter table public.stakeholders enable row level security;
alter table public.stakeholder_relationships enable row level security;
alter table public.interactions enable row level security;
alter table public.tasks enable row level security;
alter table public.reports enable row level security;
alter table public.report_items enable row level security;
alter table public.ai_outputs enable row level security;

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
      'create policy "%1$s_read" on public.%1$s for select to authenticated using (true);',
      t
    );
    execute format(
      'create policy "%1$s_write" on public.%1$s for all to authenticated using (true) with check (true);',
      t
    );
  end loop;
end $$;
