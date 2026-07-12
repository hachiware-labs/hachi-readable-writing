# Restore a Deleted Workspace

Only an organization owner can restore a workspace. A deleted workspace remains recoverable for 30 days; after that period, it cannot be restored.

Restoration recovers the workspace’s members, settings, and files. It does not re-enable external integrations or restart scheduled jobs.

## Before you begin

Confirm that:

- You are signed in as an organization owner.
- The workspace was deleted no more than 30 days ago.
- The workspace’s former URL slug is not being used by another workspace.

If another workspace is using the slug, change that workspace’s current slug before starting the restoration.

## Restore the workspace

1. Sign in to the administration console.
2. Open `Settings`, then `Deleted workspaces`.
3. Select the workspace you want to restore.
4. Select `Review restore`.
5. Confirm the workspace name and URL slug.
6. Select `Restore workspace`.

Restoration may take up to 20 minutes. Files in the workspace remain read-only while restoration is in progress.

## Complete the restoration

After the restoration finishes:

1. Verify that the expected members and files have been recovered.
2. Re-enable each required external integration individually.
3. Inspect the workspace’s scheduled jobs.
4. Restart only the jobs that should resume running.

The workspace is ready for normal use after its contents have been verified and the required integrations and scheduled jobs have been restored to operation.