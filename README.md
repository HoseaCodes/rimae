# Rimae

> *A rima is a narrow fissure carved by forces beneath the surface — a permanent record of what moved through. Rimae is that, for your project.*

Rimae (pronounced "RIM-ee") is an event ingestion and exploration dashboard built with Next.js and Supabase. It provides a polished interface for ingesting, searching, filtering, and visualizing event data, with saved views and AI-assisted ingestion.

The name comes from the plural of *rima* — Latin for a narrow fissure or groove. In astronomy, rimae are long linear features traced across planetary surfaces, permanent records of deep structural events. The name fits on three levels:

- **Structural origin** — Rimae are carved by forces operating beneath the surface. This system captures what's happening beneath a project: the decisions, reasoning, and events that shaped its current state.
- **Permanent record** — Once formed, a rima is a durable feature. It doesn't heal. That append-only nature is exactly the guarantee Rimae makes.
- **Running through maria** — Maria are the vast, undifferentiated plains of the Moon. Rimae cut through them as legible structure. This system does the same to the noise of a project's activity.

## Features
- Clean, responsive UI for event exploration and dashboards
- Event ingestion form with validation
- Saved views and export capabilities
- Supabase backend with migrations and sample seed data
- Playwright end-to-end test suite with visual snapshots

## Tech stack
- Frontend: Next.js (App Router), TypeScript, Tailwind CSS
- Backend: Supabase (Postgres + Auth + Functions)
- Testing: Playwright (E2E + visual snapshot tests)

## Quick start

### Prerequisites
- Node.js 18+ and npm/yarn/pnpm
- A Supabase project (optional for local development)

### Install

```bash
npm install
# or
pnpm install
```

### Run

```bash
npm run dev
# open http://localhost:3000
```

### Environment

Copy the example env file and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

### GitHub secrets

Repository secrets for CI workflows can be set with the GitHub CLI (`gh`):

```powershell
# Interactive (prompts for values)
pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\set-github-secrets.ps1

# Non-interactive (reads from environment)
$env:NEXT_PUBLIC_SUPABASE_URL = 'https://xyz.supabase.co'
$env:NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
$env:SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'
pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\set-github-secrets.ps1 -FromEnv
```

Ensure the authenticated `gh` account has permission to write Actions secrets.

## Database

SQL migrations live in `supabase/migrations/` and seed data in `supabase/seed/`. Run them via the Supabase CLI against your local or remote project.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Run the production build locally |
| `npm run test:e2e` | Run Playwright end-to-end tests |

## Project structure

```
app/          Next.js App Router pages and layouts
components/   UI components
lib/          Utilities, server actions, Supabase clients
supabase/     Migrations and Edge Functions
tests/        Playwright E2E tests and fixtures
```

Business logic and server actions live in `lib/actions/` to keep pages thin. UI primitives are in `components/ui/`.

## Testing

```bash
npm run test:e2e
```

Snapshots are stored under `tests/snapshots/`. Add your CI provider to run tests on pull requests automatically.

## Contributing

We welcome contributions. A good contribution flow:

1. Fork the repository and create a feature branch
2. Run tests and linters locally
3. Open a pull request with a concise description and screenshots when relevant

This project follows the [Contributor Covenant](https://www.contributor-covenant.org/) Code of Conduct.

## Roadmap

- User authentication and per-user saved views
- Improved AI-assisted ingestion and audit logging
- Dataset export and scheduled reports

## Security

Report vulnerabilities privately to the maintainers rather than opening a public issue.

## License

MIT. See [LICENSE](LICENSE) for details.
