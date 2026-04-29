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
  'docs/runtime-stack-strategy.md',
  'docs/skill-system.md',
  'docs/unofficial-runtime-bridges.md',
  'docs/adapter-registry.md',
  'docs/install-scopes.md',
  'docs/capability-profile.md',
  'docs/adapters/claude-code.md',
  'docs/adapters/claude-app.md',
  'docs/adapters/generic-root.md',
];

const requiredSkills = [
  'skills/_template/SKILL.md',
  'skills/blendops-help/SKILL.md',
  'skills/render-export-evidence/SKILL.md',
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
  'third-party MCP',
];

const unofficialBridgeDoc = 'docs/unofficial-runtime-bridges.md';

const requiredUnofficialBridgeDisclaimers = [
  'not official Blender tooling',
  'not part of the BlendOps official runtime path',
  'not used for Draft v0 release-readiness claims',
  'user-managed',
  'experimental/local',
  'must not be counted as an official runtime eval',
  'not a substitute for the official runtime manual eval',
];

const requiredRuntimeStackSnippets = [
  'BlendOps public runtime guidance uses exactly three user-facing stacks',
  'Stack 1 — Claude Desktop official connector stack',
  'Stack 2 — Official Blender CLI fallback',
  'Stack 3 — Optional unofficial third-party bridge stack',
  'Direct official MCP use from Claude Code/OpenCode/Cursor/Codex/Gemini is not verified and is not currently a supported BlendOps route.',
];

const requiredArtifactEvidenceSnippets = [
  {
    file: 'laws/evidence-before-done.md',
    snippets: [
      'must not claim preview/render/GLB exists without evidence',
      'must not mark Ready if evidence is missing',
    ],
  },
  {
    file: 'docs/evals/README.md',
    snippets: [
      'Runtime artifacts remain Not Run/Not Produced unless a runtime eval record provides evidence',
      'Do not claim preview/render/GLB artifacts exist unless produced evidence is listed',
    ],
  },
  {
    file: 'docs/evals/official-runtime-verification-criteria.md',
    snippets: [
      'A transcript alone is not enough for runtime success',
      'Do not upgrade `Attempted` to `Produced` without generated file or visible output evidence',
    ],
  },
];

const requiredMarketplaceSnippets = [
  {
    file: 'docs/distribution-strategy.md',
    snippets: [
      'does not claim BlendOps is published in any marketplace',
      'Do not claim official marketplace listing until the listing is actually published and verified',
      'Do not claim availability until it is verified for the specific surface',
    ],
  },
  {
    file: 'docs/multi-agent-install-strategy.md',
    snippets: [
      'Do not claim a marketplace or plugin listing until the package is actually accepted, listed, and verified',
      'Marketplace/plugin install',
      'Future, do not claim now',
    ],
  },
];

const forbiddenOfficialDirectMcpRoutePatterns = [
  'Route B — Official MCP path for non-Claude Desktop agents',
  'Official MCP path for non-Claude Desktop agents',
  'standalone official MCP',
  'choose official direct MCP',
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

function scanPattern(files, pattern, label, allowlist = []) {
  for (const f of files) {
    if (allowlist.includes(f)) continue;
    const txt = fs.readFileSync(path.join(root, f), 'utf8');
    if (txt.includes(pattern)) {
      errors.push(`${label} found in active file: ${f} -> "${pattern}"`);
    }
  }
}

function assertContainsAll(relPath, snippets, label) {
  const txt = fs.readFileSync(path.join(root, relPath), 'utf8');
  for (const snippet of snippets) {
    if (!txt.includes(snippet)) {
      errors.push(`${label} missing required disclaimer in ${relPath}: "${snippet}"`);
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
for (const p of forbiddenCommunityPatterns) {
  scanPattern(activeMd, p, 'Forbidden community runtime pattern', [unofficialBridgeDoc]);
}
assertContainsAll(
  unofficialBridgeDoc,
  requiredUnofficialBridgeDisclaimers,
  'Unofficial bridge allowlist'
);
assertContainsAll(
  'docs/runtime-stack-strategy.md',
  requiredRuntimeStackSnippets,
  'Runtime stack policy'
);
for (const policy of requiredArtifactEvidenceSnippets) {
  assertContainsAll(policy.file, policy.snippets, 'Artifact evidence policy');
}
for (const policy of requiredMarketplaceSnippets) {
  assertContainsAll(policy.file, policy.snippets, 'Marketplace/plugin policy');
}
for (const p of forbiddenOfficialDirectMcpRoutePatterns) {
  scanPattern(activeMd, p, 'Forbidden official direct MCP route pattern', ['docs/archive']);
}

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
