# Relay Runner v1 to v2 Configuration Migration Guide

Use this guide to convert Relay Runner configuration for a staged v2 rollout. The v2 configuration is not backward-compatible: it requires `queue`, rejects unknown keys, and changes the retry attempt calculation.

## Configuration changes

| v1 | v2 | Migration rule |
|---|---|---|
| `workers` | `concurrency` | Copy the value unchanged. |
| `retry.count` | `retry.max_attempts` | Add 1, because v1 excludes the first attempt and v2 includes it. |
| `retry.delay_seconds` | `retry.initial_delay` | Convert the number of seconds to a duration string, such as `10s`. |
| — | `queue` | Required in v2. Set `queue: default`. |

## Example conversion

A v1 configuration:

```yaml
workers: 8
retry:
  count: 3
  delay_seconds: 10
```

The equivalent v2 configuration:

```yaml
concurrency: 8
queue: default
retry:
  max_attempts: 4
  initial_delay: 10s
```

In this example, v1 `count: 3` means one initial attempt plus three retries. The v2 equivalent is therefore `max_attempts: 4`.

## Convert and validate

1. Create a v2 configuration by applying the field changes above.

2. Review the resulting file for keys that are not documented in this guide. v2 refuses to start when it finds unknown configuration keys, whereas v1 only issued warnings. Information about other supported keys is not available here, so confirm each remaining key before using it with v2.

3. Validate the v2 configuration:

   ```sh
   relay validate --config relay.yml
   ```

   Continue only when the command prints:

   ```text
   configuration valid
   ```

## Staged rollout

After validation, use this rollout sequence:

1. Run the converted configuration in the validation environment for one day.

2. Move 10 percent of production to v2.

3. Observe error rate and processing time for two hours.

4. If the observed results support continuing, expand v2 to all production.

## Rollback

To roll back, restore the v1 configuration file and the v1 executable together. Do not pass a v2 configuration directly to a v1 executable.