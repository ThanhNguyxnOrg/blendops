#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateCompatibilityMatrixObject } from './validate-compatibility-matrix.mjs';
import { validateCapabilityPolicyObject } from './validate-capability-policy.mjs';
import { checkBundleReferenceSummaries } from './generate-bundle-reference-summaries.mjs';
import {
  validateKnowledgeAndRecipeCatalogs,
  runCatalogRetrievalEvals,
} from './build-knowledge-catalog.mjs';
import { validateSkillsShConfig } from './install-skills.mjs';

const __filename = fileURLToPath(import.meta.url);
const root = process.cwd();
const errors = [];
const notes = [];

const requiredRootFiles = [
  'README.md',
  'TODO.md',
  'package.json',
  'scripts/export-claude-skills.mjs',
  'scripts/generate-bundle-reference-summaries.mjs',
  'scripts/install-skills.mjs',
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
  'docs/blender-version-compatibility.md',
  'docs/safety-model.md',
  'docs/adapter-registry.md',
  'docs/install-scopes.md',
  'docs/ai-agent-quickstart.md',
  'docs/ai-agent-install-flow.md',
  'docs/start-here.md',
  'docs/install/README.md',
  'docs/install/claude-desktop.md',
  'docs/install/claude-code.md',
  'docs/install/opencode.md',
  'docs/install/cursor.md',
  'docs/install/codex.md',
  'docs/install/gemini.md',
  'docs/install/antigravity.md',
  'docs/install/github-copilot.md',
  // MCP-first agents and local LLM runners:
  'docs/install/cline.md',
  'docs/install/continue.md',
  'docs/install/zed.md',
  'docs/install/goose.md',
  'docs/install/ollama.md',
  'docs/install/lm-studio.md',
  'docs/install/open-webui.md',
  // Additional MCP-aware coding agents:
  'docs/install/roo-code.md',
  'docs/install/windsurf.md',
  'docs/install/openhands.md',
  'docs/install/jetbrains-junie.md',
  'docs/install/blackbox-ai.md',
  'docs/install/augment-code.md',
  'docs/install/aider.md',
  'docs/install/trae.md',
  'docs/install/sourcegraph-cody.md',
  'docs/install/amazon-q-developer.md',
  'docs/install/generic-project.md',
  'docs/install/installer-spec.md',
  'docs/capability-profile.md',
  'docs/adapters/claude-code.md',
  'docs/adapters/claude-app.md',
  'docs/adapters/cursor.md',
  'docs/adapters/codex.md',
  'docs/adapters/opencode.md',
  'docs/adapters/generic-root.md',
  'docs/evals/adapter-install-v0-dry-run.md',
  'docs/evals/adapter-empirical-verification.md',
  'docs/evals/skill-package-upload-readiness-v0.md',
  'docs/knowledge-and-recipe-catalog.md',
  'docs/audits/skill-architecture-audit.md',
];

const requiredSkills = [
  'skills/_template/SKILL.md',
  'skills/blendops-start/SKILL.md',
  'skills/blendops-final-check/SKILL.md',
  'skills/blendops-connect-blender/SKILL.md',
  'skills/blendops-product-shot/SKILL.md',
  'skills/blendops-camera/SKILL.md',
  'skills/blendops-lighting-materials/SKILL.md',
  'skills/blendops-glb-web-handoff/SKILL.md',
  'skills/blendops-build/SKILL.md',
  'skills/blendops-look-check/SKILL.md',
  // Process and workflow discipline skills:
  'skills/blendops-brief/SKILL.md',
  'skills/blendops-fix-problems/SKILL.md',
  'skills/blendops-final-check/SKILL.md',
  'skills/blendops-assets/SKILL.md',
  'skills/blendops-connect-blender/SKILL.md',
  // Web 3D handoff deep:
  'skills/blendops-glb-budget/SKILL.md',
  'skills/blendops-glb-web-handoff/SKILL.md',
  'skills/blendops-build/SKILL.md',
  'skills/blendops-look-check/SKILL.md',
  'skills/blendops-final-check/SKILL.md',
  // Quality validation deep:
  'skills/blendops-lighting-materials/SKILL.md',
  'skills/blendops-camera/SKILL.md',
  'skills/blendops-glb-budget/SKILL.md',
  // Domain scene planners:
  'skills/blendops-scene-plan/SKILL.md',
  'skills/blendops-product-shot/SKILL.md',
  // Process discipline:
  'skills/blendops-done-criteria/SKILL.md',
  'skills/blendops-brief/SKILL.md',
  // Asset / sourcing:
  'skills/blendops-assets/SKILL.md',
  // Color / format / output decisions:
  'skills/blendops-lighting-materials/SKILL.md',
  'skills/blendops-render-settings/SKILL.md',
  'skills/blendops-camera/SKILL.md',
  // Recipe / pack operations:
  'skills/blendops-brief/SKILL.md',
  'skills/blendops-done-criteria/SKILL.md',
  'skills/blendops-start/SKILL.md',
  // Runtime path discipline:
  'skills/blendops-connect-blender/SKILL.md',
  'skills/blendops-final-check/SKILL.md',
];

