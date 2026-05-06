-- Safe demo/reviewer seed data for the Government Relations Intelligence Platform.
-- This script is intentionally idempotent: run it more than once without creating duplicate demo rows.
-- It does not create Supabase Auth users and does not contain any secrets.

insert into public.clients (name, industry, description, primary_contact)
select *
from (
  values
    (
      'Sysco Alberta',
      'Food logistics / food service distribution',
      'Demo client focused on food security, institutional procurement, workforce, supply chain, and rural distribution policy.',
      'Government Relations Lead'
    ),
    (
      'WestJet',
      'Aviation / tourism / transportation',
      'Demo client focused on aviation competitiveness, Calgary hub growth, tourism, labour, and airport infrastructure policy.',
      'Public Affairs Director'
    ),
    (
      'Ciena / Data Centres',
      'Telecom / digital infrastructure / AI data centres',
      'Demo client focused on AI infrastructure, data centres, power availability, broadband, and digital economy policy.',
      'Policy & Regulatory Affairs'
    )
) as demo(name, industry, description, primary_contact)
where not exists (
  select 1 from public.clients existing where existing.name = demo.name
);

insert into public.client_watchlists (client_id, keyword, category, weight)
select c.id, w.keyword, w.category, w.weight
from public.clients c
join (
  values
    ('Sysco Alberta', 'food security', 'Policy', 9),
    ('Sysco Alberta', 'institutional procurement', 'Procurement', 8),
    ('Sysco Alberta', 'supply chain', 'Operations', 8),
    ('Sysco Alberta', 'temporary foreign workers', 'Labour', 7),
    ('Sysco Alberta', 'rural delivery', 'Logistics', 6),
    ('WestJet', 'aviation', 'Sector', 9),
    ('WestJet', 'YYC', 'Infrastructure', 8),
    ('WestJet', 'tourism', 'Economic development', 8),
    ('WestJet', 'airport fees', 'Competitiveness', 7),
    ('WestJet', 'pilot training', 'Labour', 6),
    ('Ciena / Data Centres', 'data centres', 'Infrastructure', 9),
    ('Ciena / Data Centres', 'artificial intelligence', 'Digital policy', 8),
    ('Ciena / Data Centres', 'power grid', 'Energy', 8),
    ('Ciena / Data Centres', 'broadband', 'Connectivity', 7),
    ('Ciena / Data Centres', 'water cooling', 'Infrastructure', 6)
) as w(client_name, keyword, category, weight)
  on w.client_name = c.name
where not exists (
  select 1
  from public.client_watchlists existing
  where existing.client_id = c.id
    and existing.keyword = w.keyword
);

insert into public.source_items (
  source_type,
  source_name,
  title,
  url,
  published_date,
  raw_text,
  clean_text,
  summary,
  topic_tags,
  ministry
)
select *
from (
  values
    (
      'Alberta News Release',
      'Government of Alberta',
      'Alberta launches food supply chain resilience consultations',
      'https://demo.gov-rel-intel.local/source/food-supply-chain-consultations',
      current_date - 7,
      'The Government of Alberta announced consultations on food supply chain resilience, institutional procurement, rural delivery, and emergency preparedness.',
      'Alberta announced consultations on food supply chain resilience, institutional procurement, rural delivery, and emergency preparedness.',
      'Consultation process may create opportunities for food logistics stakeholders to shape procurement and supply chain policy.',
      array['food security', 'procurement', 'supply chain'],
      'Agriculture and Irrigation'
    ),
    (
      'Alberta News Release',
      'Government of Alberta',
      'Tourism and aviation competitiveness review announced',
      'https://demo.gov-rel-intel.local/source/aviation-tourism-review',
      current_date - 5,
      'The province announced a review of tourism competitiveness, airport access, aviation training, and travel recovery priorities.',
      'The province announced a review of tourism competitiveness, airport access, aviation training, and travel recovery priorities.',
      'Review is relevant to aviation carriers with Alberta hub operations and tourism growth priorities.',
      array['aviation', 'tourism', 'labour'],
      'Tourism and Sport'
    ),
    (
      'Manual Entry',
      'Demo policy note',
      'AI data centre growth raises power and broadband policy questions',
      'https://demo.gov-rel-intel.local/source/ai-data-centres-power-broadband',
      current_date - 3,
      'A policy note summarized emerging issues around AI data centres, power grid capacity, water use, broadband backhaul, and municipal permitting.',
      'Emerging AI data centre growth is raising issues around power grid capacity, water use, broadband backhaul, and municipal permitting.',
      'Digital infrastructure proponents may need coordinated engagement with energy, technology, and municipal stakeholders.',
      array['data centres', 'artificial intelligence', 'power grid', 'broadband'],
      'Technology and Innovation'
    ),
    (
      'Committee Transcript',
      'Legislative Assembly of Alberta',
      'Committee discusses workforce pathways for transportation and logistics',
      'https://demo.gov-rel-intel.local/source/workforce-transport-logistics',
      current_date - 1,
      'Committee members discussed workforce pathways, temporary foreign workers, pilot training, commercial drivers, and logistics resiliency.',
      'Committee discussion covered workforce pathways, temporary foreign workers, pilot training, commercial drivers, and logistics resiliency.',
      'Workforce discussion cuts across food logistics and aviation files.',
      array['labour', 'transportation', 'logistics'],
      'Jobs, Economy and Trade'
    )
) as demo(
  source_type,
  source_name,
  title,
  url,
  published_date,
  raw_text,
  clean_text,
  summary,
  topic_tags,
  ministry
)
where not exists (
  select 1 from public.source_items existing where existing.url = demo.url
);

