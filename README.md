# Vctrl

Vctrl is a modern event ingestion and exploration dashboard built with Next.js and Supabase. It provides a polished interface for ingesting, searching, filtering, and visualizing event data, plus saved views and integrations for AI-assisted ingestion.

Key features
- Clean, responsive UI for event exploration and dashboards
- Event ingestion form with validation
- Saved views and export capabilities
- Supabase backend with migrations and sample seed data
- Playwright end-to-end test suite with visual snapshots

Tech stack
- Frontend: Next.js (App Router), TypeScript, Tailwind CSS
- Backend: Supabase (Postgres + Auth + Functions)
- Testing: Playwright (E2E + visual snapshot tests)

Quick start

Prerequisites
- Node.js 18+ and npm/yarn/pnpm
- A Supabase project (optional for local development)

Install

```bash
# install dependencies
npm install
# or
pnpm install
```

Run (development)

```bash
# start Next.js dev server
npm run dev

# open http://localhost:3000
```

Environment
- Copy the example env file and set your Supabase credentials:

```bash
cp .env.example .env.local
# then update .env.local with SUPABASE_URL and SUPABASE_ANON_KEY (and any other secrets)
```

Setting GitHub secrets

You can set the repository secrets used by the workflows interactively with the GitHub CLI (`gh`).

- Using the GitHub CLI (interactive or from environment)

	1. Install and authenticate `gh` (see platform-specific install instructions):

	```powershell
	gh auth login --web
	gh --version
	```

	2. Run the PowerShell helper (prompts for values):

	```powershell
	pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\set-github-secrets.ps1
	```

	3. Or set from environment variables (non-interactive):

	```powershell
	$env:NEXT_PUBLIC_SUPABASE_URL = 'https://xyz.supabase.co'
	$env:NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
	$env:SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'
	pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\set-github-secrets.ps1 -FromEnv
	```

Files
- `scripts/set-github-secrets.ps1` — PowerShell helper that uses `gh secret set`

Notes
- The `gh` flow is great for interactive local use. Ensure the authenticated account has appropriate repository permissions to write Actions secrets.

Database & seed data
- The repository contains SQL migrations in `supabase/migrations/` and seed data in `seed/`.
- To initialize your Supabase local or remote database, run the migration and seed scripts provided by your Supabase setup.

Available scripts
- `npm run dev` — start development server
- `npm run build` — build for production
- `npm run start` — run the production build locally
- `npm run test:e2e` — run Playwright end-to-end tests

Project structure (high level)
- `app/` — Next.js App Router pages and layouts
- `components/` — UI components and reusable pieces
- `lib/` — utilities, API actions, Supabase clients
- `supabase/` — database migrations and functions
- `tests/` — Playwright E2E tests and fixtures

Development notes
- UI primitives live under `components/ui/` and are designed to be composable.
- Business logic and server actions live in `lib/actions/` to keep pages thin.
- The project includes a users/events schema in `supabase/migrations` — update migrations when changing DB shape.

Testing

Run Playwright E2E with:

```bash
npm run test:e2e
```

CI and badges
- The repository includes a Playwright configuration and example test snapshots under `results/` and `report/`.
- Add your CI provider (GitHub Actions, GitLab CI, etc.) to run linting, builds, and Playwright tests on pull requests.

Contributing

We welcome contributions. A good contribution flow:
1. Fork the repository and create a feature branch
2. Run tests and linters locally
3. Open a pull request with a concise description and screenshots when relevant

Please follow the code style used in the repository and keep changes focused.

Code of Conduct

This project follows a Contributor Covenant Code of Conduct. By participating, you agree to abide by its terms.

License

This project is open source under the MIT License. See the LICENSE file for details.

Contact & Acknowledgements
- Project maintainer: (add contact or GitHub handle)
- Built with Next.js and Supabase. Thanks to the open-source community for the libraries used here.

Roadmap & Ideas
- Add user authentication and per-user saved views
- Improve AI-assisted ingestion workflows and logging
- Add dataset export and scheduled reports

Security

If you discover a security vulnerability, please report it privately to the maintainers (provide contact in the project settings) instead of opening a public issue.

More
- For detailed developer notes, explore the `lib/` and `supabase/` folders.
- The Playwright tests in `tests/e2e/` show typical user flows to help guide development and QA.

--
If you'd like, I can also add badge images (CI, license, coverage), a `CONTRIBUTING.md`, or a `LICENSE` file. What would you like next?
