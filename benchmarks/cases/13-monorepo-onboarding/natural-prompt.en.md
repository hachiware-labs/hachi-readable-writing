Create an onboarding guide for developers joining the Northstar TypeScript monorepo.
It should get them from a cloned repository through submitting their first small change.

What we know:

- Use Node.js 22 and pnpm 10.
- Run `pnpm install --frozen-lockfile` at the repository root.
- The main structure is `apps/web` for the React interface, `apps/api` for the HTTP API, `packages/domain` for business rules, and `packages/ui` for shared UI components.
- `pnpm dev` starts web and api together.
- Run all tests with `pnpm test`, type checking with `pnpm typecheck`, and formatting verification with `pnpm format:check`.
- Run one package's tests from the root with `pnpm --filter <package-name> test`.
- The first task is to change the due-date display function in `packages/domain` so that an item due on the current date returns `due today`, and to add its unit test.
- Do not duplicate the date decision in `apps/web` or `apps/api`.
- After the change, run the target package tests, full type checking, and formatting verification. Run the complete test suite before submission.
- Update the lockfile only when dependencies change.
- Environment variables, port numbers, and branch names have not been provided.

