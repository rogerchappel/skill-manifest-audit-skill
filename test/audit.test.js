import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { auditSkillRepo, formatMarkdownReport } from '../lib/audit.js';

function temporaryRepo() {
  const repoPath = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-manifest-audit-'));
  fs.cpSync('fixtures/good-skill', repoPath, { recursive: true });
  return repoPath;
}

test('passes a complete skill fixture', () => {
  const report = auditSkillRepo('fixtures/good-skill');
  assert.equal(report.summary.status, 'pass');
  assert.equal(report.summary.failed, 0);
});

test('ignores required section headings inside fenced code blocks', (t) => {
  for (const fence of ['```markdown', '~~~markdown']) {
    const repoPath = temporaryRepo();
    t.after(() => fs.rmSync(repoPath, { recursive: true, force: true }));
    const marker = fence.slice(0, 3);
    const headings = [
      '# Demo',
      '',
      fence,
      '## When to use',
      '## Inputs',
      '## Side-effect boundaries',
      '## Approval requirements',
      '## Examples',
      '## Validation',
      marker
    ];
    fs.writeFileSync(path.join(repoPath, 'SKILL.md'), headings.join('\n'));

    const report = auditSkillRepo(repoPath);

    assert.equal(report.summary.status, 'fail');
    assert.equal(report.summary.failed, 6);
    assert.deepEqual(
      report.checks.filter((check) => check.status === 'fail').map((check) => check.id),
      [
        'skill:when to use',
        'skill:inputs',
        'skill:side-effect boundaries',
        'skill:approval requirements',
        'skill:examples',
        'skill:validation'
      ]
    );
  }
});

test('recognizes supported ATX section headings outside fenced code', (t) => {
  const repoPath = temporaryRepo();
  t.after(() => fs.rmSync(repoPath, { recursive: true, force: true }));
  fs.writeFileSync(path.join(repoPath, 'SKILL.md'), [
    '# When to use',
    '## Inputs',
    '### Side-effect boundaries',
    '#### Approval requirements',
    '## Examples ##',
    '### Validation details'
  ].join('\n'));

  assert.equal(auditSkillRepo(repoPath).summary.status, 'pass');
});

test('fails an incomplete skill fixture with actionable checks', () => {
  const report = auditSkillRepo('fixtures/bad-skill');
  assert.equal(report.summary.status, 'fail');
  assert.ok(report.checks.some((check) => check.id === 'doc:docs/ORCHESTRATION.md' && check.status === 'fail'));
  assert.ok(report.checks.some((check) => check.id === 'package:smoke' && check.status === 'fail'));
});

test('renders markdown report', () => {
  const report = auditSkillRepo('fixtures/good-skill');
  const markdown = formatMarkdownReport(report);
  assert.match(markdown, /Skill Manifest Audit/);
  assert.match(markdown, /Status: \*\*pass\*\*/);
});

test('reports malformed package.json as a structured failing check', (t) => {
  const repoPath = temporaryRepo();
  t.after(() => fs.rmSync(repoPath, { recursive: true, force: true }));
  fs.writeFileSync(path.join(repoPath, 'package.json'), '{bad');

  const report = auditSkillRepo(repoPath);

  assert.equal(report.summary.status, 'fail');
  assert.ok(report.checks.some((check) =>
    check.id === 'package:metadata'
    && check.status === 'fail'
    && check.evidence === 'package.json contains invalid JSON'
  ));
});

test('reports non-object package.json as a structured failing check', (t) => {
  const repoPath = temporaryRepo();
  t.after(() => fs.rmSync(repoPath, { recursive: true, force: true }));
  fs.writeFileSync(path.join(repoPath, 'package.json'), 'null');

  const report = auditSkillRepo(repoPath);

  assert.equal(report.summary.status, 'fail');
  assert.ok(report.checks.some((check) =>
    check.id === 'package:metadata'
    && check.status === 'fail'
    && check.evidence === 'package.json must contain a JSON object'
  ));
});

test('reports blank package fields as individual structured failing checks', (t) => {
  const repoPath = temporaryRepo();
  t.after(() => fs.rmSync(repoPath, { recursive: true, force: true }));
  const packageJson = JSON.parse(fs.readFileSync(path.join(repoPath, 'package.json'), 'utf8'));
  Object.assign(packageJson, {
    name: '   ',
    bin: {},
    scripts: { test: '\t', smoke: '' }
  });
  fs.writeFileSync(path.join(repoPath, 'package.json'), JSON.stringify(packageJson));

  const report = auditSkillRepo(repoPath);

  assert.equal(report.summary.status, 'fail');
  for (const [id, evidence] of [
    ['package:name', 'name'],
    ['package:bin', 'bin'],
    ['package:test', 'scripts.test'],
    ['package:smoke', 'scripts.smoke']
  ]) {
    assert.ok(report.checks.some((check) =>
      check.id === id && check.status === 'fail' && check.evidence === evidence
    ));
  }
});

test('rejects invalid package field container and value types', (t) => {
  const cases = [
    ['name', 42, 'package:name'],
    ['bin', [], 'package:bin'],
    ['bin', { command: ' ' }, 'package:bin'],
    ['scripts', [], 'package:test'],
    ['scripts', { test: true, smoke: ['node', 'smoke.js'] }, 'package:test']
  ];

  for (const [field, value, expectedId] of cases) {
    const repoPath = temporaryRepo();
    t.after(() => fs.rmSync(repoPath, { recursive: true, force: true }));
    const packageJson = JSON.parse(fs.readFileSync(path.join(repoPath, 'package.json'), 'utf8'));
    packageJson[field] = value;
    fs.writeFileSync(path.join(repoPath, 'package.json'), JSON.stringify(packageJson));

    const report = auditSkillRepo(repoPath);
    assert.equal(report.summary.status, 'fail');
    assert.ok(report.checks.some((check) => check.id === expectedId && check.status === 'fail'));
  }
});

test('accepts a nonblank string bin target', (t) => {
  const repoPath = temporaryRepo();
  t.after(() => fs.rmSync(repoPath, { recursive: true, force: true }));
  const packageJson = JSON.parse(fs.readFileSync(path.join(repoPath, 'package.json'), 'utf8'));
  packageJson.bin = 'bin/good.js';
  fs.writeFileSync(path.join(repoPath, 'package.json'), JSON.stringify(packageJson));

  assert.equal(auditSkillRepo(repoPath).summary.status, 'pass');
});

test('reports directories at required file paths as structured failing checks', (t) => {
  const repoPath = temporaryRepo();
  t.after(() => fs.rmSync(repoPath, { recursive: true, force: true }));
  fs.rmSync(path.join(repoPath, 'SKILL.md'));
  fs.mkdirSync(path.join(repoPath, 'SKILL.md'));
  fs.rmSync(path.join(repoPath, 'docs/PRD.md'));
  fs.mkdirSync(path.join(repoPath, 'docs/PRD.md'));

  const report = auditSkillRepo(repoPath);

  assert.equal(report.summary.status, 'fail');
  assert.ok(report.checks.some((check) =>
    check.id === 'doc:SKILL.md' && check.status === 'fail'
  ));
  assert.ok(report.checks.some((check) =>
    check.id === 'doc:docs/PRD.md' && check.status === 'fail'
  ));
  assert.ok(report.checks.some((check) =>
    check.id === 'skill:sections'
    && check.status === 'fail'
    && check.evidence === 'SKILL.md is not a regular file'
  ));
});
