insert into public.clients (name, industry, description, primary_contact)
values
  (
    'Sysco Alberta',
    'Food logistics / food service distribution',
    'Sysco supplies food and logistics services to institutions including hospitals, continuing care, schools, restaurants, and remote communities.',
    'Government Relations Lead'
  ),
  (
    'WestJet',
    'Aviation / tourism / transportation',
    'WestJet is an Alberta-based airline focused on Calgary as a strategic hub and policy files tied to tourism, labour, and infrastructure.',
    'Public Affairs Director'
  ),
  (
    'Ciena / Data Centres',
    'Telecom / digital infrastructure / AI data centres',
    'Ciena is active in Alberta policy files connected to AI, data centres, telecom, power infrastructure, and broadband.',
    'Policy & Regulatory Affairs'
  )
on conflict do nothing;

insert into public.client_watchlists (client_id, keyword, category, weight)
select c.id, w.keyword, w.category, w.weight
from public.clients c
join (
  values
    ('Sysco Alberta', 'food security', 'Policy', 8),
    ('Sysco Alberta', 'supply chain', 'Operations', 8),
    ('Sysco Alberta', 'temporary foreign workers', 'Labour', 7),
    ('WestJet', 'aviation', 'Sector', 9),
    ('WestJet', 'YYC', 'Infrastructure', 7),
    ('WestJet', 'tourism', 'Economic development', 8),
    ('Ciena / Data Centres', 'data centres', 'Infrastructure', 9),
    ('Ciena / Data Centres', 'artificial intelligence', 'Digital policy', 8),
    ('Ciena / Data Centres', 'power grid', 'Energy', 8)
) as w(client_name, keyword, category, weight)
on w.client_name = c.name
where not exists (
  select 1
  from public.client_watchlists cw
  where cw.client_id = c.id
    and cw.keyword = w.keyword
);

insert into public.tasks (title, description, client_id, owner, due_date, priority, status)
select
  'Draft weekly briefing update',
  'Prepare a short update for current policy developments and likely stakeholder implications.',
  c.id,
  'Ethan',
  current_date + 3,
  'High',
  'In progress'
from public.clients c
where c.name = 'Sysco Alberta'
  and not exists (
    select 1 from public.tasks t where t.title = 'Draft weekly briefing update' and t.client_id = c.id
  );
