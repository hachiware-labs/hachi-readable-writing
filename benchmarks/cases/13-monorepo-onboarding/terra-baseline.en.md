# Northstar Developer Onboarding

This guide takes you from a fresh clone to submitting a small, tested change.

## Set up the repository

Use Node.js 22 and pnpm 10. From the repository root, install the locked dependency set:

```sh
pnpm install --frozen-lockfile
```

Do not update the lockfile unless your change adds, removes, or changes dependencies.

## Learn the monorepo layout

The repository separates responsibilities so that business behavior has one source of truth:

- `apps/web` — React interface
- `apps/api` — HTTP API
- `packages/domain` — business rules
- `packages/ui` — shared UI components

Keep date decisions in `packages/domain`. The web app and API should consume that domain behavior rather than reimplementing it.

## Run the application and checks

Start the web and API applications together:

```sh
pnpm dev
```

Run repository-wide checks from the root:

```sh
pnpm test
pnpm typecheck
pnpm format:check
```

To run tests for one package without changing directories:

```sh
pnpm --filter <package-name> test
```

## Make your first change

Update the due-date display function in `packages/domain` so an item due on the current date returns:

```text
due today
```

Add a unit test alongside the domain tests that covers this current-date case. Keep the test focused on the domain function’s observable output.

Before broad validation, run that package’s tests from the repository root:

```sh
pnpm --filter <package-name> test
```

Replace `<package-name>` with the package name configured for `packages/domain`.

## Validate and submit

After the target test passes, run:

```sh
pnpm typecheck
pnpm format:check
pnpm test
```

The complete test suite is required before submission. Review your diff to confirm the change is limited to the domain behavior and its test, and verify that no lockfile changes were included unless dependencies changed.

Environment variables, local ports, and branch naming conventions are not specified here; check the repository documentation or ask the team before relying on any particular values.