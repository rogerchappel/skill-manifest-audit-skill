import assert from 'node:assert/strict';
import test from 'node:test';
import { auditSkillRepo, formatMarkdownReport } from '../lib/audit.js';

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
