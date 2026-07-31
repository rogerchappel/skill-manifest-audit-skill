import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import test from 'node:test';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

async function assertUsageError(args, message) {
  await assert.rejects(execFileAsync('node', ['bin/skill-manifest-audit.js', ...args]), (error) => {
    assert.equal(error.code, 2);
    assert.match(error.stderr, message);
    assert.match(error.stderr, /Usage: skill-manifest-audit \[repo\] \[--format json\|markdown\]/u);
    assert.equal(error.stdout, '');
    return true;
  });
}

test('prints CLI help', async () => {
  const { stdout } = await execFileAsync('node', ['bin/skill-manifest-audit.js', '--help']);

  assert.match(stdout, /skill-manifest-audit 0\.1\.0/u);
  assert.match(stdout, /Usage: skill-manifest-audit/u);
  assert.match(stdout, /read-only audit/u);
  assert.match(stdout, /Exit codes: 0 ready, 1 readiness or repository input issues, 2 invalid usage/u);
});

test('prints CLI version', async () => {
  const { stdout } = await execFileAsync('node', ['bin/skill-manifest-audit.js', '--version']);

  assert.equal(stdout, '0.1.0\n');
});

test('rejects unknown options with a usage error', async () => {
  await assertUsageError(['fixtures/good-skill', '--bogus'], /Unknown option: --bogus/u);
});

test('rejects a missing --format value with a usage error', async () => {
  await assertUsageError(['fixtures/good-skill', '--format'], /Option --format requires a value/u);
});

test('rejects more than one repository path with a usage error', async () => {
  await assertUsageError(
    ['fixtures/good-skill', 'fixtures/good-skill'],
    /Only one repository path may be provided/u
  );
});

test('accepts options before and after the repository path', async () => {
  const before = await execFileAsync('node', [
    'bin/skill-manifest-audit.js',
    '--format',
    'markdown',
    'fixtures/good-skill'
  ]);
  const after = await execFileAsync('node', [
    'bin/skill-manifest-audit.js',
    'fixtures/good-skill',
    '--format',
    'markdown'
  ]);

  assert.equal(before.stdout, after.stdout);
  assert.match(before.stdout, /Skill Manifest Audit/u);
});

test('prints malformed input failures without a stack trace', async () => {
  await assert.rejects(
    execFileAsync('node', ['bin/skill-manifest-audit.js', 'test/fixtures/malformed-package', '--format', 'json']),
    (error) => {
      assert.equal(error.code, 1);
      assert.match(error.stdout, /package\.json contains invalid JSON/u);
      assert.doesNotMatch(error.stderr, /SyntaxError|at auditPackage/u);
      return true;
    }
  );
});
