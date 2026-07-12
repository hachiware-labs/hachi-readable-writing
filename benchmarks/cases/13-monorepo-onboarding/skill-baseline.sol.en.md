# Northstar TypeScript Monorepo Onboarding

This guide takes you from a cloned Northstar repository to a submission-ready first change. It assumes the repository is already available locally. Environment variables, ports, and branch naming conventions are project-specific and are not covered here.

## 1. Prepare the toolchain

Northstar requires:

- Node.js 22
- pnpm 10

Confirm your active versions from the repository root:

```text
node --version
pnpm --version
```

If either version differs, switch versions using your usual toolchain manager before installing dependencies.

## 2. Install dependencies

Run the installation at the repository root:

```text
pnpm install --frozen-lockfile
```

The frozen lockfile option ensures that installation uses the dependency versions already recorded in the repository. Do not update the lockfile during this task because no dependency change is required.

## 3. Understand the repository structure

The main workspace areas are:

- `apps/web`: React interface
- `apps/api`: HTTP API
- `packages/domain`: business rules
- `packages/ui`: shared UI components

Business decisions belong in `packages/domain`. The web and API applications should consume those decisions instead of implementing their own versions.

You can start the web and API applications together with:

```text
pnpm dev
```

This guide does not specify environment variables or port numbers because they have not been provided. Consult the repository’s existing documentation or configuration if local startup requires them.

## 4. Make your first change

Your first task is to update the due-date display function in `packages/domain`. An item due on the current date must return:

```text
due today
```

Before editing, locate the existing function and its unit tests. Read the surrounding implementation to understand how it represents dates, determines the current date, and handles nearby cases such as overdue or future items.

Add the new rule to the existing domain function. Do not reproduce the date comparison in `apps/web` or `apps/api`; both applications should continue to rely on the result supplied by `packages/domain`.

Add a focused unit test alongside the existing tests. The test should establish a current date and confirm that an item with the same due date produces exactly `due today`. Follow the test suite’s existing approach to clocks, time zones, and date construction rather than introducing a new convention. Preserve the behavior of existing due-date cases.

## 5. Verify the change

First, run the tests for the affected package from the repository root:

```text
pnpm --filter <package-name> test
```

Replace `<package-name>` with the package name declared by `packages/domain`, not necessarily its directory name.

Then run repository-wide type checking and formatting verification:

```text
pnpm typecheck
pnpm format:check
```

Resolve any failures and rerun the affected command. Before submission, run the complete test suite:

```text
pnpm test
```

The change is ready when the domain package tests, full type checking, formatting verification, and complete test suite all pass.

## 6. Review and submit

Review the final diff before submitting. It should contain:

- the due-date behavior change in `packages/domain`;
- a unit test for an item due on the current date;
- no duplicate date decision in `apps/web` or `apps/api`;
- no unrelated edits; and
- no lockfile change, unless dependencies were deliberately changed.

Commit and submit the change using the team’s established branch, commit, and review workflow. Since branch naming conventions have not been provided, follow the repository documentation or ask your reviewer which convention to use. In the submission description, state what changed and confirm that the target package tests, type checking, formatting verification, and complete test suite passed.