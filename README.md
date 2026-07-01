# Unwritten Data

**AI-powered data analysis consultancy** — upload a dataset, describe your brief, and receive a structured analysis with key signals, quality flags, statistics, and recommended next steps, ready for a client report.

Built as a full-stack demo for a Full Stack Developer role.

---

## Features

- **Progressive intake wizard** — 3-step flow: brief → data upload → review & run
- **Pipeline analysis engine** — CSV parsing, dtype inference, null analysis, correlation computation, distribution binning, IQR outlier detection, task generation, KPI suggestion
- **Dashboard** — summary stats, recent sessions list with confidence indicators
- **Results page** — confidence gauge, data profile charts, statistics (correlations, distributions, top values, outliers), recommended analyses, KPIs
- **Task board** — AI-generated action items split into client-facing and internal tasks, with toggle/delete/regenerate/save
- **Session history** — filterable by status, grouped by date
- **Sample data** — pre-loaded 152-row retail e-commerce dataset to demo the full flow
- **Export** — plain-text report download
- **Consultant notes** — per-session notes saved to Supabase

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.9 (Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| UI Icons | Lucide React |
| Charts | Recharts |
| CSV Parsing | PapaParse |
| Database | Supabase (PostgreSQL) |
| Storage | Supabase Storage (private bucket) |
| AI / LLM | Gemini 2.0 Flash (via `@ai-sdk/google`) |
| Fonts | Figtree (sans), Lora (serif), JetBrains Mono (mono) |
| Deployment | Vercel |

## Getting Started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- (Optional) A [Gemini API key](https://aistudio.google.com/apikey) for LLM-powered task generation and KPI suggestions

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-gemini-api-key
```

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are required.
- `GEMINI_API_KEY` is optional — without it, task generation falls back to a rule-based algorithm.

### Database Setup

Run the migration files in `supabase/migrations/` against your Supabase project:

1. `00001_schema.sql` — creates tables: `clients`, `sessions`, `session_inputs`, `session_outputs`, `consultant_notes`
2. `00002_rls_policies.sql` — row-level security policies
3. `00003_storage_policies.sql` — storage bucket policies for `client-uploads`

Then run the stat-summary migration:

```
supabase/migration-add-stat-summary.sql
```

This adds the `stat_summary`, `tasks`, and `suggested_kpis` JSONB columns to `session_outputs`.

### Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Commands

| Command | Description |
|---|---|
| `npm run dev` | Start development server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Project Structure

```
app/
  (dashboard)/          # Dashboard layout + pages
    page.tsx            # Dashboard (hero, stats, recent sessions)
    layout.tsx          # Sidebar layout wrapper
    new-session/        # New session creation (sample or fresh)
    intake/             # 3-step intake wizard
    analysis-running/   # 3-phase analysis animation
    results/            # Results page with charts
    next-steps/         # Task board
    session-detail/     # Session detail view
    history/            # Session history with filters
    finalize/           # Final step after analysis
  api/
    pipeline/run/       # Analysis pipeline endpoint
    pipeline/regenerate-tasks/  # LLM task regeneration
    session/sample/     # Sample data creation
  globals.css           # Tailwind v4 theme + shadow utilities
  layout.tsx            # Root layout (fonts, metadata)

components/
  charts/               # Recharts wrappers (null bar, column type, severity, correlation, distribution, top values)
  collapsible-section.tsx
  logo.tsx
  sidebar.tsx

lib/
  supabase/             # Client, hooks, queries
  pipeline/             # Stats computation, LLM task generation, KPI suggestion

types/
  index.ts              # Shared TypeScript types

supabase/
  migrations/           # SQL schema + RLS policies
  migration-add-stat-summary.sql

public/
  sample-data.csv       # 152-row retail e-commerce dataset
```

## How It Works

1. **New Session** — choose sample data or start fresh (select client, analysis type)
2. **Intake** — describe your brief (preset or custom), upload a CSV, review inputs, choose business objective (diagnostic / descriptive / predictive / prescriptive)
3. **Pipeline** — runs on the server:
   - Parses CSV, infers column dtypes, computes null percentages
   - Generates executive summary, key signals, quality flags, recommended analyses
   - Computes statistics: pairwise correlations, distribution bins, top values, IQR outliers
   - (Optional) Generates tasks and KPI suggestions via Gemini 2.0 Flash
   - Saves results to `session_outputs`
4. **Results** — visual confidence gauge, stat cards, data profile charts, correlations, outliers, recommendations, KPIs
5. **Next Steps** — review and manage AI-generated tasks, save to client history
6. **History** — browse past sessions, view details, revisit results

## Data Model

### Tables

- **clients** — `id`, `name`, `sector`, `sessions`, `lastActive`, `createdAt`
- **sessions** — `id`, `clientId`, `title`, `status` (draft/complete), `analysisType[]`, `consultant`, `confidence`, `date`, `goal`, `summary`, `createdAt`
- **session_inputs** — `id`, `sessionId`, `briefText`, `businessGoal`, `constraints`, `dataFiles` (JSONB), `createdAt`
- **session_outputs** — `id`, `sessionId`, `execSummary`, `keySignals[]`, `dataQualityFlags[]`, `recommendedAnalyses[]`, `followUpQuestions[]`, `assumptions[]`, `confidenceScore`, `dataCompleteness`, `statSummary` (JSONB), `tasks` (JSONB), `suggestedKpis` (JSONB), `createdAt`
- **consultant_notes** — `id`, `sessionId`, `noteText`, `createdAt`

### Storage

- Bucket: `client-uploads` (private, RLS-protected)

## Deployment

This project is deployed on Vercel. The Vercel project must have the environment variables above configured.

The sample data file (`public/sample-data.csv`) is bundled with the build. The `POST /api/session/sample` endpoint creates a demo client and session, uploads the CSV to Supabase Storage, and returns the session ID.

---

Built with Next.js 16, Supabase, and Tailwind CSS v4.
