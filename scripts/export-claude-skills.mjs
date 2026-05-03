#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const skillsDir = path.join(root, 'skills');
const outRoot = path.join(root, 'dist', 'claude-skills');
const desktopDir = path.join(outRoot, 'desktop-zips');
const codeDir = path.join(outRoot, 'claude-code-skills');

function rmrf(target) {
  fs.rmSync(target, { recursive: true, force: true });
}

function mkdirp(target) {
  fs.mkdirSync(target, { recursive: true });
}

function copyDir(src, dest) {
  fs.cpSync(src, dest, { recursive: true });
}

function zipDir(srcDir, zipPath) {
  const parent = path.dirname(srcDir);
  const folder = path.basename(srcDir);

  if (process.platform === 'win32') {
    execFileSync(
      'powershell.exe',
      [
        '-NoProfile',
        '-Command',
        `Compress-Archive -Path ${JSON.stringify(path.join(parent, folder))} -DestinationPath ${JSON.stringify(zipPath)} -Force`,
      ],
      { stdio: 'pipe' },
    );
    return;
  }

  execFileSync('zip', ['-qr', zipPath, folder], { cwd: parent, stdio: 'pipe' });
}

function listSkillDirs() {
  return fs
    .readdirSync(skillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => name !== '_template')
    .filter((name) => fs.existsSync(path.join(skillsDir, name, 'SKILL.md')))
    .sort();
}

if (!fs.existsSync(skillsDir)) {
  console.error(`Missing skills directory: ${skillsDir}`);
  process.exit(1);
}

rmrf(outRoot);
mkdirp(desktopDir);
mkdirp(codeDir);

const skillNames = listSkillDirs();

for (const name of skillNames) {
  const src = path.join(skillsDir, name);
  const codeDest = path.join(codeDir, name);
  copyDir(src, codeDest);
  zipDir(codeDest, path.join(desktopDir, `${name}.zip`));
}

const manifest = {
  generatedAt: new Date().toISOString(),
  source: 'skills/*/SKILL.md',
  skillCount: skillNames.length,
  outputs: {
    claudeDesktop: 'dist/claude-skills/desktop-zips/*.zip',
    claudeCode: 'dist/claude-skills/claude-code-skills/*/SKILL.md',
  },
  skills: skillNames,
};

fs.writeFileSync(path.join(outRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`Exported ${skillNames.length} Claude skill zips to ${path.relative(root, desktopDir)}`);
console.log(`Exported ${skillNames.length} Claude Code skill folders to ${path.relative(root, codeDir)}`);
