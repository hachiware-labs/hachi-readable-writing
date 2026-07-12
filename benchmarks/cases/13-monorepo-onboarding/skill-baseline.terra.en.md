# Northstar Monorepo Onboarding

This guide takes you from a fresh clone to submitting a small, tested change. You will work on a due-date display rule in the domain package, where shared business behavior belongs.

## Set up the repository

Install Node.js 22 and pnpm 10, then from the repository root install the exact locked dependency set:

```sh
pnpm install --frozen-lockfile
```

Do not update the lockfile unless your change adds, removes, or changes dependencies.

The repository is organized around clear boundaries:

- `apps/web` contains the React interface.
- `apps/api` contains the HTTP API.
- `packages/domain` contains business rules.
- `packages/ui` contains shared UI components.

Keep business decisions, such as how a due date is described, in `packages/domain`. The web and API applications should use that shared behavior rather than reimplementing the same date logic.

## Run the application and checks

To start the web and API applications together, run:

```sh
pnpm dev
```

Environment variables and port numbers are repository-specific and have not been provided here. Check the repository’s existing documentation or configuration if the applications require additional setup.

From the repository root, use these commands to validate the codebase:

```sh
pnpm test
pnpm typecheck
pnpm format:check
```

To run tests for one package without leaving the root directory:

```sh
pnpm --filter <package-name> test
```

Replace `<package-name>` with the package name declared by the target package.

## Make your first change

Your first task is to update the due-date display function in `packages/domain`.

Find the function that converts an item’s due date into its display text, along with its existing unit tests. Add the rule that an item due on the current date returns:

```text
due today
```

Add a unit test that fixes this behavior in place. The test should exercise the function through its public behavior and make the current-date condition unambiguous.

Do not add matching date-decision code to `apps/web` or `apps/api`. Those applications should continue to rely on the domain package for the result.

## Verify and submit

After making the change, run the target package’s tests first:

```sh
pnpm --filter <package-name> test
```

Then run the required repository-wide checks:

```sh
pnpm typecheck
pnpm format:check
pnpm test
```

Review the change before submitting it. A complete first contribution includes the updated domain behavior, its unit test, no duplicated date logic in either application, and a lockfile unchanged unless dependencies changed.