const requiredSkillEvals = [
  'skills/blendops-start/EVAL.md',
  'skills/blendops-final-check/EVAL.md',
  'skills/blendops-connect-blender/EVAL.md',
  'skills/blendops-product-shot/EVAL.md',
  'skills/blendops-camera/EVAL.md',
  'skills/blendops-lighting-materials/EVAL.md',
  'skills/blendops-glb-web-handoff/EVAL.md',
  'skills/blendops-build/EVAL.md',
  'skills/blendops-look-check/EVAL.md',
  'skills/blendops-brief/EVAL.md',
  'skills/blendops-fix-problems/EVAL.md',
  'skills/blendops-assets/EVAL.md',
  // Web 3D handoff deep:
  'skills/blendops-glb-budget/EVAL.md',
  'skills/blendops-glb-web-handoff/EVAL.md',
  'skills/blendops-build/EVAL.md',
  'skills/blendops-look-check/EVAL.md',
  'skills/blendops-final-check/EVAL.md',
  // Quality validation deep:
  'skills/blendops-lighting-materials/EVAL.md',
  'skills/blendops-camera/EVAL.md',
  'skills/blendops-glb-budget/EVAL.md',
  // Domain scene planners:
  'skills/blendops-scene-plan/EVAL.md',
  'skills/blendops-product-shot/EVAL.md',
  // Process discipline:
  'skills/blendops-done-criteria/EVAL.md',
  'skills/blendops-brief/EVAL.md',
  // Asset / sourcing:
  'skills/blendops-assets/EVAL.md',
  // Color / format / output decisions:
  'skills/blendops-lighting-materials/EVAL.md',
  'skills/blendops-render-settings/EVAL.md',
  'skills/blendops-camera/EVAL.md',
  // Recipe / pack operations:
  'skills/blendops-brief/EVAL.md',
  'skills/blendops-done-criteria/EVAL.md',
  'skills/blendops-start/EVAL.md',
  // Runtime path discipline:
  'skills/blendops-connect-blender/EVAL.md',
  'skills/blendops-final-check/EVAL.md',
];

const requiredLaws = [
  'laws/official-runtime-only.md',
  'laws/no-arbitrary-python-interface.md',
  'laws/evidence-before-done.md',
  'laws/non-blender-user-language.md',
];

const requiredPack = ['packs/product-hero-v0/PACK.md'];

