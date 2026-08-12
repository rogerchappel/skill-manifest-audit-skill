# Release Candidate Notes

## Changes

- Added a read-only Node CLI for skill repository readiness audits.
- Added JSON and Markdown output.
- Added fixture-backed tests for passing and failing repositories.
- Documented agent usage, safety boundaries, and orchestration.

## Verification

- `npm test` - passed; use the command output as the source of truth for the current test count.
- `npm run check` - passed, package metadata ok.
- `npm run smoke` - passed; use the report summary as the source of truth for the current check count.
- `npm run package:consumer` - creates the npm tarball, verifies its runtime files,
  installs it in a disposable consumer project, and exercises the installed
  CLI help, version, JSON audit, and Markdown audit.
- `npm run release:check` - runs all release verification above, including the
  disposable package consumer test.

The package is not yet available from the npm registry. The README therefore
uses the GitHub repository as the supported install source until publication.

## Classification

Ship.