insert into public.client_matches (
  client_id,
  source_item_id,
  relevance_score,
  matched_keywords,
  matched_themes,
  relevance_explanation,
  risk_level,
  opportunity_level,
  recommended_action,
  should_include_in_client_report,
  status
)
select
  c.id,
  s.id,
  m.relevance_score,
  m.matched_keywords,
  m.matched_themes,
  m.relevance_explanation,
  m.risk_level,
  m.opportunity_level,
  m.recommended_action,
  m.should_include_in_client_report,
  m.status
from public.clients c
join public.source_items s on true
join (
  values
    (
      'Sysco Alberta',
      'https://demo.gov-rel-intel.local/source/food-supply-chain-consultations',
      92,
      array['food security', 'institutional procurement', 'supply chain'],
      array['Procurement policy', 'Supply chain resilience'],
      'Directly relevant to Sysco Alberta because the consultation includes institutional procurement and logistics resilience.',
      'Medium',
      'High',
      'Prepare consultation submission themes and identify officials leading the process.',
      true,
      'Action required'
    ),
    (
      'Sysco Alberta',
      'https://demo.gov-rel-intel.local/source/workforce-transport-logistics',
      78,
      array['temporary foreign workers', 'logistics'],
      array['Workforce', 'Transportation'],
      'Workforce pathways discussion may affect logistics staffing and delivery reliability.',
      'Medium',
      'Medium',
      'Monitor committee follow-up and brief client on labour pathway implications.',
      true,
      'Relevant'
    ),
    (
      'WestJet',
      'https://demo.gov-rel-intel.local/source/aviation-tourism-review',
      95,
      array['aviation', 'tourism', 'YYC'],
      array['Aviation competitiveness', 'Tourism growth'],
      'Highly relevant to WestJet because the review touches aviation, airport access, and tourism competitiveness.',
      'Low',
      'High',
      'Request meeting with tourism and transportation officials before consultation timelines close.',
      true,
      'Action required'
    ),
    (
      'WestJet',
      'https://demo.gov-rel-intel.local/source/workforce-transport-logistics',
      71,
      array['pilot training', 'transportation'],
      array['Workforce', 'Aviation training'],
      'Relevant to pilot training and transportation workforce policy.',
      'Low',
      'Medium',
      'Track whether pilot training is included in workforce recommendations.',
      false,
      'Reviewed'
    ),
    (
      'Ciena / Data Centres',
      'https://demo.gov-rel-intel.local/source/ai-data-centres-power-broadband',
      96,
      array['data centres', 'artificial intelligence', 'power grid', 'broadband'],
      array['AI infrastructure', 'Power availability', 'Connectivity'],
      'Directly relevant to Ciena / Data Centres due to AI infrastructure, power, and broadband policy implications.',
      'High',
      'High',
      'Develop cross-ministry engagement plan covering technology, energy, and municipal permitting.',
      true,
      'Action required'
    )
) as m(
  client_name,
  source_url,
  relevance_score,
  matched_keywords,
  matched_themes,
  relevance_explanation,
  risk_level,
  opportunity_level,
  recommended_action,
  should_include_in_client_report,
  status
)
  on m.client_name = c.name
 and m.source_url = s.url