const requiredBundleFixture = [
  'bundles/generic-project-local/README.md',
  'bundles/generic-project-local/BLENDOPS.md',
  'bundles/generic-project-local/ROLLBACK.md',
  'bundles/generic-project-local/INSTALL_REPORT_TEMPLATE.md',
  'bundles/generic-project-local/manifest.json',
  'bundles/claude-desktop-manual/README.md',
  'bundles/claude-desktop-manual/IMPORT_STEPS.md',
  'bundles/claude-desktop-manual/SKILL.md',
  'bundles/claude-desktop-manual/BLENDOPS_SINGLE_FILE.md',
  'bundles/claude-desktop-manual/references/skill-map.md',
  'bundles/claude-desktop-manual/references/runtime-stacks.md',
  'bundles/claude-desktop-manual/references/evidence-rules.md',
  'bundles/claude-desktop-manual/references/install-boundary.md',
  'bundles/claude-desktop-manual/references/skills/blendops-start.md',
  'bundles/claude-desktop-manual/references/skills/blendops-brief.md',
  'bundles/claude-desktop-manual/references/skills/blendops-assets.md',
  'bundles/claude-desktop-manual/references/skills/blendops-connect-blender.md',
  'bundles/claude-desktop-manual/references/skills/blendops-product-shot.md',
  'bundles/claude-desktop-manual/references/skills/blendops-camera.md',
  'bundles/claude-desktop-manual/references/skills/blendops-lighting-materials.md',
  'bundles/claude-desktop-manual/references/skills/blendops-final-check.md',
  'bundles/claude-desktop-manual/references/skills/blendops-fix-problems.md',
  'bundles/claude-desktop-manual/references/skills/blendops-glb-web-handoff.md',
  'bundles/claude-desktop-manual/references/skills/blendops-build.md',
  'bundles/claude-desktop-manual/references/skills/blendops-look-check.md',
  // Web 3D handoff deep:
  'bundles/claude-desktop-manual/references/skills/blendops-glb-budget.md',
  'bundles/claude-desktop-manual/references/skills/blendops-glb-web-handoff.md',
  'bundles/claude-desktop-manual/references/skills/blendops-build.md',
  'bundles/claude-desktop-manual/references/skills/blendops-look-check.md',
  'bundles/claude-desktop-manual/references/skills/blendops-final-check.md',
  // Quality validation deep:
  'bundles/claude-desktop-manual/references/skills/blendops-lighting-materials.md',
  'bundles/claude-desktop-manual/references/skills/blendops-camera.md',
  'bundles/claude-desktop-manual/references/skills/blendops-glb-budget.md',
  // Domain scene planners:
  'bundles/claude-desktop-manual/references/skills/blendops-scene-plan.md',
  'bundles/claude-desktop-manual/references/skills/blendops-product-shot.md',
  // Process discipline:
  'bundles/claude-desktop-manual/references/skills/blendops-done-criteria.md',
  'bundles/claude-desktop-manual/references/skills/blendops-brief.md',
  // Asset / sourcing:
  'bundles/claude-desktop-manual/references/skills/blendops-assets.md',
  // Color / format / output decisions:
  'bundles/claude-desktop-manual/references/skills/blendops-lighting-materials.md',
  'bundles/claude-desktop-manual/references/skills/blendops-render-settings.md',
  'bundles/claude-desktop-manual/references/skills/blendops-camera.md',
  // Recipe / pack operations:
  'bundles/claude-desktop-manual/references/skills/blendops-brief.md',
  'bundles/claude-desktop-manual/references/skills/blendops-done-criteria.md',
  'bundles/claude-desktop-manual/references/skills/blendops-start.md',
  // Runtime path discipline:
  'bundles/claude-desktop-manual/references/skills/blendops-connect-blender.md',
  'bundles/claude-desktop-manual/references/skills/blendops-final-check.md',
  'bundles/claude-desktop-manual/references/laws/evidence-before-done.md',
  'bundles/claude-desktop-manual/references/laws/official-runtime-only.md',
  'bundles/claude-desktop-manual/references/laws/no-arbitrary-python-interface.md',
  'bundles/claude-desktop-manual/references/laws/non-blender-user-language.md',
  'bundles/claude-desktop-manual/references/packs/product-hero-v0.md',
  'bundles/claude-desktop-manual/INSTALL_REPORT_TEMPLATE.md',
  'bundles/claude-desktop-manual/manifest.json',
  'bundles/skill-package/README.md',
  'bundles/skill-package/blendops/SKILL.md',
  'bundles/skill-package/blendops/agents/openai.yaml',
  'bundles/skill-package/blendops/agents/README.md',
  'bundles/skill-package/blendops/references/skill-map.md',
  'bundles/skill-package/blendops/references/runtime-stacks.md',
  'bundles/skill-package/blendops/references/evidence-rules.md',
  'bundles/skill-package/blendops/references/install-boundary.md',
  'bundles/skill-package/blendops/references/skill-blendops-start.md',
  'bundles/skill-package/blendops/references/skill-blendops-final-check.md',
  'bundles/skill-package/blendops/references/skill-blendops-connect-blender.md',
  'bundles/skill-package/blendops/references/skill-blendops-product-shot.md',
  'bundles/skill-package/blendops/references/skill-blendops-camera.md',
  'bundles/skill-package/blendops/references/skill-blendops-lighting-materials.md',
  'bundles/skill-package/blendops/references/skill-blendops-glb-web-handoff.md',
  'bundles/skill-package/blendops/references/skill-blendops-build.md',
  'bundles/skill-package/blendops/references/skill-blendops-look-check.md',
  'bundles/skill-package/blendops/references/skill-blendops-brief.md',
  'bundles/skill-package/blendops/references/skill-blendops-fix-problems.md',
  'bundles/skill-package/blendops/references/skill-blendops-assets.md',
  // Web 3D handoff deep:
  'bundles/skill-package/blendops/references/skill-blendops-glb-budget.md',
  'bundles/skill-package/blendops/references/skill-blendops-glb-web-handoff.md',
  'bundles/skill-package/blendops/references/skill-blendops-build.md',
  'bundles/skill-package/blendops/references/skill-blendops-look-check.md',
  'bundles/skill-package/blendops/references/skill-blendops-final-check.md',
  // Quality validation deep:
  'bundles/skill-package/blendops/references/skill-blendops-lighting-materials.md',
  'bundles/skill-package/blendops/references/skill-blendops-camera.md',
  'bundles/skill-package/blendops/references/skill-blendops-glb-budget.md',
  // Domain scene planners:
  'bundles/skill-package/blendops/references/skill-blendops-scene-plan.md',
  'bundles/skill-package/blendops/references/skill-blendops-product-shot.md',
  // Process discipline:
  'bundles/skill-package/blendops/references/skill-blendops-done-criteria.md',
  'bundles/skill-package/blendops/references/skill-blendops-brief.md',
  // Asset / sourcing:
  'bundles/skill-package/blendops/references/skill-blendops-assets.md',
  // Color / format / output decisions:
  'bundles/skill-package/blendops/references/skill-blendops-lighting-materials.md',
  'bundles/skill-package/blendops/references/skill-blendops-render-settings.md',
  'bundles/skill-package/blendops/references/skill-blendops-camera.md',
  // Recipe / pack operations:
  'bundles/skill-package/blendops/references/skill-blendops-brief.md',
  'bundles/skill-package/blendops/references/skill-blendops-done-criteria.md',
  'bundles/skill-package/blendops/references/skill-blendops-start.md',
  // Runtime path discipline:
  'bundles/skill-package/blendops/references/skill-blendops-connect-blender.md',
  'bundles/skill-package/blendops/references/skill-blendops-final-check.md',
  'bundles/skill-package/blendops/references/law-evidence-before-done.md',
  'bundles/skill-package/blendops/references/law-official-runtime-only.md',
  'bundles/skill-package/blendops/references/law-no-arbitrary-python-interface.md',
  'bundles/skill-package/blendops/references/law-non-blender-user-language.md',
  'bundles/skill-package/blendops/references/pack-product-hero-v0.md',
  'bundles/skill-package/blendops/LICENSE.txt',
];

