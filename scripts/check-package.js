import assert from 'node:assert/strict';
import fs from 'node:fs';

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

assert.equal(packageJson.type, 'module');
assert.ok(packageJson.bin && packageJson.bin['skill-manifest-audit'], 'Missing expected package bin entry: skill-manifest-audit');
assert.ok(packageJson.scripts.test);
assert.ok(packageJson.scripts.smoke);
assert.ok(packageJson.files.includes('SKILL.md'));

console.log('package metadata ok');
