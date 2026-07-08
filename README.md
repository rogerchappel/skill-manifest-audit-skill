# skill-manifest-audit-skill

Read-only readiness audits for public agent-skill repositories.

The CLI checks for the files and operational sections another agent needs before it can safely use or package a skill: product docs, `SKILL.md` sections, package metadata, test commands, and smoke commands.

## Quickstart

```bash
npm test
npm run check
npm run smoke
node bin/skill-manifest-audit.js . --format markdown
```

## CLI

```bash
skill-manifest-audit <repo> --format json
skill-manifest-audit <repo> --format markdown
```

The command exits `0` when every check passes and `1` when readiness issues are found.

## Safety

- Local filesystem reads only.
- No network calls.
- No credential access.
- No automatic file edits.

## Limitations

- Markdown section detection is intentionally simple and requires explicit headings.
- The audit checks repository packaging readiness, not whether the skill advice is correct.
- Future fixer modes should remain opt-in and dry-run first.
