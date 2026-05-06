# Government Relations Intelligence Platform (MVP)

Initial implementation of the PRD-first build:
- Next.js App Router + TypeScript + Tailwind + shadcn/ui
- Supabase schema migrations (core + stakeholder + reports + AI output tables)
- Sidebar navigation and required route scaffold
- Working clients CRUD
- Working client watchlist CRUD
- Source item management (manual entry + detail pages)
- Intelligence feed with filtering and status updates
- Keyword matching from source text to client watchlists
- OpenAI source summarization and client relevance scoring
- AI output persistence in `ai_outputs`
- Basic dashboard metrics (active clients + open tasks + key monitoring counters)
- Basic tasks CRUD/status updates (to power dashboard open task counts)

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env.local
```

3. Fill in:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- Optional: `OPENAI_MODEL` (default is `gpt-5.2`)

4. Apply migration in Supabase SQL editor (or via Supabase CLI):
- `supabase/migrations/20260430103000_initial_schema.sql`

5. Optional demo/reviewer seed data:
- `supabase/seed.sql`

6. Run app:

```bash
npm run dev
```

Open `http://localhost:3000` and it will redirect to `/dashboard`.

## Notes

- AI analysis currently runs when creating a source item and when clicking "Re-run AI".
- Client matches are created/updated from keyword matching and AI relevance scoring.
- Database access currently runs server-side via Supabase service role key (not exposed client-side).

## Safe Demo / Reviewer Mode

The app keeps authentication required. Demo/reviewer mode is created by adding sample database rows and creating a normal Supabase Auth user for the reviewer. Do not commit passwords, service role keys, or private environment values.

### What The Demo Seed Creates

`supabase/seed.sql` creates repeatable sample data for:

- Clients: `Sysco Alberta`, `WestJet`, and `Ciena / Data Centres`
- Client watchlist terms for food logistics, aviation/tourism, and data centre infrastructure
- Source items
- Client matches with relevance scores, explanations, statuses, and recommended actions
- Government contacts and one general contact
- Stakeholder relationships
- Tasks
- Interactions
- Draft reports and report items

The seed script is idempotent and uses stable names/URLs/emails to avoid duplicating demo rows when run again.

### Run The Demo Seed

Run the schema migrations first. At minimum, apply:

```text
supabase/migrations/20260430103000_initial_schema.sql
```

For production/private review, also apply:

```text
supabase/migrations/20260430172000_lock_down_authenticated_rls.sql
```

Then run the seed SQL in the Supabase SQL Editor:

```text
supabase/seed.sql
```

You can also run it with the Supabase CLI if your local project is linked:

```bash
supabase db push
supabase db seed
```

### Create A Demo Reviewer User

Recommended demo email:

```text
demo.reviewer@example.com
```

Create it in Supabase:

1. Open the Supabase project.
2. Go to **Authentication → Users**.
3. Click **Add user**.
4. Use `demo.reviewer@example.com`.
5. Set a temporary password and require the reviewer to change it after first sign-in.
6. Confirm the user if your project requires email confirmation.

If the admin-only RLS migration has been applied and you want the reviewer to have full MVP access, copy the new Auth user UUID and run:

```sql
insert into public.app_admins (user_id, active)
values ('REPLACE_WITH_DEMO_REVIEWER_USER_UUID', true)
on conflict (user_id) do update set active = excluded.active;
```

The demo account can then sign in and access the core MVP pages:

- Dashboard
- Clients
- Intelligence
- Government contacts
- Tasks
- Reports

### Safety Notes

- Never expose `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, or private `.env.local` values to reviewers.
- Use a temporary demo password and rotate or delete the demo user after review.
- The demo seed uses placeholder emails under `example.com` and demo-only URLs under `demo.gov-rel-intel.local`.
