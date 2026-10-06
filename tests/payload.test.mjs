import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const manifest = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8'));
test('ships the declared native plugin files for Harness 0.2.1', () => {
  assert.equal(manifest.targetHarness, '0.2.1-alpha.1');
  for (const entry of manifest.files) {
    assert.ok(!entry.path.split('/').some(x => ['node_modules', '.git', 'sessions'].includes(x)));
    assert.equal(statSync(join(root, entry.path)).size, entry.size);
  }
  for (const plugin of manifest.plugins) {
    const base = join(root, 'payload', plugin.id, 'product', 'plugins', plugin.id);
    const pkg = JSON.parse(readFileSync(join(base, 'package.json'), 'utf8'));
    assert.equal(pkg.version, plugin.version);
    assert.equal(pkg.engines.dsh, '^0.2.1-0');
    assert.ok(existsSync(join(base, 'cordis.patch.yml')));
    for (const row of plugin.rows) if (row.name.startsWith('./')) assert.ok(existsSync(join(base, row.name)));
  }
});
test('ships current compatibility instructions and patches', () => {
  const install = readFileSync(join(root, 'INSTALL.md'), 'utf8');
  assert.ok(install.includes('dsh-v0.2.1-alpha.1'));
  for (const patch of manifest.compatibilityPatches) assert.ok(statSync(join(root, patch)).size > 0);
});
