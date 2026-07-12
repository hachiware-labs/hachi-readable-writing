# Relay Runner v1 to v2 Configuration Migration Guide

This guide describes a staged migration of Relay Runner from v1 to v2. It covers only the supplied configuration keys and commands; review any additional keys separately before rollout because their v2 behavior is unknown.

## Configuration changes

| v1 | v2 | Conversion |
|---|---|---|
| `workers` | `concurrency` | Keep the same value. |
| `retry.count` | `retry.max_attempts` | Add 1. v1 excludes the first attempt; v2 includes it. |
| `retry.delay_seconds` | `retry.initial_delay` | Convert seconds to a duration string, such as `10` to `10s`. |
| — | `queue` | Add `queue: default`. |

Unlike v1, which only warned about unknown configuration keys, v2 refuses to start when it finds them. Remove or resolve every unrecognized key before rollout. No assumptions should be made about keys not listed above.

## Before-and-after example

Given this v1 configuration:

```yaml
workers: 8
retry:
  count: 3
  delay_seconds: 10
```

The corresponding v2 configuration is:

```yaml
concurrency: 8
queue: default
retry:
  max_attempts: 4
  initial_delay: 10s
```

This preserves eight concurrent workers and four total attempts: the first attempt plus the three retries configured in v1.

## Staged migration

1. Convert the v1 configuration.

   Rename the known fields, adjust the retry count, convert the delay to a duration string, and add `queue: default`. Check for unknown keys because v2 will reject them.

2. Validate the v2 file.

   ```text
   relay validate --config relay.yml
   ```

   Continue only when the command prints:

   ```text
   configuration valid
   ```

3. Run v2 in the validation environment for one day.

   Use the converted and validated configuration. If the environment does not behave as expected, stop the migration and investigate before changing production.

4. Move 10 percent of production to v2.

   Keep the remaining production capacity on v1 so that the rollout remains staged.

5. Observe the production canary for two hours.

   Monitor error rate and processing time. Expand only if both remain acceptable for the service.

6. Expand v2 to all production.

   Retain the matching v1 executable and configuration until the migration no longer requires a rollback path.

## Rollback

Restore the v1 executable and its v1 configuration file together. Do not run the v1 executable with a v2 configuration: renamed fields, the new retry semantics, and v2-only requirements are not compatible with v1.

For the example above, rollback restores:

```yaml
workers: 8
retry:
  count: 3
  delay_seconds: 10
```

After restoration, verify the service using the organization’s existing operational checks. No Relay Runner rollback or health-check commands were supplied for this guide.