export const REQUIRED_CORE_SKILL_HEADINGS = [
  'Purpose',
  'When to use',
  'When not to use',
  'Trigger phrases',
  'Official runtime boundary',
  'Mode handling',
  'Validation checklist',
  'Pass / Warn / Fail rubric',
  'Cross-skill handoff',
];

export const REQUIRED_EXTENDED_SKILL_HEADINGS = [
  'Decision tree',
  'Playbooks',
  'Failure handling',
  'Troubleshooting',
  'Best practices',
  'Good examples',
  'Bad examples',
  'User-facing response template',
  'Anti-patterns',
];

export const REQUIRED_SKILL_HEADINGS = [
  ...REQUIRED_CORE_SKILL_HEADINGS,
  ...REQUIRED_EXTENDED_SKILL_HEADINGS,
];

const requiredSkillHeadings = REQUIRED_SKILL_HEADINGS.map((h) => `## ${h}`);

const forbiddenLegacyPatterns = [
  'blendops bridge',
  'apps/mcp-server',
  'apps/blender-addon',
  'npm run uat',
  'node apps/cli',
];

// Note: this allowlist used to ban any mention of `mcp-for-blender` (formerly
// `blender-mcp`) outside docs/unofficial-runtime-bridges.md. That ban created a
// contradictory state because the only currently user-verified runtime path uses
// `mcp-for-blender`, and Blender's own MCP ecosystem treats it as canonical prior
// art (30.7k stars as of 2026-10-13; repo `ahujasid/mcp-for-blender`; the
// practical path for non-Claude MCP clients). The 2-path + CLI appendix runtime
// model (see docs/runtime-stack-strategy.md) now lets these terms appear in
// runtime-stack-strategy, external-runtime-setup, install docs, smoke-test
// attribution, and the README glossary. We keep a narrower forbidden list:
// nothing here for now, but the slot is preserved for future bans.
const forbiddenCommunityPatterns = [];

const unofficialBridgeDoc = 'docs/unofficial-runtime-bridges.md';

// Path 2 disclaimer set. The community `mcp-for-blender` is mature prior
// art (30.7k stars as of 2026-10-13) and IS one of the canonical BlendOps
// runtime paths — but it is third-party from both Anthropic and the Blender
// Foundation. The disclaimer set guards what stays true: third-party
// provenance, manual config burden, the unsandboxed Python execution surface,
// and the "no formal eval record yet" evidence gap.
const requiredUnofficialBridgeDisclaimers = [
  'Path 2',
  'mcp-for-blender',
  'Not yet covered by a formal BlendOps eval evidence record',
  'Not used for BlendOps release-readiness claims',
  'User-managed',
  'must not be counted as an official runtime eval',
  'not a substitute for the official runtime manual eval',
  'Single-bridge constraint',
  'execute_blender_code',
];

// 2-path + CLI appendix runtime model (replaces the older 3-stack and 4-route
// drafts that mis-described how the Anthropic Connector relates to Blender Lab
// MCP). Path 1 = Lab MCP add-on/server in Blender 5.1+, hosted from either the
// Anthropic Connector (host a) or a manual MCP client (host b) — the Connector
// is NOT standalone. Path 2 = community mcp-for-blender. CLI fallback is
// an appendix documented upstream as a first-class Blender CLI surface, with
// a scoped mech-prop eval record that does not verify either MCP path. Path 1 + Path 2
// are user-reported verified by the repo owner with no formal in-repo evidence
// file yet. See docs/runtime-stack-strategy.md for the canonical write-up.
const requiredRuntimeStackSnippets = [
  'BlendOps recognizes **two MCP execution paths** plus a **CLI fallback appendix**',
  'Path 1 — Official Blender Lab MCP',
  'Connector is not standalone',
  'install an add-on inside Blender',
  'Path 2 — Community',
  'mcp-for-blender',
  'CLI fallback',
  'first-class',
  '](./evals/cli-fallback-mech-prop.md)',
];

