import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import test from 'node:test';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

test('prints CLI help', async () => {
  const { stdout } = await execFileAsync('node', ['bin/skill-manifest-audit.js', '--help']);

  assert.match(stdout, /skill-manifest-audit 0\.1\.0/u);
  assert.match(stdout, /Usage: skill-manifest-audit/u);
  assert.match(stdout, /read-only audit/u);
});

test('prints CLI version', async () => {
  const { stdout } = await execFileAsync('node', ['bin/skill-manifest-audit.js', '--version']);

  assert.equal(stdout, '0.1.0\n');
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
