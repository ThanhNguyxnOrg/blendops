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
  'scripts/export-claude-skills.mjs',
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
  // Phase 4 agent expansion: MCP-first agents + local LLM runners
  'docs/install/cline.md',
  'docs/install/continue.md',
  'docs/install/zed.md',
  'docs/install/goose.md',
  'docs/install/ollama.md',
  'docs/install/lm-studio.md',
  'docs/install/open-webui.md',
  'docs/install/generic-project.md',
  'docs/install/installer-spec.md',
  'docs/capability-profile.md',
  'docs/adapters/claude-code.md',
  'docs/adapters/claude-app.md',
  'docs/adapters/generic-root.md',
  'docs/evals/skill-package-upload-readiness-v0.md',
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
  // Phase 4 process / discipline / domain skills (Superpowers + BMad inspired):
  'skills/blender-brainstorming/SKILL.md',
  'skills/blender-troubleshooting/SKILL.md',
  'skills/pre-handoff-verification/SKILL.md',
  'skills/intent-to-3d-brief-writer/SKILL.md',
  'skills/blender-asset-discovery-planner/SKILL.md',
  'skills/runtime-bridge-conflict-resolver/SKILL.md',
  // Batch 1 (post-v0.1.0-draft): Web 3D handoff deep:
  'skills/glb-mobile-performance-budget/SKILL.md',
  'skills/glb-animation-handoff/SKILL.md',
  'skills/three-fiber-component-shape-planner/SKILL.md',
  'skills/preview-report-template-writer/SKILL.md',
  // Batch 2 (post-v0.1.0-draft): Quality validation deep:
  'skills/material-quality-checker/SKILL.md',
  'skills/lighting-quality-checker/SKILL.md',
  'skills/composition-quality-checker/SKILL.md',
  'skills/polycount-budget-checker/SKILL.md',
  // Batch 3 (post-v0.2.0-draft): Domain scene planners:
  'skills/character-portrait-scene-planner/SKILL.md',
  'skills/environment-establishing-shot-planner/SKILL.md',
  'skills/interior-architectural-scene-planner/SKILL.md',
  'skills/product-grid-scene-planner/SKILL.md',
  // Batch 4 (post-v0.2.0-draft): Process discipline:
  'skills/blender-checklist-driven-workflow/SKILL.md',
  'skills/blender-stop-condition-decider/SKILL.md',
  'skills/blender-scope-boundary-enforcer/SKILL.md',
  'skills/blender-recipe-decomposer/SKILL.md',
];

