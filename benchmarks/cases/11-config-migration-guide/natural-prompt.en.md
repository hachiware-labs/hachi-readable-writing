Create a configuration guide for moving Relay Runner from v1 to v2.
Operations staff will use it for a staged migration and need before-and-after YAML examples.

What we know:

- v1 `workers` is renamed to v2 `concurrency` with the same meaning.
- v1 `retry.count` becomes v2 `retry.max_attempts`. The v1 count excludes the first attempt, while v2 max_attempts is the total including the first attempt. Therefore, v1 value 3 becomes v2 value 4.
- v1 `retry.delay_seconds` becomes v2 `retry.initial_delay`, using a duration string such as `10s`.
- `queue` is required in v2. Use `queue: default` for this migration.
- v2 refuses to start when it finds unknown configuration keys. v1 only warned.
- Validate v2 configuration with `relay validate --config relay.yml`. Success prints `configuration valid`.
- For staged rollout, convert and validate the configuration, run it in the validation environment for one day, move 10 percent of production to v2, observe error rate and processing time for two hours, and then expand to all production.
- Rollback must restore the v1 configuration file and v1 executable together. Do not pass a v2 configuration directly to v1.
- We do not have information about any other keys or commands.