where not exists (
  select 1
  from public.client_matches existing
  where existing.client_id = c.id
    and existing.source_item_id = s.id
);

insert into public.stakeholders (
  first_name,
  last_name,
  full_name,
  title,
  organization,
  ministry,
  riding,
  stakeholder_type,
  email,
  phone,
  bio,
  notes
)
select *
from (
  values
    (
      'Alex',
      'Mercer',
      'Alex Mercer',
      'Assistant Deputy Minister, Food Systems',
      'Government of Alberta',
      'Agriculture and Irrigation',
      null,
      'Assistant Deputy Minister',
      'alex.mercer.demo@example.com',
      '780-555-0101',
      'Demo stakeholder for food logistics and procurement policy.',
      'Demo record: useful contact for food security, procurement, and rural delivery files.'
    ),
    (
      'Jordan',
      'Reid',
      'Jordan Reid',
      'Senior Policy Advisor',
      'Minister of Tourism and Sport Office',
      'Tourism and Sport',
      null,
      'Political Staff',
      'jordan.reid.demo@example.com',
      '780-555-0102',
      'Demo stakeholder for tourism and aviation competitiveness.',
      'Demo record: useful contact for tourism, aviation, and Calgary hub files.'
    ),
    (
      'Priya',
      'Nandakumar',
      'Priya Nandakumar',
      'Director, Digital Infrastructure',
      'Government of Alberta',
      'Technology and Innovation',
      null,
      'Department Official',
      'priya.nandakumar.demo@example.com',
      '780-555-0103',
      'Demo stakeholder for AI infrastructure, broadband, and data centre files.',
      'Demo record: useful contact for digital infrastructure policy.'
    ),
    (
      'Morgan',
      'Sato',
      'Morgan Sato',
      'Energy Systems Policy Lead',
      'Government of Alberta',
      'Affordability and Utilities',
      null,
      'Department Official',
      'morgan.sato.demo@example.com',
      '780-555-0104',
      'Demo stakeholder for power grid and utility policy.',
      'Demo record: useful contact for power availability and grid planning files.'
    ),
    (
      'Taylor',
      'Bennett',
      'Taylor Bennett',
      'Chief of Staff',
      'Minister of Jobs, Economy and Trade Office',
      'Jobs, Economy and Trade',
      null,
      'Chief of Staff',
      'taylor.bennett.demo@example.com',
      '780-555-0105',
      'Demo stakeholder for workforce and economic development files.',
      'Demo record: useful contact for workforce pathways and labour policy.'
    ),
    (
      'Casey',
      'Liu',
      'Casey Liu',
      'Executive Director',
      'Alberta Logistics Association',
      null,
      null,
      'Industry Association',
      'casey.liu.demo@example.com',
      '403-555-0106',
      'Demo general contact for logistics sector perspectives.',
      'Demo record: appears in Contacts, not Government contacts.'
    )
) as demo(
  first_name,
  last_name,
  full_name,
  title,
  organization,
  ministry,
  riding,
  stakeholder_type,
  email,
  phone,
  bio,
  notes
)
where not exists (
  select 1
  from public.stakeholders existing
  where existing.email = demo.email
);

insert into public.stakeholder_relationships (
  stakeholder_id,
  client_id,
  relationship_strength,
  strategic_value,
  position_on_issue,
  relationship_owner,
  last_contact_date,
  next_follow_up_date,
  known_interests,
  known_sensitivities,
  engagement_angle,
  notes
)
select
  st.id,
  c.id,
  r.relationship_strength,
  r.strategic_value,
  r.position_on_issue,
  r.relationship_owner,
  current_date - r.last_contact_days_ago,
  current_date + r.next_follow_up_days,
  r.known_interests,
  r.known_sensitivities,
  r.engagement_angle,
  r.notes
