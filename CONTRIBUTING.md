# Contributing to Rimae

Thank you for your interest in contributing to Rimae! We welcome bug reports, feature requests, documentation improvements, and code contributions.

Getting started

- Fork the repository and create a branch named `feature/<short-description>` or `fix/<short-description>`.
- Install dependencies:

```bash
npm install
```
- Copy example env file and update as needed:

```bash
cp .env.example .env.local
```

Development workflow

1. Keep changes focused and limited to a single concern.
2. Write or update tests where appropriate. The project uses Playwright for E2E tests.
3. Run the dev server and tests locally before opening a PR:

```bash
npm run dev
npm run test:e2e
```

Code style

- Follow the existing TypeScript/React style in the repository.
- Run linters and formatters before committing if configured (ESLint/Prettier).

Pull request checklist

- [ ] Branch is up-to-date with `main` (or `master`) and rebased if necessary
- [ ] New functionality includes tests or has an associated test plan
- [ ] Documentation updated where applicable (README, comments)
- [ ] Ensure no sensitive information in commits or PR description

Reporting issues

- Use the issue tracker to report bugs or request features. Include steps to reproduce, expected vs actual behavior, and relevant screenshots or logs.

Communication & code review

- Be responsive to review feedback and keep PR descriptions clear and focused.
- Maintain a respectful, constructive tone in comments and discussions.

Code of Conduct

By participating you agree to follow the project's Code of Conduct. Please be kind and respectful when interacting with maintainers and other contributors.

Thanks for helping improve Rimae — your contributions make the project better for everyone.
