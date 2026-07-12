I couldn’t write `ONBOARDING.md` because this workspace is read-only. Here is the complete guide content:

# Northstar developer onboarding

This guide takes you from a fresh clone to submitting your first small change.

## Prerequisites

Install:

- Node.js 22
- pnpm 10
- Git

Verify versions:

```bash
node --version
pnpm --version
```

## Clone and install

```bash
git clone <repository-url>
cd <repository-directory>
git switch -c <your-branch-name>
pnpm install --frozen-lockfile
```

Use the team’s documented repository URL, branch naming convention, environment variables, and port configuration. These values are not specified here.

Do not update the lockfile unless dependencies change intentionally.

## Repository structure

- `apps/web` — React interface
- `apps/api` — HTTP API
- `packages/domain` — business rules
- `packages/ui` — shared UI components

Start the web and API together from the repository root:

```bash
pnpm dev
```

## First task

Update the due-date display function in `packages/domain` so an item due on the current date returns exactly:

```text
due today
```

Add a unit test for this behavior.

Locate the implementation and tests:

```bash
rg -n "due|Due|date|Date" packages/domain
```

Use the existing date/time abstraction or test seam so the test is deterministic. Follow the repository’s established date and timezone semantics.

Keep this decision in `packages/domain`. Do not duplicate equivalent date logic in `apps/web` or `apps/api`.

## Verification

Find the package name in `packages/domain/package.json`, then run its tests from the repository root:

```bash
pnpm --filter <package-name> test
```

Run type checking and formatting verification:

```bash
pnpm typecheck
pnpm format:check
```

Before submitting, run the complete test suite:

```bash
pnpm test
```

Review the final changes:

```bash
git status --short
git diff -- packages/domain
```

Ensure the lockfile is unchanged unless dependencies were modified.

## Submit

Commit and submit the branch using the team’s normal review process. In the submission description, mention that:

- the domain function returns `due today` for the current date;
- a unit test covers the behavior; and
- the target tests, type checking, formatting verification, and full test suite passed.