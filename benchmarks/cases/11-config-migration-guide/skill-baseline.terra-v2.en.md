# Relay Runner v1 to v2 Configuration Migration Guide

Use this guide to convert a Relay Runner v1 configuration for a staged v2 rollout. Convert and validate the configuration before deploying it; v2 refuses to start if any unknown configuration keys remain.

## Required configuration changes

| v1 setting | v2 setting | Migration rule |
|---|---|---|
| `workers` | `concurrency` | Copy the value unchanged. |
| `retry.count` | `retry.max_attempts` | Add 1, because v1 excludes the first attempt and v2 includes it. |
| `retry.delay_seconds` | `retry.initial_delay` | Convert the numeric seconds value to a duration string, such as `10s`. |
| — | `queue` | Add this required v2 key with `default` for this migration. |

### Example: v1 configuration

```yaml
workers: 8
retry:
  count: 3
  delay_seconds: 10
```

### Equivalent v2 configuration

```yaml
concurrency: 8
queue: default
retry:
  max_attempts: 4
  initial_delay: 10s
```

The example changes `retry.count: 3` to `retry.max_attempts: 4`: three retries after an initial attempt in v1 become four total attempts in v2.

## Convert and validate

1. Create the v2 configuration by applying the known changes above.
2. Review the remaining keys in the file. v2 does not accept unknown configuration keys, whereas v1 only warned about them. No mappings for other keys are provided here.
3. Validate the v2 file:

   ```sh
   relay validate --config relay.yml
   ```

   Continue only when the command prints:

   ```text
   configuration valid
   ```

## Staged rollout

1. Convert and validate the configuration.
2. Run v2 in the validation environment for one day.
3. Move 10 percent of production to v2.
4. Observe error rate and processing time for two hours.
5. If the observation is acceptable, expand v2 to all production.

## Rollback

To roll back, restore the v1 configuration file and the v1 executable together. Do not run v1 with a v2 configuration file.