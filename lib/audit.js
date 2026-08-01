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

function readRegularFile(filePath, displayPath) {
  let stats;
  try {
    stats = fs.statSync(filePath);
  } catch (error) {
    return {
      text: null,
      error: error.code === 'ENOENT'
        ? `${displayPath} is missing`
        : `${displayPath} is not readable (${error.code || 'filesystem error'})`
    };
  }

  if (!stats.isFile()) {
    return { text: null, error: `${displayPath} is not a regular file` };
  }

  try {
    return { text: fs.readFileSync(filePath, 'utf8'), error: null };
  } catch (error) {
    return {
      text: null,
      error: `${displayPath} is not readable (${error.code || 'filesystem error'})`
    };
  }
}

function hasSection(markdown, sectionName) {
  const expression = new RegExp(`^#{1,4}\\s+${sectionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'im');
  return expression.test(markdown);
}

function auditDocs(repoPath) {
  return REQUIRED_DOCS.map((relativePath) => {
    const result = readRegularFile(path.join(repoPath, relativePath), relativePath);
    return {
      id: `doc:${relativePath}`,
      title: `${relativePath} is a readable regular file`,
      status: result.error ? 'fail' : 'pass',
      evidence: result.error || relativePath
    };
  });
}

function auditSkillMarkdown(repoPath) {
  const result = readRegularFile(path.join(repoPath, 'SKILL.md'), 'SKILL.md');
  if (result.error) {
    return [{
      id: 'skill:sections',
      title: 'SKILL.md declares required operational sections',
      status: 'fail',
      evidence: result.error
    }];
  }

  return REQUIRED_SKILL_SECTIONS.map((section) => ({
    id: `skill:${section}`,
    title: `SKILL.md includes "${section}"`,
    status: hasSection(result.text, section) ? 'pass' : 'fail',
    evidence: `section:${section}`
  }));
}

function auditPackage(repoPath) {
  const result = readRegularFile(path.join(repoPath, 'package.json'), 'package.json');
  if (result.error) {
    return [{
      id: 'package:metadata',
      title: 'package.json is a readable regular file',
      status: 'fail',
      evidence: result.error
    }];
  }

  let packageJson;
  try {
    packageJson = JSON.parse(result.text);
  } catch {
    return [{
      id: 'package:metadata',
      title: 'package.json contains valid JSON',
      status: 'fail',
      evidence: 'package.json contains invalid JSON'
    }];
  }
  if (packageJson === null || typeof packageJson !== 'object' || Array.isArray(packageJson)) {
    return [{
      id: 'package:metadata',
      title: 'package.json contains a JSON object',
      status: 'fail',
      evidence: 'package.json must contain a JSON object'
    }];
  }
  const isNonblankString = (value) => typeof value === 'string' && value.trim().length > 0;
  const hasValidBin = isNonblankString(packageJson.bin)
    || (packageJson.bin !== null
      && typeof packageJson.bin === 'object'
      && !Array.isArray(packageJson.bin)
      && Object.keys(packageJson.bin).length > 0
      && Object.values(packageJson.bin).every(isNonblankString));
  const checks = [
    ['package:name', 'package.json declares a nonblank string name', isNonblankString(packageJson.name), 'name'],
    ['package:license', 'package.json declares a license', Boolean(packageJson.license), 'license'],
    ['package:bin', 'package.json declares a valid CLI bin string or command map', hasValidBin, 'bin'],
    ['package:test', 'package.json declares a nonblank npm test command', isNonblankString(packageJson.scripts?.test), 'scripts.test'],
    ['package:smoke', 'package.json declares a nonblank npm run smoke command', isNonblankString(packageJson.scripts?.smoke), 'scripts.smoke']
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