const requiredSkillEvals = [
  'skills/blendops-help/EVAL.md',
  'skills/render-export-evidence/EVAL.md',
  'skills/official-runtime-setup-guide/EVAL.md',
  'skills/official-runtime-readiness-checker/EVAL.md',
  'skills/product-hero-scene-planner/EVAL.md',
  'skills/blender-composition-camera-planner/EVAL.md',
  'skills/blender-lighting-material-planner/EVAL.md',
  'skills/blender-scene-quality-checker/EVAL.md',
  'skills/glb-web-handoff/EVAL.md',
  'skills/non-blender-user-response-writer/EVAL.md',
  'skills/blender-brainstorming/EVAL.md',
  'skills/blender-troubleshooting/EVAL.md',
  'skills/pre-handoff-verification/EVAL.md',
  'skills/intent-to-3d-brief-writer/EVAL.md',
  'skills/blender-asset-discovery-planner/EVAL.md',
  'skills/runtime-bridge-conflict-resolver/EVAL.md',
  // Batch 1 (post-v0.1.0-draft): Web 3D handoff deep:
  'skills/glb-mobile-performance-budget/EVAL.md',
  'skills/glb-animation-handoff/EVAL.md',
  'skills/three-fiber-component-shape-planner/EVAL.md',
  'skills/preview-report-template-writer/EVAL.md',
  // Batch 2 (post-v0.1.0-draft): Quality validation deep:
  'skills/material-quality-checker/EVAL.md',
  'skills/lighting-quality-checker/EVAL.md',
  'skills/composition-quality-checker/EVAL.md',
  'skills/polycount-budget-checker/EVAL.md',
  // Batch 3 (post-v0.2.0-draft): Domain scene planners:
  'skills/character-portrait-scene-planner/EVAL.md',
  'skills/environment-establishing-shot-planner/EVAL.md',
  'skills/interior-architectural-scene-planner/EVAL.md',
  'skills/product-grid-scene-planner/EVAL.md',
  // Batch 4 (post-v0.2.0-draft): Process discipline:
  'skills/blender-checklist-driven-workflow/EVAL.md',
  'skills/blender-stop-condition-decider/EVAL.md',
  'skills/blender-scope-boundary-enforcer/EVAL.md',
  'skills/blender-recipe-decomposer/EVAL.md',
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
  'bundles/claude-desktop-manual/references/skills/blendops-help.md',
  'bundles/claude-desktop-manual/references/skills/blender-brainstorming.md',
  'bundles/claude-desktop-manual/references/skills/intent-to-3d-brief-writer.md',
  'bundles/claude-desktop-manual/references/skills/blender-asset-discovery-planner.md',
  'bundles/claude-desktop-manual/references/skills/official-runtime-setup-guide.md',
  'bundles/claude-desktop-manual/references/skills/official-runtime-readiness-checker.md',
  'bundles/claude-desktop-manual/references/skills/runtime-bridge-conflict-resolver.md',
  'bundles/claude-desktop-manual/references/skills/product-hero-scene-planner.md',
  'bundles/claude-desktop-manual/references/skills/blender-composition-camera-planner.md',
  'bundles/claude-desktop-manual/references/skills/blender-lighting-material-planner.md',
  'bundles/claude-desktop-manual/references/skills/blender-scene-quality-checker.md',
  'bundles/claude-desktop-manual/references/skills/blender-troubleshooting.md',
  'bundles/claude-desktop-manual/references/skills/render-export-evidence.md',
  'bundles/claude-desktop-manual/references/skills/pre-handoff-verification.md',
  'bundles/claude-desktop-manual/references/skills/glb-web-handoff.md',
  'bundles/claude-desktop-manual/references/skills/non-blender-user-response-writer.md',
  // Batch 1 (post-v0.1.0-draft): Web 3D handoff deep:
  'bundles/claude-desktop-manual/references/skills/glb-mobile-performance-budget.md',
  'bundles/claude-desktop-manual/references/skills/glb-animation-handoff.md',
  'bundles/claude-desktop-manual/references/skills/three-fiber-component-shape-planner.md',
  'bundles/claude-desktop-manual/references/skills/preview-report-template-writer.md',
  // Batch 2 (post-v0.1.0-draft): Quality validation deep:
  'bundles/claude-desktop-manual/references/skills/material-quality-checker.md',
  'bundles/claude-desktop-manual/references/skills/lighting-quality-checker.md',
  'bundles/claude-desktop-manual/references/skills/composition-quality-checker.md',
  'bundles/claude-desktop-manual/references/skills/polycount-budget-checker.md',
  // Batch 3 (post-v0.2.0-draft): Domain scene planners:
  'bundles/claude-desktop-manual/references/skills/character-portrait-scene-planner.md',
  'bundles/claude-desktop-manual/references/skills/environment-establishing-shot-planner.md',
  'bundles/claude-desktop-manual/references/skills/interior-architectural-scene-planner.md',
  'bundles/claude-desktop-manual/references/skills/product-grid-scene-planner.md',
  // Batch 4 (post-v0.2.0-draft): Process discipline:
  'bundles/claude-desktop-manual/references/skills/blender-checklist-driven-workflow.md',
  'bundles/claude-desktop-manual/references/skills/blender-stop-condition-decider.md',
  'bundles/claude-desktop-manual/references/skills/blender-scope-boundary-enforcer.md',
  'bundles/claude-desktop-manual/references/skills/blender-recipe-decomposer.md',
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
  'bundles/skill-package/blendops/references/skill-render-export-evidence.md',
  'bundles/skill-package/blendops/references/skill-official-runtime-setup-guide.md',
  'bundles/skill-package/blendops/references/skill-blender-brainstorming.md',
  'bundles/skill-package/blendops/references/skill-blender-troubleshooting.md',
  'bundles/skill-package/blendops/references/skill-pre-handoff-verification.md',
  'bundles/skill-package/blendops/references/skill-intent-to-3d-brief-writer.md',
  'bundles/skill-package/blendops/references/skill-blender-asset-discovery-planner.md',
  'bundles/skill-package/blendops/references/skill-runtime-bridge-conflict-resolver.md',
  // Batch 1 (post-v0.1.0-draft): Web 3D handoff deep:
  'bundles/skill-package/blendops/references/skill-glb-mobile-performance-budget.md',
  'bundles/skill-package/blendops/references/skill-glb-animation-handoff.md',
  'bundles/skill-package/blendops/references/skill-three-fiber-component-shape-planner.md',
  'bundles/skill-package/blendops/references/skill-preview-report-template-writer.md',
  // Batch 2 (post-v0.1.0-draft): Quality validation deep:
  'bundles/skill-package/blendops/references/skill-material-quality-checker.md',
  'bundles/skill-package/blendops/references/skill-lighting-quality-checker.md',
  'bundles/skill-package/blendops/references/skill-composition-quality-checker.md',
  'bundles/skill-package/blendops/references/skill-polycount-budget-checker.md',
  // Batch 3 (post-v0.2.0-draft): Domain scene planners:
  'bundles/skill-package/blendops/references/skill-character-portrait-scene-planner.md',
  'bundles/skill-package/blendops/references/skill-environment-establishing-shot-planner.md',
  'bundles/skill-package/blendops/references/skill-interior-architectural-scene-planner.md',
  'bundles/skill-package/blendops/references/skill-product-grid-scene-planner.md',
  // Batch 4 (post-v0.2.0-draft): Process discipline:
  'bundles/skill-package/blendops/references/skill-blender-checklist-driven-workflow.md',
  'bundles/skill-package/blendops/references/skill-blender-stop-condition-decider.md',
  'bundles/skill-package/blendops/references/skill-blender-scope-boundary-enforcer.md',
  'bundles/skill-package/blendops/references/skill-blender-recipe-decomposer.md',
  'bundles/skill-package/blendops/references/law-evidence-before-done.md',
  'bundles/skill-package/blendops/references/pack-product-hero-v0.md',
  'bundles/skill-package/blendops/LICENSE.txt',
];

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

