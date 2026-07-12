# Restore a Deleted Workspace

Only an organization owner can restore a workspace. A deleted workspace is recoverable for 30 days after deletion; after that period, it cannot be restored.

Restoration recovers the workspace’s members, settings, and files. External integrations remain disabled, and scheduled jobs remain stopped.

Before restoring, make sure the workspace’s URL slug is available. If another workspace is currently using the deleted workspace’s slug, change that workspace’s slug first.

1. Sign in to the administration console as an organization owner.

2. Open `Settings`, then `Deleted workspaces`.

3. Select the workspace to restore.

4. Select `Review restore`. Confirm the workspace name and URL slug.

5. Select `Restore workspace`.

Restoration can take up to 20 minutes. While it is in progress, workspace files are read-only.

After restoration completes, verify that the expected members and files are present. Re-enable each required external integration individually. Then inspect the scheduled jobs and restart only the jobs that should run.