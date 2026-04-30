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

5. Optional seed data:
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
