# Northstar TypeScript Monorepo: Developer Onboarding

This guide takes you from a cloned Northstar repository to your first submitted change: updating the due-date display logic in `packages/domain` and adding a unit test.

## 1. Open the repository

From the cloned repository directory, work at the repository root:

```bash
cd <repository-directory>
```

Confirm that Node.js 22 and pnpm 10 are installed:

```bash
node --version
pnpm --version
```

The repository does not currently specify environment variables, port numbers, or branch-name conventions. Use the team’s existing conventions for those items when they are provided.

## 2. Install dependencies

Run the installation command from the repository root:

```bash
pnpm install --frozen-lockfile
```

This uses the committed lockfile without changing it. Do not update the lockfile unless you change dependencies.

## 3. Understand the repository layout

The main applications and packages are:

- `apps/web` — the React interface
- `apps/api` — the HTTP API
- `packages/domain` — business rules and domain logic
- `packages/ui` — shared UI components

Business rules belong in `packages/domain`. The web and API applications should consume those rules rather than reimplementing them.

## 4. Start the development environment

To start the web interface and API together, run:

```bash
pnpm dev
```

The repository does not currently document the ports used by these services. Use the URLs printed by the development command or the repository’s local documentation.

Stop the development process when it is no longer needed.

## 5. Create a working branch

Create a branch using the team’s approved branch-naming convention. That convention has not been provided, so do not assume a specific prefix or format.

Before editing, check the current state:

```bash
git status
```

Keep unrelated existing changes intact and avoid including them in your submission.

## 6. Make the first change

The task is to update the due-date display function in `packages/domain` so that an item due on the current date returns:

```text
due today
```

First, locate the existing function and its tests within `packages/domain`. Follow the package’s existing naming, date-handling, and test conventions.

Update the domain function so the current-date case is handled by the domain layer. Add a unit test covering an item whose due date is the current date and assert that the result is exactly `due today`.

Do not add a separate date decision in `apps/web` or `apps/api`. Those applications should continue using the domain behavior.

Keep the test deterministic by following the repository’s existing approach for controlling or supplying dates. Do not rely on an uncontrolled system date if the project already provides a date abstraction or test convention.

## 7. Run focused checks

From the repository root, run the tests for the domain package:

```bash
pnpm --filter <package-name> test
```

Replace `<package-name>` with the package name declared in `packages/domain/package.json`.

Then run the required repository-wide checks:

```bash
pnpm typecheck
pnpm format:check
```

If a check fails, fix the relevant issue and rerun the failed check.

## 8. Review the change

Inspect the diff and confirm that it contains only the intended domain change and unit test:

```bash
git diff
git status
```

Verify that:

- the current-date case returns `due today`;
- the new behavior is tested in `packages/domain`;
- no duplicate date logic was added to `apps/web` or `apps/api`;
- dependencies were not changed unnecessarily;
- the lockfile is unchanged unless dependencies changed.

## 9. Run the complete test suite

Before submitting the change, run all tests:

```bash
pnpm test
```

The final validation sequence should include:

```bash
pnpm --filter <package-name> test
pnpm typecheck
pnpm format:check
pnpm test
```

Resolve any failures before submission.

## 10. Submit the change

Review the final status:

```bash
git status
git diff
```

Commit the focused change using the team’s commit convention, push the branch according to the repository workflow, and open a review request.

In the submission description, briefly state that you:

- updated the domain due-date display for items due today;
- added the corresponding unit test;
- ran the target package tests, type checking, formatting verification, and the full test suite.