# Restore a deleted workspace

Only an organization owner can restore a workspace. Deleted workspaces are recoverable for 30 days after deletion; after that period, they cannot be restored.

Before you begin, check whether another workspace is using the deleted workspace’s URL slug. If so, change the current workspace’s slug before continuing.

1. Sign in to the administration console as an organization owner.
2. Open `Settings`, then select `Deleted workspaces`.
3. Select the workspace to restore.
4. Select `Review restore` and confirm the workspace name and URL slug.
5. Select `Restore workspace`.

Restoration recovers the workspace’s members, settings, and files. It can take up to 20 minutes. During restoration, files in the workspace are read-only.

After restoration completes, verify the workspace’s members and files. Re-enable each required external integration, since integrations stopped at deletion remain disabled. Review scheduled jobs and restart only the jobs that should run; scheduled jobs do not restart automatically.