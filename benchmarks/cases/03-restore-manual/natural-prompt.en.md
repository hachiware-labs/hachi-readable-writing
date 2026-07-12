Write instructions for restoring a deleted workspace from the administration screen.
Organization administrators will use them while doing the work.

What we know:

- Only an organization owner can restore a workspace.
- A deleted workspace remains soft-deleted and recoverable for 30 days. It cannot be restored after 30 days.
- Restoration recovers members, settings, and files.
- External integrations stopped during deletion remain disabled and must be re-enabled individually.
- Scheduled jobs do not restart automatically.
- If another workspace has taken the deleted workspace's URL slug, change the current workspace's slug before restoring.
- Sign in to the administration console, open `Settings`, then `Deleted workspaces`, select the workspace, use `Review restore` to confirm its name and URL slug, and run `Restore workspace`.
- Restoration may take up to 20 minutes. Files in the workspace are read-only during that time.
- After completion, verify members and files, re-enable required integrations, inspect scheduled jobs, and then restart the jobs that should run.
- We do not have any other screen names or features documented.

