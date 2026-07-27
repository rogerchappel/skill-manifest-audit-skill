#!/usr/bin/env node
import { auditSkillRepo, formatMarkdownReport } from '../lib/audit.js';

const VERSION = '0.1.0';

function parseArgs(argv) {
  const args = { repoPath: '.', format: 'json' };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--format') {
      args.format = argv[index + 1] || 'json';
      index += 1;
    } else if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else if (arg === '--version' || arg === '-v') {
      args.version = true;
    } else {
      args.repoPath = arg;
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  console.log(`skill-manifest-audit ${VERSION}

Usage: skill-manifest-audit [repo] [--format json|markdown]

Runs a read-only audit for agent skill repository readiness.
Exit codes: 0 ready, 1 readiness or repository input issues, 2 invalid usage.`);
  process.exit(0);
}

if (args.version) {
  console.log(VERSION);
  process.exit(0);
}

const report = auditSkillRepo(args.repoPath);

if (args.format === 'markdown') {
  console.log(formatMarkdownReport(report));
} else if (args.format === 'json') {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.error(`Unsupported format: ${args.format}`);
  process.exit(2);
}

process.exit(report.summary.status === 'pass' ? 0 : 1);