// Note: this allowlist used to ban any mention of ahujasid/blender-mcp outside
// docs/unofficial-runtime-bridges.md. That ban created a contradictory state
// because the only currently user-verified runtime path uses `ahujasid/blender-mcp`,
// and Blender's own MCP ecosystem treats it as canonical prior art (21K+ stars,
// the only practical path for non-Claude MCP clients). The 4-path runtime route
// model (see docs/runtime-stack-strategy.md) now lets these terms appear in
// runtime-stack-strategy, external-runtime-setup, install docs, smoke-test
// attribution, and the README glossary. We keep a narrower forbidden list:
// nothing here for now, but the slot is preserved for future bans.
const forbiddenCommunityPatterns = [];

const unofficialBridgeDoc = 'docs/unofficial-runtime-bridges.md';

// Path 2 disclaimer set. The community `ahujasid/blender-mcp` is mature prior
// art (21K+ stars) and IS one of the canonical BlendOps runtime paths — but it
// is third-party from both Anthropic and the Blender Foundation. The disclaimer
// set guards what stays true: third-party provenance, manual config burden, the
// unsandboxed Python execution surface, and the "no formal eval record yet"
// evidence gap.
const requiredUnofficialBridgeDisclaimers = [
  'Path 2',
  'ahujasid/blender-mcp',
  'Not yet covered by a formal BlendOps eval evidence record',
  'Not used for Draft v0 release-readiness claims',
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
// is NOT standalone. Path 2 = community ahujasid/blender-mcp. CLI fallback is
// an appendix documented upstream as a first-class Blender CLI surface (stable
// across LTS releases) — BlendOps simply does not have an in-repo eval record
// file yet, but the path itself is mature, not "experimental". Path 1 + Path 2
// are user-reported verified by the repo owner with no formal in-repo evidence
// file yet. See docs/runtime-stack-strategy.md for the canonical write-up.
const requiredRuntimeStackSnippets = [
  'BlendOps recognizes **two MCP execution paths** plus a **CLI fallback appendix**',
  'Path 1 — Official Blender Lab MCP',
  'Connector is not standalone',
  'install an add-on inside Blender',
  'Path 2 — Community',
  'ahujasid/blender-mcp',
  'CLI fallback',
  'first-class',
  'No in-repo evidence file yet',
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

const requiredInstallerSpecSnippets = [
  'This is a specification only.',
  '`scripts/install-skills.mjs` is not implemented yet.',
  'Do not tell users to run these commands until the script exists',
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
// Server (`bpype/blender_mcp` at blender.org/lab/mcp-server/) IS a standalone
// official MCP that any MCP client can configure. The 4-route runtime model
// names it Route B explicitly. The remaining ban guards the older naming that
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

console.log('Running docs:check...');

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

for (const skillFile of requiredSkills) {
  const txt = fs.readFileSync(path.join(root, skillFile), 'utf8');
  for (const heading of requiredSkillHeadings) {
    if (!txt.includes(heading)) {
      errors.push(`Missing required heading in ${skillFile}: ${heading}`);
    }
  }
  if (!skillFile.endsWith('/_template/SKILL.md')) {
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
assertContainsAll(
  'docs/install/installer-spec.md',
  requiredInstallerSpecSnippets,
  'Future installer spec policy'
);
assertContainsAll(
  'README.md',
  requiredReadmeGuardSnippets,
  'Root README universal prompt policy'
);
for (const p of forbiddenOfficialDirectMcpRoutePatterns) {
  scanPattern(activeMd, p, 'Forbidden official direct MCP route pattern', ['docs/archive']);
}

for (const ref of requiredOfficialRefs) {
  if (!ensureRefExists(activeMd, ref)) {
    errors.push(`Missing required official runtime reference in active files: ${ref}`);
  }
}

// Link existence check (catches future doc-collection moves like Phase 2.11 cleanup).
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
  const txt = fs.readFileSync(path.join(root, f), 'utf8');
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

if (errors.length > 0) {
  console.error('\nDocs check failed with the following issues:');
  for (const e of errors) console.error(`- ${e}`);
  process.exit(1);
}

console.log('docs:check passed');
console.log(`Checked ${activeMd.length} active markdown files (docs/archive excluded).`);
process.exit(0);