const requiredArtifactEvidenceSnippets = [
  {
    file: 'docs/start-here.md',
    snippets: ['](./evals/cli-fallback-mech-prop.md)'],
  },
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

const requiredInstallerSpecSnippets = [
  '`scripts/install-skills.mjs` is implemented as the local repository installer',
  'The public npm package is live as [`blendops@1.0.0`](https://www.npmjs.com/package/blendops)',
  'The GitHub Agent Skills source is also [listed on skills.sh](https://www.skills.sh/ThanhNguyxnOrg/blendops)',
  'npx skills add ThanhNguyxnOrg/blendops',
  '--rollback',
  'does not install Blender',
  'does not run Blender or runtime eval',
  'Runtime status remains `Not Run`.',
  'Artifact status remains `Not Produced`.',
];

const requiredReadmeGuardSnippets = [
  'Use in 30 seconds',
  'AI Agent Quickstart',
  'separate ZIPs from skills/*/SKILL.md',
  'project-locally',
  'runtime%20eval-Not%20Run',
  'artifacts-Not%20Produced',
  'runtime status',
  'artifact status',
];

const forbiddenStaleDocsCollectionPatterns = [
  'docs/skills',
  'docs/laws',
  'docs/packs',
  'runtime-route-strategy',
];

const forbiddenDocsRelativeRootCollectionLinkPatterns = [
  '](./skills/',
  '](./laws/',
  '](./packs/',
];

// Note: previous bans on "standalone official MCP" / "Route B — Official MCP path
// for non-Claude Desktop agents" were dropped. Blender Foundation's own MCP
// Server (`bpype/blender_mcp` at blender.org/lab/mcp-server/) IS an official MCP
// that any MCP client can configure. The 2-path + CLI appendix runtime model
// names it Path 1 host option (b) explicitly. The remaining ban guards the older naming that
// implied "official MCP route" was forbidden conceptually.
const forbiddenOfficialDirectMcpRoutePatterns = [
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

function assertMissing(relPath, type = 'path') {
  const abs = path.join(root, relPath);
  if (fs.existsSync(abs)) {
    errors.push(`Unexpected ${type} exists: ${relPath}`);
  }
}

function assertUploadSkillFrontmatterMinimal(relPath) {
  const txt = fs.readFileSync(path.join(root, relPath), 'utf8');
  const match = txt.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) {
    errors.push(`Missing upload package SKILL.md frontmatter: ${relPath}`);
    return;
  }
  const frontmatter = match[1];
  for (const forbidden of ['version:', 'status:']) {
    if (frontmatter.includes(forbidden)) {
      errors.push(`Upload package SKILL.md frontmatter must not include ${forbidden} ${relPath}`);
    }
  }
  for (const required of ['name: blendops', 'description:']) {
    if (!frontmatter.includes(required)) {
      errors.push(`Upload package SKILL.md frontmatter missing ${required} ${relPath}`);
    }
  }
}

// Anthropic Skills spec defines only `name` and `description` as required (and optional
// keys like `license`/`allowed-tools`/`dependencies`). Reject custom fields like
// `version`, `status`, `tags` in any SKILL.md that ships in an upload ZIP, so the
// project does not accidentally re-introduce non-spec frontmatter.
// Source: https://support.anthropic.com/en/articles/12512198-creating-custom-skills
function assertSkillFrontmatterSpecCompliant(relPath) {
  const txt = fs.readFileSync(path.join(root, relPath), 'utf8');
  const match = txt.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) {
    errors.push(`Missing SKILL.md frontmatter: ${relPath}`);
    return;
  }
  const frontmatter = match[1];
  const forbiddenKeys = ['version', 'status', 'tags'];
  for (const key of forbiddenKeys) {
    const re = new RegExp(`^${key}:`, 'm');
    if (re.test(frontmatter)) {
      errors.push(
        `Non-spec frontmatter key '${key}:' in ${relPath} (Anthropic Skills spec defines only name + description)`,
      );
    }
  }
}

// Check Anthropic Skills upload limits: name <=64, description <=200 (claude.ai UI limit).
// Source: https://support.anthropic.com/en/articles/12512198-creating-custom-skills
function assertSkillFrontmatterUploadLimits(relPath, opts = {}) {
  const { maxDescription = 200 } = opts;
  const txt = fs.readFileSync(path.join(root, relPath), 'utf8');
  const match = txt.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return;
  const fm = match[1];
  const nameMatch = fm.match(/^name:\s*(.*)$/m);
  const descMatch = fm.match(/^description:\s*(.*)$/m);
  if (nameMatch) {
    const name = nameMatch[1].trim();
    if (name.length > 64) {
      errors.push(`Skill 'name' >64 chars (Anthropic limit) in ${relPath}: ${name.length} chars`);
    }
    if (!/^[a-z0-9-]+$/.test(name)) {
      errors.push(`Skill 'name' must be lowercase letters/numbers/hyphens only in ${relPath}: '${name}'`);
    }
  }
  if (descMatch) {
    const desc = descMatch[1].trim();
    if (desc.length > maxDescription) {
      errors.push(
        `Skill 'description' >${maxDescription} chars (Claude.ai upload limit) in ${relPath}: ${desc.length} chars`,
      );
    }
    if (desc.length < 10) {
      errors.push(`Skill 'description' too short (<10 chars) in ${relPath}`);
    }
  }
}

// Check OpenAI Skills yaml limits: short_description 25-64 chars, strings should be quoted.
// Source: https://github.com/openai/skills (skill-creator references/openai_yaml.md)
function assertOpenAiSkillYaml(relPath) {
  const txt = fs.readFileSync(path.join(root, relPath), 'utf8');
  const sdMatch = txt.match(/short_description:\s*"?([^"\n]*)"?/);
  if (!sdMatch) {
    errors.push(`OpenAI skill yaml missing short_description: ${relPath}`);
    return;
  }
  const sd = sdMatch[1].trim().replace(/^"|"$/g, '');
  if (sd.length < 25 || sd.length > 64) {
    errors.push(
      `OpenAI yaml short_description must be 25-64 chars (got ${sd.length}) in ${relPath}: "${sd}"`,
    );
  }
}

