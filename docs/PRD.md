# PRD

## Goal

Provide a deterministic local audit for agent-skill repository readiness.

## Non-Goals

- No automatic fixes.
- No registry publishing.
- No network checks.

## Requirements

- Audit a repo path supplied on the command line.
- Check required docs and `SKILL.md` sections.
- Check package metadata, test script, and smoke script.
- Emit machine-readable JSON and review-friendly Markdown.
- Return a failing exit code when issues are found.

## Success Metrics

- A complete fixture passes.
- An incomplete fixture fails with specific checks.
- Another agent can paste the Markdown report into a release-candidate PR.
