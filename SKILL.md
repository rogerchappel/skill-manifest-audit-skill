# Skill Manifest Audit Skill

## When To Use

Use this skill when an agent needs to check whether a local agent-skill repository is ready for release-candidate review or packaging.

## Inputs

- A local repository path.
- Optional output format: `json` or `markdown`.
- A skill repo that is expected to contain `SKILL.md`, README, docs, and package metadata.

## Side-Effect Boundaries

This skill is read-only. It reads local files and writes the report to stdout. It must not edit files, push branches, publish packages, create releases, or call external services.

## Approval Requirements

No approval is required for local read-only audits. Any future mode that edits files, opens PRs, publishes packages, or uses network access requires explicit user approval and a dry-run preview first.

## Examples

```bash
skill-manifest-audit . --format markdown
skill-manifest-audit ../some-skill --format json
```

## Validation

Run:

```bash
npm test
npm run check
npm run smoke
```

Review failures as packaging-readiness findings rather than proof that the skill itself is unusable.
