#!/usr/bin/env node
import { auditSkillRepo, formatMarkdownReport } from '../lib/audit.js';

const VERSION = '0.1.0';

function parseArgs(argv) {
  const args = { repoPath: '.', format: 'json' };
  let hasRepoPath = false;
  let hasFormat = false;
  const hasStandaloneOption = argv.some((arg) =>
    ['--help', '-h', '--version', '-v'].includes(arg)
  );
  if (hasStandaloneOption && argv.length !== 1) {
    throw new Error('Options --help/-h and --version/-v must be used alone.');
  }
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--format') {
      if (hasFormat) {
        throw new Error('Option --format may only be provided once.');
      }
      const value = argv[index + 1];
      if (!value || value.startsWith('-')) {
        throw new Error('Option --format requires a value.');
      }
      args.format = value;
      hasFormat = true;
      index += 1;
    } else if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else if (arg === '--version' || arg === '-v') {
      args.version = true;
    } else if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`);
    } else if (hasRepoPath) {
      throw new Error('Only one repository path may be provided.');
    } else {
      args.repoPath = arg;
      hasRepoPath = true;
    }
  }
  return args;
}

function exitWithUsage(message) {
  console.error(`${message}\nUsage: skill-manifest-audit [repo] [--format json|markdown]`);
  process.exit(2);
}

let args;
try {
  args = parseArgs(process.argv.slice(2));
} catch (error) {
  exitWithUsage(error.message);
}

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
  exitWithUsage(`Unsupported format: ${args.format}`);
}

process.exit(report.summary.status === 'pass' ? 0 : 1);
