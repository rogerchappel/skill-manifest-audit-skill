# Orchestration

## Agent Workflow

1. Run `npm test`.
2. Run `npm run check`.
3. Run `npm run smoke`.
4. Run `node bin/skill-manifest-audit.js <target> --format markdown`.
5. Treat failed checks as review findings with local evidence.

## External Actions

This project performs no external actions. Do not combine the audit with publishing or GitHub mutations unless a human explicitly requests that separate step.