from public.stakeholders st
join public.clients c on true
join (
  values
    (
      'alex.mercer.demo@example.com',
      'Sysco Alberta',
      'Warm relationship',
      'Critical',
      'Supportive',
      'Ethan',
      18,
      10,
      'Institutional procurement, resilient food supply chains, rural delivery.',
      'Needs practical examples and cost implications.',
      'Position Sysco as a practical implementation partner for procurement resilience.',
      'Demo relationship for food logistics engagement.'
    ),
    (
      'jordan.reid.demo@example.com',
      'WestJet',
      'Introductory contact',
      'High',
      'Supportive',
      'Ethan',
      22,
      7,
      'Tourism recovery, Calgary hub growth, aviation competitiveness.',
      'Avoid framing solely around airline costs; connect to visitor economy.',
      'Link hub competitiveness to tourism jobs and regional access.',
      'Demo relationship for aviation/tourism engagement.'
    ),
    (
      'priya.nandakumar.demo@example.com',
      'Ciena / Data Centres',
      'Warm relationship',
      'Critical',
      'Neutral',
      'Ethan',
      9,
      5,
      'AI infrastructure, broadband backhaul, technology investment.',
      'Will ask about power and local permitting constraints.',
      'Frame Ciena as enabling reliable digital infrastructure.',
      'Demo relationship for AI infrastructure engagement.'
    ),
    (
      'morgan.sato.demo@example.com',
      'Ciena / Data Centres',
      'No relationship',
      'High',
      'Unknown',
      'Ethan',
      45,
      14,
      'Grid planning, power availability, utility coordination.',
      'Sensitive to load-growth narratives without reliability context.',
      'Open a technical briefing on data centre load forecasting and grid planning.',
      'Demo relationship for power policy engagement.'
    ),
    (
      'taylor.bennett.demo@example.com',
      'WestJet',
      'Introductory contact',
      'Medium',
      'Mixed',
      'Ethan',
      30,
      21,
      'Workforce pathways and training seats.',
      'Competing requests across sectors.',
      'Connect pilot training to broader workforce strategy.',
      'Demo relationship for workforce engagement.'
    )
) as r(
  stakeholder_email,
  client_name,
  relationship_strength,
  strategic_value,
  position_on_issue,
  relationship_owner,
  last_contact_days_ago,
  next_follow_up_days,
  known_interests,
  known_sensitivities,
  engagement_angle,
  notes
)
  on r.stakeholder_email = st.email
 and r.client_name = c.name
where not exists (
  select 1
  from public.stakeholder_relationships existing
  where existing.stakeholder_id = st.id
    and existing.client_id = c.id
);

insert into public.tasks (
  title,
  description,
  client_id,
  stakeholder_id,
  source_item_id,
  owner,
  due_date,
  priority,
  status
)
select
  t.title,
  t.description,
  c.id,
  st.id,
  s.id,
  t.owner,
  current_date + t.due_in_days,
  t.priority,
  t.status
from (
  values
    (
      'Draft Sysco food supply chain consultation themes',
      'Prepare practical points on institutional procurement, resilient logistics, and rural delivery.',
      'Sysco Alberta',
      'alex.mercer.demo@example.com',
      'https://demo.gov-rel-intel.local/source/food-supply-chain-consultations',
      'Ethan',
      3,
      'High',
      'In progress'
    ),
    (
      'Request WestJet meeting on aviation competitiveness review',
      'Send meeting request to discuss aviation, tourism recovery, and YYC hub priorities.',
      'WestJet',
      'jordan.reid.demo@example.com',
      'https://demo.gov-rel-intel.local/source/aviation-tourism-review',
      'Ethan',
      2,
      'Urgent',
      'Not started'
    ),
    (
      'Prepare Ciena data centre policy briefing',
      'Summarize AI data centre power, broadband, and permitting issues for stakeholder outreach.',
      'Ciena / Data Centres',
      'priya.nandakumar.demo@example.com',
      'https://demo.gov-rel-intel.local/source/ai-data-centres-power-broadband',
      'Ethan',
      5,
      'High',
      'In progress'
    ),
    (
      'Clean up demo reviewer notes',
      'Review demo records after a reviewer walkthrough and archive anything no longer needed.',
      null,
      null,
      null,
      'Ethan',
      14,
      'Low',
      'Waiting'
    )
) as t(
  title,
  description,
  client_name,
  stakeholder_email,
  source_url,
  owner,
  due_in_days,
  priority,
  status
)
left join public.clients c on c.name = t.client_name
left join public.stakeholders st on st.email = t.stakeholder_email
left join public.source_items s on s.url = t.source_url
where not exists (
  select 1
  from public.tasks existing
  where existing.title = t.title
    and (
      (existing.client_id is not distinct from c.id)
      or t.client_name is null
    )
);

