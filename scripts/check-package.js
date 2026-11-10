import assert from 'node:assert/strict';
import fs from 'node:fs';

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

assert.equal(packageJson.type, 'module');
assert.ok(packageJson.bin && packageJson.bin['skill-manifest-audit'], 'Missing expected package bin entry: skill-manifest-audit');
assert.ok(packageJson.scripts.test);
assert.ok(packageJson.scripts.smoke);
assert.ok(packageJson.files.includes('SKILL.md'));
assert.ok(packageJson.files.includes('test'), 'Tests must be included in the published package');

const { files } = await import('node:fs/promises');
const { execFileSync } = await import('node:child_process');
const packed = JSON.parse(execFileSync('npm', ['pack', '--dry-run', '--json'], { encoding: 'utf8' }))[0];
const packagedPaths = new Set(packed.files.map(({ path }) => path));
for (const path of ['test/audit.test.js', 'test/cli.test.js']) {
  assert.ok(packagedPaths.has(path), `npm pack omitted intended test file: ${path}`);
}
for (const path of packagedPaths) {
  assert.ok(!path.startsWith('.git/'), `npm pack included repository metadata: ${path}`);
}

console.log('package metadata and artifact contents ok');