// Check relative markdown link existence (lightweight, scoped to *.md and *.html targets).
function assertRelativeLinksExist(files) {
  const linkRe = /\[([^\]]+)\]\(([^)]+)\)/g;
  for (const f of files) {
    const txt = fs.readFileSync(path.join(root, f), 'utf8');
    let m;
    while ((m = linkRe.exec(txt)) !== null) {
      let target = m[2].trim();
      if (target.startsWith('http://') || target.startsWith('https://') || target.startsWith('mailto:')) continue;
      if (target.startsWith('#')) continue;
      target = target.split('#')[0].split('?')[0];
      if (!target) continue;
      const abs = path.resolve(path.dirname(path.join(root, f)), target);
      if (!fs.existsSync(abs)) {
        errors.push(`Broken relative link in ${f}: "${m[2]}" (resolves to ${path.relative(root, abs).replaceAll('\\', '/')})`);
      }
    }
  }
}

export function extractNormalizedLevel2Headings(markdownText) {
  const masked = String(markdownText || '').replace(/<!--[\s\S]*?-->/g, (comment) =>
    comment.replace(/[^\r\n]/g, ' '),
  );
  const lines = masked.split(/\r?\n/);
  const headings = [];
  const counts = new Map();
  const sectionBodies = new Map();

  let inFence = false;
  let fenceChar = '';
  let fenceLen = 0;
  let currentHeading = null;
  let currentBodyLines = [];

  function flushCurrentSection() {
    if (currentHeading !== null && !sectionBodies.has(currentHeading)) {
      sectionBodies.set(currentHeading, currentBodyLines.join('\n').trim());
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fenceMatch = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (fenceMatch) {
      const marker = fenceMatch[1];
      const char = marker[0];
      const len = marker.length;
      if (!inFence) {
        inFence = true;
        fenceChar = char;
        fenceLen = len;
      } else if (char === fenceChar && len >= fenceLen) {
        inFence = false;
        fenceChar = '';
        fenceLen = 0;
      }
      if (currentHeading !== null) {
        currentBodyLines.push(line);
      }
      continue;
    }

    if (!inFence) {
      const h2Match = line.match(/^##\s+(.+?)\s*$/);
      if (h2Match) {
        flushCurrentSection();
        const normalizedTitle = h2Match[1].trim().replace(/\s+/g, ' ');
        headings.push(normalizedTitle);
        counts.set(normalizedTitle, (counts.get(normalizedTitle) || 0) + 1);
        currentHeading = normalizedTitle;
        currentBodyLines = [];
        continue;
      }
    }

    if (currentHeading !== null) {
      currentBodyLines.push(line);
    }
  }

  flushCurrentSection();

  return {
    headings,
    counts,
    sectionBodies,
  };
}

export function validateSkillMarkdownStructure(
  skillFileRel,
  markdownText,
  { isTemplate = false } = {},
) {
  const extracted = extractNormalizedLevel2Headings(markdownText);
  const localErrors = [];

  for (const title of REQUIRED_SKILL_HEADINGS) {
    const count = extracted.counts.get(title) || 0;
    if (count === 0) {
      localErrors.push(`Missing required heading in ${skillFileRel}: ## ${title}`);
    } else if (count > 1) {
      localErrors.push(
        `Duplicate required heading in ${skillFileRel}: ## ${title} (found ${count} times)`,
      );
    }
  }

  if (!isTemplate) {
    for (const title of REQUIRED_EXTENDED_SKILL_HEADINGS) {
      const count = extracted.counts.get(title) || 0;
      if (count === 1) {
        const body = (extracted.sectionBodies.get(title) || '').trim();
        if (body.length === 0) {
          localErrors.push(`Empty required extended section in ${skillFileRel}: ## ${title}`);
        }
      }
    }
  }

  return {
    ok: localErrors.length === 0,
    errors: localErrors,
    headings: extracted.headings,
    counts: extracted.counts,
    sectionBodies: extracted.sectionBodies,
  };
}

export function runDocsCheck(targetRoot = root) {
  errors.length = 0;
  notes.length = 0;

  for (const f of requiredRootFiles) assertExists(f, 'file');
  for (const d of requiredRootDirs) assertExists(d, 'dir');
  for (const f of requiredDocs) assertExists(f, 'file');
  for (const f of requiredSkills) assertExists(f, 'file');
  for (const f of requiredSkillEvals) assertExists(f, 'file');
  for (const f of requiredLaws) assertExists(f, 'file');
  for (const f of requiredPack) assertExists(f, 'file');
  for (const f of requiredBundleFixture) assertExists(f, 'file');

  assertUploadSkillFrontmatterMinimal('bundles/skill-package/blendops/SKILL.md');
  assertSkillFrontmatterUploadLimits('bundles/skill-package/blendops/SKILL.md');
  assertSkillFrontmatterSpecCompliant('bundles/skill-package/blendops/SKILL.md');
  assertSkillFrontmatterUploadLimits('bundles/claude-desktop-manual/SKILL.md');
  assertSkillFrontmatterSpecCompliant('bundles/claude-desktop-manual/SKILL.md');
  assertOpenAiSkillYaml('bundles/skill-package/blendops/agents/openai.yaml');
  assertMissing('bundles/claude-desktop-manual/blendops', 'directory');
  assertMissing('apps', 'directory');
  assertMissing('packages', 'directory');
  assertMissing('tsconfig.base.json', 'file');

  const expectedCatalogSkillPaths = requiredSkills
    .filter((s) => !s.endsWith('/_template/SKILL.md'))
    .slice()
    .sort();
  const discoveredCatalogSkillPaths = fs
    .readdirSync(path.join(targetRoot, 'skills'), { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== '_template')
    .map((d) => `skills/${d.name}/SKILL.md`)
    .filter((rel) => fs.existsSync(path.join(targetRoot, rel)))
    .sort();

  for (const discovered of discoveredCatalogSkillPaths) {
    if (!expectedCatalogSkillPaths.includes(discovered)) {
      errors.push(`Unregistered catalog skill directory on disk: ${discovered}`);
    }
  }

  for (const skillFile of requiredSkills) {
    const absSkillPath = path.join(targetRoot, skillFile);
    if (!fs.existsSync(absSkillPath)) continue;
    const txt = fs.readFileSync(absSkillPath, 'utf8');
    const isTemplate = skillFile.endsWith('/_template/SKILL.md');
    const structRes = validateSkillMarkdownStructure(skillFile, txt, { isTemplate });
    for (const err of structRes.errors) {
      errors.push(err);
    }
    if (!isTemplate) {
      assertSkillFrontmatterUploadLimits(skillFile);
      assertSkillFrontmatterSpecCompliant(skillFile);
    }
  }

  const activeMd = ['README.md', 'TODO.md'];
  walkMarkdownFiles('docs', activeMd);
  walkMarkdownFiles('skills', activeMd);
  walkMarkdownFiles('laws', activeMd);
  walkMarkdownFiles('packs', activeMd);
  walkMarkdownFiles('skill-reviews', activeMd);

  const docsMd = activeMd.filter((f) => f.startsWith('docs/'));

  for (const p of forbiddenLegacyPatterns) scanPattern(activeMd, p, 'Forbidden legacy runtime pattern');
  for (const p of forbiddenStaleDocsCollectionPatterns) {
    scanPattern(activeMd, p, 'Forbidden stale docs collection reference');
  }
  for (const p of forbiddenDocsRelativeRootCollectionLinkPatterns) {
    scanPattern(docsMd, p, 'Forbidden docs-relative root collection link');
  }
  for (const p of forbiddenCommunityPatterns) {
    scanPattern(activeMd, p, 'Forbidden community runtime pattern', [unofficialBridgeDoc]);
  }
  assertContainsAll(
    unofficialBridgeDoc,
    requiredUnofficialBridgeDisclaimers,
    'Unofficial bridge allowlist',
  );
  assertContainsAll(
    'docs/runtime-stack-strategy.md',
    requiredRuntimeStackSnippets,
    'Runtime stack policy',
  );
  for (const policy of requiredArtifactEvidenceSnippets) {
    assertContainsAll(policy.file, policy.snippets, 'Artifact evidence policy');
  }
  for (const policy of requiredMarketplaceSnippets) {
    assertContainsAll(policy.file, policy.snippets, 'Marketplace/plugin policy');
  }
  assertContainsAll(
    'docs/install/installer-spec.md',
    requiredInstallerSpecSnippets,
    'Future installer spec policy',
  );
  assertContainsAll(
    'README.md',
    requiredReadmeGuardSnippets,
    'Root README universal prompt policy',
  );
  for (const p of forbiddenOfficialDirectMcpRoutePatterns) {
    scanPattern(activeMd, p, 'Forbidden official direct MCP route pattern', ['docs/archive']);
  }

  for (const ref of requiredOfficialRefs) {
    if (!ensureRefExists(activeMd, ref)) {
      errors.push(`Missing required official runtime reference in active files: ${ref}`);
    }
  }

  // Link existence check across active markdown files.
  assertRelativeLinksExist(activeMd);

  // The Blender 5.1+ requirement is bound to Path 1 because the Lab MCP add-on
  // inside Blender declares blender_version_min = 5.1.0. It applies to BOTH
  // Path 1 host options (Anthropic Connector and manual MCP client) — the
  // Anthropic Connector is NOT standalone. Each user-facing runtime doc must
  // state both Blender 5.1+ AND Path 1 so the floor cannot drift back to a
  // per-host claim.
  const blenderVersionRequiredFiles = [
    'README.md',
    'docs/external-runtime-setup.md',
    'docs/install/claude-desktop.md',
  ];
  for (const f of blenderVersionRequiredFiles) {
    const txt = fs.readFileSync(path.join(targetRoot, f), 'utf8');
    if (!txt.includes('Blender 5.1')) {
      errors.push(`Missing Blender 5.1+ requirement note in ${f}`);
    }
    if (!txt.includes('Path 1')) {
      errors.push(`Missing Path 1 (Blender Lab MCP) attribution for the 5.1+ requirement in ${f}`);
    }
    if (!txt.includes('Lab')) {
      errors.push(`Missing Blender Lab MCP context for the 5.1+ requirement in ${f}`);
    }
  }

  // Enforce separation between Runtime status ('Not Run') and Artifact status ('Not Produced').
  // Schema declarations must never assign 'Not Run' to 'Artifact status:', while still permitting
  // negative examples in '## Anti-patterns' that warn against using `Artifact status: Not Run`.
  for (const skillFile of requiredSkills) {
    const txt = fs.readFileSync(path.join(targetRoot, skillFile), 'utf8');
    const lines = txt.split(/\r?\n/);
    let currentHeading = '';
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const hMatch = line.match(/^##\s+(.+?)\s*$/);
      if (hMatch) {
        currentHeading = hMatch[1].trim();
        continue;
      }
      if (currentHeading === 'Anti-patterns') continue;
      if (/^\s*(?:[-*]\s+)?Artifact status:\s*<?Not Run\b/i.test(line)) {
        errors.push(
          `Truth-state violation in ${skillFile}:${i + 1} ('Not Run' is a Runtime state, not an Artifact state): "${line.trim()}"`,
        );
      }
    }
  }

  // Ensure docs/adapter-registry.md stays synchronized with all install targets.
  const adapterRegistryTxt = fs.readFileSync(
    path.join(targetRoot, 'docs/adapter-registry.md'),
    'utf8',
  );
  const futureCandidatesSectionMatch = adapterRegistryTxt.match(
    /## Future candidates \(not researched\)([\s\S]*?)(?=\r?\n## |$)/,
  );
  if (futureCandidatesSectionMatch) {
    const futureTxt = futureCandidatesSectionMatch[1];
    for (const staleName of ['Windsurf', 'Continue', 'Cline', 'Roo', 'Aider']) {
      if (new RegExp(`\\b${staleName}\\b`, 'i').test(futureTxt)) {
        errors.push(
          `Stale entry '${staleName}' listed under 'Future candidates (not researched)' in docs/adapter-registry.md despite shipping an install doc in docs/install/`,
        );
      }
    }
  }

  // Validate runtime-capability-policy.json and compatibility-matrix.json
  const capPolicyPath = path.join(targetRoot, 'registry/runtime-capability-policy.json');
  if (!fs.existsSync(capPolicyPath)) {
    errors.push('Missing registry/runtime-capability-policy.json');
  } else {
    try {
      const capObj = JSON.parse(fs.readFileSync(capPolicyPath, 'utf8'));
      const capVal = validateCapabilityPolicyObject(capObj, { rootDir: targetRoot });
      for (const e of capVal.errors) errors.push(`runtime-capability-policy.json: ${e}`);
    } catch (err) {
      errors.push(`Invalid JSON in registry/runtime-capability-policy.json: ${err.message}`);
    }
  }

  const compatMatrixPath = path.join(targetRoot, 'registry/compatibility-matrix.json');
  if (!fs.existsSync(compatMatrixPath)) {
    errors.push('Missing registry/compatibility-matrix.json');
  } else {
    try {
      const matObj = JSON.parse(fs.readFileSync(compatMatrixPath, 'utf8'));
      const matVal = validateCompatibilityMatrixObject(matObj, { rootDir: targetRoot });
      for (const e of matVal.errors) errors.push(`compatibility-matrix.json: ${e}`);
    } catch (err) {
      errors.push(`Invalid JSON in registry/compatibility-matrix.json: ${err.message}`);
    }
  }

  // Verify deterministic bundle reference summaries (30 generated files + manifest sync)
  const bundleSummaryCheck = checkBundleReferenceSummaries(targetRoot);
  if (!bundleSummaryCheck.ok) {
    for (const e of bundleSummaryCheck.errors) {
      errors.push(`bundle-summaries: ${e}`);
    }
  }

  // Validate knowledge & recipe catalogs and retrieval evaluation suite
  const catalogSourcesPath = path.join(targetRoot, 'registry/knowledge-sources.json');
  if (fs.existsSync(catalogSourcesPath)) {
    const catValidation = validateKnowledgeAndRecipeCatalogs(targetRoot);
    if (!catValidation.valid) {
      for (const e of catValidation.errors) {
        errors.push(`knowledge-recipe-catalog: ${e}`);
      }
    }
    const evalFilePath = path.join(targetRoot, 'evals/catalog-retrieval-evals.json');
    if (fs.existsSync(evalFilePath)) {
      const catEval = runCatalogRetrievalEvals(targetRoot);
      if (!catEval.passed) {
        for (const f of catEval.failures) {
          errors.push(`catalog-retrieval-eval: ${f}`);
        }
      }
    }
  }

  const skillsShPath = path.join(targetRoot, 'skills.sh.json');
  if (fs.existsSync(skillsShPath)) {
    const shVal = validateSkillsShConfig(targetRoot);
    if (!shVal.valid) {
      for (const e of shVal.errors) {
        errors.push(`skills.sh.json: ${e}`);
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors: [...errors],
    activeMarkdownCount: activeMd.length,
    catalogSkillCount: discoveredCatalogSkillPaths.length,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  console.log('Running docs:check...');
  const res = runDocsCheck(root);
  if (!res.ok) {
    console.error('\nDocs check failed with the following issues:');
    for (const e of res.errors) console.error(`- ${e}`);
    process.exit(1);
  }
  console.log('docs:check passed');
  console.log(`Checked ${res.activeMarkdownCount} active markdown files (docs/archive excluded).`);
  process.exit(0);
}