insert into public.interactions (
  stakeholder_id,
  client_id,
  source_item_id,
  interaction_type,
  interaction_date,
  summary,
  attendees,
  outcome,
  follow_up_required,
  follow_up_deadline,
  notes
)
select
  st.id,
  c.id,
  s.id,
  i.interaction_type,
  current_date - i.days_ago,
  i.summary,
  i.attendees,
  i.outcome,
  i.follow_up_required,
  current_date + i.follow_up_days,
  i.notes
from (
  values
    (
      'alex.mercer.demo@example.com',
      'Sysco Alberta',
      'https://demo.gov-rel-intel.local/source/food-supply-chain-consultations',
      'Introductory outreach',
      12,
      'Shared Sysco interest in practical food supply chain resilience ideas.',
      'Ethan; Alex Mercer',
      'Official invited written themes before consultation deadline.',
      true,
      10,
      'Demo interaction for reviewer walkthrough.'
    ),
    (
      'jordan.reid.demo@example.com',
      'WestJet',
      'https://demo.gov-rel-intel.local/source/aviation-tourism-review',
      'Email',
      4,
      'Asked whether industry roundtables will be scheduled for aviation competitiveness review.',
      'Ethan; Jordan Reid',
      'Awaiting confirmation of roundtable dates.',
      true,
      6,
      'Demo interaction for reviewer walkthrough.'
    ),
    (
      'priya.nandakumar.demo@example.com',
      'Ciena / Data Centres',
      'https://demo.gov-rel-intel.local/source/ai-data-centres-power-broadband',
      'Meeting',
      2,
      'Discussed data centre infrastructure constraints and need for cross-ministry coordination.',
      'Ethan; Priya Nandakumar',
      'Prepare short technical briefing for follow-up.',
      true,
      5,
      'Demo interaction for reviewer walkthrough.'
    )
) as i(
  stakeholder_email,
  client_name,
  source_url,
  interaction_type,
  days_ago,
  summary,
  attendees,
  outcome,
  follow_up_required,
  follow_up_days,
  notes
)
join public.stakeholders st on st.email = i.stakeholder_email
join public.clients c on c.name = i.client_name
join public.source_items s on s.url = i.source_url
where not exists (
  select 1
  from public.interactions existing
  where existing.stakeholder_id = st.id
    and existing.client_id = c.id
    and existing.source_item_id = s.id
    and existing.interaction_type = i.interaction_type
    and existing.summary = i.summary
);

insert into public.reports (
  client_id,
  title,
  report_type,
  start_date,
  end_date,
  body,
  status
)
select
  c.id,
  r.title,
  r.report_type,
  current_date - 14,
  current_date,
  r.body,
  r.status
from public.clients c
join (
  values
    (
      'Sysco Alberta',
      'Demo weekly client update - Sysco Alberta',
      'Weekly update',
      'Draft demo report covering food supply chain consultation, workforce discussion, and recommended stakeholder follow-up.',
      'Draft'
    ),
    (
      'WestJet',
      'Demo weekly client update - WestJet',
      'Weekly update',
      'Draft demo report covering aviation competitiveness review, workforce pathways, and recommended engagement.',
      'Draft'
    ),
    (
      'Ciena / Data Centres',
      'Demo weekly client update - Ciena / Data Centres',
      'Weekly update',
      'Draft demo report covering AI data centre infrastructure, power grid issues, broadband, and engagement planning.',
      'Draft'
    )
) as r(client_name, title, report_type, body, status)
  on r.client_name = c.name
where not exists (
  select 1
  from public.reports existing
  where existing.client_id = c.id
    and existing.title = r.title
);

insert into public.report_items (
  report_id,
  source_item_id,
  client_match_id,
  sort_order,
  custom_summary
)
select
  r.id,
  s.id,
  cm.id,
  (row_number() over (partition by r.id order by cm.relevance_score desc))::integer,
  cm.relevance_explanation
from public.reports r
join public.clients c on c.id = r.client_id
join public.client_matches cm on cm.client_id = c.id
join public.source_items s on s.id = cm.source_item_id
where r.title like 'Demo weekly client update - %'
  and cm.should_include_in_client_report = true
  and not exists (
    select 1
    from public.report_items existing
    where existing.report_id = r.id
      and existing.client_match_id = cm.id
  );
