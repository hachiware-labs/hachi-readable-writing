# Restore a Deleted Workspace

Only an organization owner can restore a deleted workspace. A workspace is recoverable for 30 days after deletion; after that period, it cannot be restored.

Restoration recovers the workspace’s members, settings, and files. External integrations remain disabled, and scheduled jobs remain stopped until you address them after restoration.

Before starting, check whether another workspace now uses the deleted workspace’s URL slug. If so, change that current workspace’s slug before restoring the deleted workspace.

1. Sign in to the administration console as an organization owner.

2. Open `Settings`, then `Deleted workspaces`.

3. Select the workspace to restore.

4. Choose `Review restore`. Confirm that the workspace name and URL slug are correct.

5. Choose `Restore workspace`.

Restoration can take up to 20 minutes. During this time, files in the workspace are read-only.

After restoration finishes, verify that the expected members and files are present. Re-enable each required external integration individually, inspect the workspace’s scheduled jobs, and restart only the jobs that should run.