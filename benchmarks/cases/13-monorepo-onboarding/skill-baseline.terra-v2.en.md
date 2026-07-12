# Northstar Monorepo: First Change Guide

This guide takes you from a cloned repository to submitting a small, tested change.

## Set up the repository

Use Node.js 22 and pnpm 10. From the repository root, install the locked dependency set:

```sh
pnpm install --frozen-lockfile
```

Do not update the lockfile unless your change adds, removes, or changes dependencies.

The monorepo is organized around clear boundaries:

- `apps/web` contains the React interface.
- `apps/api` contains the HTTP API.
- `packages/domain` contains business rules.
- `packages/ui` contains shared UI components.

Start the web and API applications together with:

```sh
pnpm dev
```

Any required environment variables or port assignments are not specified here; check the repository’s existing documentation and configuration before starting the services.

## Make your first change

Your first task is in `packages/domain`: update the due-date display function so an item due on the current date returns:

```text
due today
```

Add a unit test covering that case.

Keep the date decision in `packages/domain`. Neither `apps/web` nor `apps/api` should reimplement the “due today” rule; they should use the domain behavior instead.

## Verify the change

First, run the domain package’s tests from the repository root. Replace `<package-name>` with the workspace package name for `packages/domain`:

```sh
pnpm --filter <package-name> test
```

Then run the required repository-wide checks:

```sh
pnpm typecheck
pnpm format:check
```

Before submitting, run the complete test suite:

```sh
pnpm test
```

Submit the change only after the targeted test, type checking, formatting verification, and full test suite pass.