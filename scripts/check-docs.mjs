#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const notes = [];

const requiredRootFiles = [
  'README.md',
  'TODO.md',
  'package.json',
];

const requiredRootDirs = [
  'docs',
  'skills',
  'laws',
  'packs',
];

const requiredDocs = [
  'docs/external-runtime-setup.md',
  'docs/reference-runtime.md',
  'docs/adapter-registry.md',
  'docs/install-scopes.md',
  'docs/capability-profile.md',
  'docs/adapters/claude-code.md',
  'docs/adapters/claude-app.md',
  'docs/adapters/generic-root.md',
];

const requiredSkills = [
  'skills/official-runtime-setup-guide/SKILL.md',
  'skills/official-runtime-readiness-checker/SKILL.md',
  'skills/product-hero-scene-planner/SKILL.md',
  'skills/blender-composition-camera-planner/SKILL.md',
  'skills/blender-lighting-material-planner/SKILL.md',
  'skills/blender-scene-quality-checker/SKILL.md',
  'skills/glb-web-handoff/SKILL.md',
  'skills/non-blender-user-response-writer/SKILL.md',
];

const requiredLaws = [
  'laws/official-runtime-only.md',
  'laws/no-arbitrary-python-interface.md',
  'laws/evidence-before-done.md',
  'laws/non-blender-user-language.md',
];

const requiredPack = ['packs/product-hero-v0/PACK.md'];

const requiredSkillHeadings = [
  '## Purpose',
  '## When to use',
  '## When not to use',
  '## Trigger phrases',
  '## Official runtime boundary',
  '## Mode handling',
  '## Validation checklist',
  '## Pass / Warn / Fail rubric',
  '## Cross-skill handoff',
];

const forbiddenLegacyPatterns = [
  'blendops bridge',
  'apps/mcp-server',
  'apps/blender-addon',
  'npm run uat',
  'node apps/cli',
];

const forbiddenCommunityPatterns = [
  'ahujasid/blender-mcp',
  'uvx blender-mcp',
  'community MCP',
];

const requiredOfficialRefs = [
  'https://www.blender.org/lab/mcp-server/',
  'https://claude.com/resources/tutorials/using-the-blender-connector-in-claude',
  'https://docs.blender.org/manual/en/latest/advanced/command_line/index.html',
];

function exists(relPath) {
  return fs.existsSync(path.join(root, relPath));
}

function assertExists(relPath, type = 'file') {
  const abs = path.join(root, relPath);
  if (!fs.existsSync(abs)) {
    errors.push(`Missing required ${type}: ${relPath}`);
    return;
  }
  const stat = fs.statSync(abs);
  if (type === 'file' && !stat.isFile()) {
    errors.push(`Expected file but found non-file: ${relPath}`);
  }
  if (type === 'dir' && !stat.isDirectory()) {
    errors.push(`Expected directory but found non-directory: ${relPath}`);
  }
}

function walkMarkdownFiles(dirRel, out) {
  const abs = path.join(root, dirRel);
  if (!fs.existsSync(abs)) return;
  for (const ent of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = path.join(dirRel, ent.name).replaceAll('\\', '/');
    if (ent.isDirectory()) {
      if (rel.startsWith('docs/archive')) continue;
      walkMarkdownFiles(rel, out);
    } else if (ent.isFile() && rel.endsWith('.md')) {
      out.push(rel);
    }
  }
}

function scanPattern(files, pattern, label) {
  for (const f of files) {
    const txt = fs.readFileSync(path.join(root, f), 'utf8');
    if (txt.includes(pattern)) {
      errors.push(`${label} found in active file: ${f} -> "${pattern}"`);
    }
  }
}

function ensureRefExists(files, ref) {
  for (const f of files) {
    const txt = fs.readFileSync(path.join(root, f), 'utf8');
    if (txt.includes(ref)) return true;
  }
  return false;
}

console.log('Running docs:check...');

for (const f of requiredRootFiles) assertExists(f, 'file');
for (const d of requiredRootDirs) assertExists(d, 'dir');
for (const f of requiredDocs) assertExists(f, 'file');
for (const f of requiredSkills) assertExists(f, 'file');
for (const f of requiredLaws) assertExists(f, 'file');
for (const f of requiredPack) assertExists(f, 'file');

for (const skillFile of requiredSkills) {
  const txt = fs.readFileSync(path.join(root, skillFile), 'utf8');
  for (const heading of requiredSkillHeadings) {
    if (!txt.includes(heading)) {
      errors.push(`Missing required heading in ${skillFile}: ${heading}`);
    }
  }
}

const activeMd = ['README.md', 'TODO.md'];
walkMarkdownFiles('docs', activeMd);
walkMarkdownFiles('skills', activeMd);
walkMarkdownFiles('laws', activeMd);
walkMarkdownFiles('packs', activeMd);
walkMarkdownFiles('skill-reviews', activeMd);

for (const p of forbiddenLegacyPatterns) scanPattern(activeMd, p, 'Forbidden legacy runtime pattern');
for (const p of forbiddenCommunityPatterns) scanPattern(activeMd, p, 'Forbidden community runtime pattern');

for (const ref of requiredOfficialRefs) {
  if (!ensureRefExists(activeMd, ref)) {
    errors.push(`Missing required official runtime reference in active files: ${ref}`);
  }
}

if (errors.length > 0) {
  console.error('\nDocs check failed with the following issues:');
  for (const e of errors) console.error(`- ${e}`);
  process.exit(1);
}

console.log('docs:check passed');
console.log(`Checked ${activeMd.length} active markdown files (docs/archive excluded).`);
process.exit(0);
