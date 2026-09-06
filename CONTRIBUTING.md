# Contributing

Thanks for helping improve `skill-manifest-audit-skill`.

## Development

Use a supported Node.js release. CI runs the complete release check on Node 20,
the minimum declared runtime, and Node 24, the current runtime line.

```sh
npm run release:check
```

That command includes the package check, full test suite, CLI smoke test, npm
pack dry-run, and installed-consumer verification.

Keep the audit read-only. New checks should explain the missing evidence without modifying the inspected repository.

## Pull requests

- Include a short description of the readiness signal being added or changed.
- Add or update tests for audit rules, report output, or CLI behavior.
- Update the README when command usage or exit behavior changes.
