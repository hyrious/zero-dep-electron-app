// This file fetches electron and node types for better development experience.
// The only assumption made here is `electron` binary is available in PATH.
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, writeFile, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Remove warning on `shell: true` usage on Windows.
process.removeAllListeners('warning');

const execPath = execFileSync('electron', ['-p', 'process.execPath'], {
  shell: process.platform === 'win32',
  env: { ELECTRON_RUN_AS_NODE: '1' },
  encoding: 'utf8'
}).trimEnd();

const electronPackagePath = join(execPath, '..', '..', 'package.json');
const electronTypesPath = join(execPath, '..', '..', 'electron.d.ts');

const nodeTypesPath = join(execPath, '..', '..', 'node_modules', '@types', 'node');
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

console.log('Done.');
