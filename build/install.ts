// This file fetches electron and node types for better development experience.
// The only assumption made here is `electron` binary is available in PATH.
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Remove warning on `shell: true` usage on Windows.
process.removeAllListeners('warning');

const electronBinaryPath = execFileSync('electron', ['-p', 'process.execPath'], {
  shell: process.platform === 'win32',
  env: { ELECTRON_RUN_AS_NODE: '1' },
  encoding: 'utf8'
}).trimEnd();

const electronPackagePath = join(electronBinaryPath, '..', '..', 'package.json');
if (existsSync(electronPackagePath)) {
  // Electron was installed by npm, it has types we can copy over.
  const electronTypesPath = join(electronBinaryPath, '..', '..', 'electron.d.ts');

  const nodeTypesPath = join(electronBinaryPath, '..', '..', 'node_modules', '@types', 'node');
  const repoRoot = join(import.meta.dirname, '..');

  // Copy electron types.
  const { name, version, types } = JSON.parse(readFileSync(electronPackagePath, 'utf8'));
  mkdirSync(join(repoRoot, 'node_modules', 'electron'), { recursive: true });
  writeFileSync(join(repoRoot, 'node_modules', 'electron', 'package.json'), JSON.stringify({ name, version, types }, null, 2) + '\n');
  writeFileSync(join(repoRoot, 'node_modules', 'electron', types), readFileSync(electronTypesPath));

  // Copy node types.
  mkdirSync(join(repoRoot, 'node_modules', '@types', 'node'), { recursive: true });
  cpSync(nodeTypesPath, join(repoRoot, 'node_modules', '@types', 'node'), { recursive: true });
  const { dependencies } = JSON.parse(readFileSync(join(nodeTypesPath, 'package.json'), 'utf8'));
  for (const depName in dependencies) {
    const depPath = join(nodeTypesPath, '..', '..', depName);
    cpSync(depPath, join(repoRoot, 'node_modules', depName), { recursive: true });
  }
} else {
  // Electron was installed by global binary, we need to fetch those types manually.
  console.error("I'm too lazy to implement fetch & extract tarball for now.");
  process.exit(1);
}

console.log('Done.');
