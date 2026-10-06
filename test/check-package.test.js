import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('check-package reports a missing bin map as a clear assertion failure', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-manifest-package-'));
  try {
    fs.copyFileSync(path.join(repoRoot, 'scripts/check-package.js'), path.join(tempDir, 'check-package.js'));
    fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({
      type: 'module', scripts: { test: 'node --test', smoke: 'node cli.js' }, files: ['SKILL.md'],
    }));

    const result = spawnSync(process.execPath, ['check-package.js'], { cwd: tempDir, encoding: 'utf8' });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Missing expected package bin entry: skill-manifest-audit/);
    assert.doesNotMatch(result.stderr, /TypeError/);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
