import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectDir = fileURLToPath(new URL('..', import.meta.url));

test('release:check runs the packaged CLI from an isolated consumer without changing the checkout', () => {
  const before = execFileSync('git', ['status', '--porcelain'], { cwd: projectDir, encoding: 'utf8' });
  const tempRoot = mkdtempSync(join(tmpdir(), 'skill-manifest-audit-consumer-test-'));
  try {
    execFileSync('bash', ['scripts/test-package-consumer.sh'], {
      cwd: projectDir,
      env: { ...process.env, TMPDIR: tempRoot },
      stdio: 'pipe',
    });
    const after = execFileSync('git', ['status', '--porcelain'], { cwd: projectDir, encoding: 'utf8' });
    assert.equal(after, before, 'package consumer verification modified tracked or untracked checkout state');
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});
