import fs from 'node:fs';
import path from 'node:path';

const REQUIRED_SKILL_SECTIONS = [
  'when to use',
  'inputs',
  'side-effect boundaries',
  'approval requirements',
  'examples',
  'validation'
];

const REQUIRED_DOCS = [
  'docs/PRD.md',
  'docs/TASKS.md',
  'docs/ORCHESTRATION.md',
  'README.md',
  'SKILL.md'
];

function readIfExists(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

function fileExists(repoPath, relativePath) {
  return fs.existsSync(path.join(repoPath, relativePath));
}

function hasSection(markdown, sectionName) {
  const expression = new RegExp(`^#{1,4}\\s+${sectionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'im');
  return expression.test(markdown);
}

function auditDocs(repoPath) {
  return REQUIRED_DOCS.map((relativePath) => ({
    id: `doc:${relativePath}`,
    title: `${relativePath} exists`,
    status: fileExists(repoPath, relativePath) ? 'pass' : 'fail',
    evidence: relativePath
  }));
}

function auditSkillMarkdown(repoPath) {
  const skillText = readIfExists(path.join(repoPath, 'SKILL.md'));
  if (!skillText) {
    return [{
      id: 'skill:sections',
      title: 'SKILL.md declares required operational sections',
      status: 'fail',
      evidence: 'SKILL.md is missing'
    }];
  }

  return REQUIRED_SKILL_SECTIONS.map((section) => ({
    id: `skill:${section}`,
    title: `SKILL.md includes "${section}"`,
    status: hasSection(skillText, section) ? 'pass' : 'fail',
    evidence: `section:${section}`
  }));
}

function auditPackage(repoPath) {
  const packageText = readIfExists(path.join(repoPath, 'package.json'));
  if (!packageText) {
    return [{
      id: 'package:metadata',
      title: 'package.json exists',
      status: 'fail',
      evidence: 'package.json is missing'
    }];
  }

  const packageJson = JSON.parse(packageText);
  const checks = [
    ['package:name', 'package.json declares a name', Boolean(packageJson.name), 'name'],
    ['package:license', 'package.json declares a license', Boolean(packageJson.license), 'license'],
    ['package:bin', 'package.json declares a CLI bin', Boolean(packageJson.bin), 'bin'],
    ['package:test', 'package.json declares npm test', Boolean(packageJson.scripts?.test), 'scripts.test'],
    ['package:smoke', 'package.json declares npm run smoke', Boolean(packageJson.scripts?.smoke), 'scripts.smoke']
  ];

  return checks.map(([id, title, passed, evidence]) => ({
    id,
    title,
    status: passed ? 'pass' : 'fail',
    evidence
  }));
}

function summarize(checks) {
  const failed = checks.filter((check) => check.status === 'fail');
  return {
    status: failed.length === 0 ? 'pass' : 'fail',
    passed: checks.length - failed.length,
    failed: failed.length,
    total: checks.length
  };
}

export function auditSkillRepo(repoPath = '.') {
  const absolutePath = path.resolve(repoPath);
  const checks = [
    ...auditDocs(absolutePath),
    ...auditSkillMarkdown(absolutePath),
    ...auditPackage(absolutePath)
  ];

  return {
    tool: 'skill-manifest-audit-skill',
    repoPath: absolutePath,
    summary: summarize(checks),
    checks
  };
}

export function formatMarkdownReport(report) {
  const lines = [
    `# Skill Manifest Audit`,
    '',
    `Repository: \`${report.repoPath}\``,
    `Status: **${report.summary.status}** (${report.summary.passed}/${report.summary.total} passed)`,
    '',
    '## Checks',
    ''
  ];

  for (const check of report.checks) {
    const mark = check.status === 'pass' ? '[x]' : '[ ]';
    lines.push(`- ${mark} ${check.title} (${check.evidence})`);
  }

  return lines.join('\n');
}
