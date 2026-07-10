# Contributing

Thanks for helping improve `skill-manifest-audit-skill`.

## Development

```sh
npm test
npm run check
npm run smoke
npm run package:smoke
```

Keep the audit read-only. New checks should explain the missing evidence without modifying the inspected repository.

## Pull requests

- Include a short description of the readiness signal being added or changed.
- Add or update tests for audit rules, report output, or CLI behavior.
- Update the README when command usage or exit behavior changes.
