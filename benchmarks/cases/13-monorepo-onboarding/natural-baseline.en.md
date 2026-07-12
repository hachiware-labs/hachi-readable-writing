# Northstar developer onboarding

This guide takes you from a cloned Northstar repository through submitting your first small change.

## 1. Check your tools

Northstar requires:

- Node.js 22
- pnpm 10

From the repository root, verify both versions:

```sh
node --version
pnpm --version
```

You should see `v22.x.x` and `10.x.x`. Use your team’s preferred version manager if either version is different.

## 2. Install dependencies

Install the workspace dependencies from the repository root:

```sh
pnpm install --frozen-lockfile
```

The frozen lockfile flag ensures your installation matches the committed dependency graph.

Do not update `pnpm-lock.yaml` unless your change intentionally adds, removes, or upgrades a dependency.

## 3. Know the workspace

The main areas of the monorepo are:

| Path | Responsibility |
|---|---|
| `apps/web` | React interface |
| `apps/api` | HTTP API |
| `packages/domain` | Shared business rules |
| `packages/ui` | Shared UI components |

Business decisions belong in `packages/domain`. Applications should consume those decisions rather than reimplementing them.

## 4. Start the development environment

From the repository root, run:

```sh
pnpm dev
```

This starts the web and API applications together.

Environment variables and port numbers are project-specific and are not documented here. If startup reports missing configuration, consult the repository’s local documentation or ask the team for the required values rather than guessing them.

## 5. Create your working branch

Use your team’s branch-naming convention. Because Northstar’s convention has not been specified, confirm it with the team before creating the branch.

A typical Git command is:

```sh
git switch -c <branch-name>
```

## 6. Make your first change

Your first task is to update the due-date display behavior in `packages/domain`:

> An item due on the current date must return `due today`.

Find the existing due-date display function and its tests:

```sh
rg "due date|dueDate|due today" packages/domain
```

Change the decision in `packages/domain` and add a unit test alongside the existing tests. Keep these points in mind:

- Return the exact text `due today` for a due date that falls on the current date.
- Preserve the existing behavior for past and future dates.
- Treat “current date” consistently with the function’s existing timezone and date-normalization rules.
- Make the test deterministic by fixing or injecting the current time using the project’s existing test conventions.
- Restore mocked time after the test so it cannot affect other tests.
- Do not duplicate the date comparison in `apps/web` or `apps/api`; both applications should rely on the domain result.

## 7. Verify the change

First, read the package name from the `name` field in:

```text
packages/domain/package.json
```

Then run that package’s tests from the repository root:

```sh
pnpm --filter <domain-package-name> test
```

Run repository-wide type checking and formatting verification:

```sh
pnpm typecheck
pnpm format:check
```

Finally, run the complete test suite:

```sh
pnpm test
```

All four checks must pass before submission.

## 8. Review and commit

Inspect the final change:

```sh
git status
git diff
```

Confirm that:

- The business-rule change is in `packages/domain`.
- A unit test covers an item due today.
- No equivalent date decision was added to `apps/web` or `apps/api`.
- Unrelated files were not changed.
- `pnpm-lock.yaml` is unchanged because this task does not require dependency changes.

Commit using the team’s commit-message convention:

```sh
git add packages/domain
git commit -m "<commit message>"
```

Push the branch and open a pull request using your team’s normal workflow. In the pull request, briefly describe the behavior change and report the checks you ran:

```text
- Target package tests
- Full type checking
- Formatting verification
- Complete test suite
```

Branch naming, remote naming, and pull-request tooling are intentionally left unspecified; follow the repository or team conventions for those steps.