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
