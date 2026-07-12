# Restore a Deleted Workspace

Only an organization owner can restore a deleted workspace. A deleted workspace can be recovered for 30 days after deletion; after that, it cannot be restored.

Restoration recovers the workspace’s members, settings, and files. External integrations that stopped during deletion remain disabled, and scheduled jobs do not restart automatically.

## Before you begin

- Confirm that you are signed in as the organization owner.
- Confirm that the workspace was deleted within the last 30 days.
- Check whether another workspace is using the deleted workspace’s URL slug. If it is, change the current workspace’s slug before restoring the deleted workspace so that the deleted workspace’s original slug is available.

## Restore the workspace

1. Sign in to the administration console.
2. Open `Settings`.
3. Open `Deleted workspaces`.
4. Select the workspace you want to restore.
5. Select `Review restore`.
6. Confirm that the workspace name and URL slug are correct.
7. Select `Restore workspace`.

Restoration may take up to 20 minutes. During restoration, files in the workspace are read-only.

## After restoration completes

Verify that the workspace members and files have been recovered. Re-enable each required external integration individually. Inspect the scheduled jobs, then restart the jobs that should run.