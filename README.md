# skill-manifest-audit-skill

Read-only readiness audits for public agent-skill repositories.

The CLI checks for the files and operational sections another agent needs before it can safely use or package a skill: product docs, `SKILL.md` sections, package metadata, test commands, and smoke commands.

## Quickstart

```bash
npm install -g skill-manifest-audit-skill
skill-manifest-audit --help
skill-manifest-audit --version
skill-manifest-audit . --format markdown
```

For local development:

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

The command exits `0` when every check passes, `1` when readiness issues are
found, and `2` for unsupported CLI usage. Unknown options, a missing
`--format` value, unsupported output formats, and multiple repository paths
are rejected with a concise usage message.

Missing, unreadable, or non-file required paths and malformed `package.json`
content are readiness issues. Package readiness requires a nonblank string
`name`; a SemVer-compatible `version`; a nonblank string `license`; a nonblank
string `bin` target or a nonempty command map whose targets are nonblank
strings; and nonblank string `scripts.test` and `scripts.smoke` commands. Every
declared `bin` target must resolve to a regular file inside the audited package
tree. Missing targets and directories are reported separately from malformed
`bin` declarations. Invalid fields are included as individual failing checks in
both JSON and Markdown reports; the CLI does not print an exception stack for
these repository input errors.

## Safety

- Local filesystem reads only.
- No network calls.
- No credential access.
- No automatic file edits.

## Limitations

- Markdown section detection requires explicit level 1–4 ATX headings. Headings
  inside backtick or tilde fenced code blocks are treated as examples, not
  operational sections.
- The audit checks repository packaging readiness, not whether the skill advice is correct.
- Future fixer modes should remain opt-in and dry-run first.
