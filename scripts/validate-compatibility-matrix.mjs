#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DEFAULT_SCHEMA_PATH = path.join(ROOT_DIR, 'schemas', 'adapter-compatibility-matrix.schema.json');
const DEFAULT_MATRIX_PATH = path.join(ROOT_DIR, 'registry', 'compatibility-matrix.json');

const EMPIRICALLY_VERIFIED_READ_TARGETS = new Set(['claude-code', 'generic-project']);

export const CANONICAL_26_TARGETS = Object.freeze([
  {
    id: 'claude-code',
    canonicalHostName: 'Claude Code',
    consumerType: 'coding-agent-project-local',
    compatibilityTier: 'Tier 1',
    installGuidePath: 'docs/install/claude-code.md',
    adapterDocPath: 'docs/adapters/claude-code.md',
    configurationMethod: 'Project-local .claude/skills/ + CLAUDE.md or BLENDOPS.md entrypoint + MCP config for Path 1 host (b) or Path 2',
    availableCapabilities: [
      'project-local-skill-read',
      'mcp-path-1-host-b',
      'mcp-path-2-community',
      'cli-appendix-execution',
    ],
    evidenceLevel: 'verified-read',
    verificationState: 'Verified Read (Repo-Local)',
    verificationDate: '2026-05-08',
    verificationEvidencePath: 'docs/evals/adapter-install-v0-dry-run.md',
    limitations: 'Verified for project-local skill reading and dry-run layout; live Blender E2E MCP mutation remains Not Run in-repo.',
  },
  {
    id: 'generic-project',
    canonicalHostName: 'Generic project (BLENDOPS.md fallback)',
    consumerType: 'generic-fallback',
    compatibilityTier: 'Tier 1',
    installGuidePath: 'docs/install/generic-project.md',
    adapterDocPath: 'docs/adapters/generic-root.md',
    configurationMethod: 'Project-local BLENDOPS.md root entrypoint + skills/, laws/, packs/ directories',
    availableCapabilities: [
      'project-local-skill-read',
      'docs-only-reference',
    ],
    evidenceLevel: 'verified-read',
    verificationState: 'Verified Read (Repo-Local)',
    verificationDate: '2026-05-08',
    verificationEvidencePath: 'docs/evals/adapter-install-v0-dry-run.md',
    limitations: 'Target-neutral project-local fallback verified by bundle dry-run; host-specific MCP wiring depends on the consuming agent.',
  },
  {
    id: 'claude-desktop',
    canonicalHostName: 'Claude Desktop / Claude.ai',
    consumerType: 'chat-ui-skills-upload',
    compatibilityTier: 'Tier 1',
    installGuidePath: 'docs/install/claude-desktop.md',
    adapterDocPath: 'docs/adapters/claude-app.md',
    configurationMethod: 'Upload separate per-skill ZIPs from dist/claude-skills-zip/*.zip + Path 1 Host (a) Anthropic Blender Connector (requires Blender 5.1+ Lab MCP add-on)',
    availableCapabilities: [
      'skills-zip-upload',
      'mcp-path-1-host-a',
      'mcp-path-2-community',
      'docs-only-reference',
    ],
    evidenceLevel: 'linked-only',
    verificationState: 'Not Verified',
    verificationDate: 'Not Verified',
    verificationEvidencePath: null,
    limitations: 'ZIP package structure is verified in CI, but live Claude.ai UI upload + Connector E2E execution has not been recorded in a formal in-repo eval.',
  },
  {
    id: 'cursor',
    canonicalHostName: 'Cursor',
    consumerType: 'coding-agent-project-local',
    compatibilityTier: 'Tier 1',
    installGuidePath: 'docs/install/cursor.md',
    adapterDocPath: 'docs/adapters/cursor.md',
    configurationMethod: 'Project-local .cursor/rules/*.mdc or AGENTS.md/BLENDOPS.md + .cursor/mcp.json for Path 1 host (b) or Path 2',
    availableCapabilities: [
      'project-local-skill-read',
      'mcp-path-1-host-b',
      'mcp-path-2-community',
      'cli-appendix-execution',
    ],
    evidenceLevel: 'linked-only',
    verificationState: 'Not Verified',
    verificationDate: 'Not Verified',
    verificationEvidencePath: null,
    limitations: 'Upstream .cursor/rules and .cursor/mcp.json paths are documented; awaiting empirical in-repo host verification.',
  },
  {
    id: 'codex',
    canonicalHostName: 'Codex CLI / App',
    consumerType: 'coding-agent-project-local',
    compatibilityTier: 'Tier 1',
    installGuidePath: 'docs/install/codex.md',
    adapterDocPath: 'docs/adapters/codex.md',
    configurationMethod: 'Project-local AGENTS.md + skills/, laws/, packs/ + upstream Codex MCP configuration',
    availableCapabilities: [
      'project-local-skill-read',
      'mcp-path-1-host-b',
      'mcp-path-2-community',
      'cli-appendix-execution',
    ],
    evidenceLevel: 'linked-only',
    verificationState: 'Not Verified',
    verificationDate: 'Not Verified',
    verificationEvidencePath: null,
    limitations: 'AGENTS.md discovery is documented upstream; MCP client integration remains linked-only pending live host test.',
  },
  {
    id: 'opencode',
    canonicalHostName: 'OpenCode',
    consumerType: 'coding-agent-project-local',
    compatibilityTier: 'Tier 1',
    installGuidePath: 'docs/install/opencode.md',
    adapterDocPath: 'docs/adapters/opencode.md',
    configurationMethod: 'Project-local BLENDOPS.md + skills/, laws/, packs/ + OpenCode MCP server configuration',
    availableCapabilities: [
      'project-local-skill-read',
      'mcp-path-1-host-b',
      'mcp-path-2-community',
      'cli-appendix-execution',
    ],
    evidenceLevel: 'linked-only',
    verificationState: 'Not Verified',
    verificationDate: 'Not Verified',
    verificationEvidencePath: null,
    limitations: 'Candidate .opencode/ skill path and MCP config remain linked-only until verified in a live OpenCode workspace.',
  },
  {
    id: 'aider',
    canonicalHostName: 'Aider (terminal)',
    consumerType: 'coding-agent-project-local',
    compatibilityTier: 'Tier 2',
    installGuidePath: 'docs/install/aider.md',
    adapterDocPath: null,
    configurationMethod: 'Project-local BLENDOPS.md read via /read or .aider.conf.yml + --mcp-servers flag',
    availableCapabilities: [
      'project-local-skill-read',
      'mcp-path-1-host-b',
      'mcp-path-2-community',
      'cli-appendix-execution',
    ],
    evidenceLevel: 'linked-only',
    verificationState: 'Not Verified',
    verificationDate: 'Not Verified',
    verificationEvidencePath: null,
    limitations: 'Install-only target documented from upstream Aider docs; no dedicated adapter doc or live host eval yet.',
  },
  {
    id: 'amazon-q-developer',
    canonicalHostName: 'Amazon Q Developer CLI',
    consumerType: 'coding-agent-project-local',
    compatibilityTier: 'Tier 2',
    installGuidePath: 'docs/install/amazon-q-developer.md',
    adapterDocPath: null,
    configurationMethod: 'Project-local BLENDOPS.md + ~/.aws/amazonq/cli-agents or qchat mcp CLI',
    availableCapabilities: [
      'project-local-skill-read',
      'mcp-path-1-host-b',
      'mcp-path-2-community',
      'cli-appendix-execution',
    ],
    evidenceLevel: 'linked-only',
    verificationState: 'Not Verified',
    verificationDate: 'Not Verified',
    verificationEvidencePath: null,
    limitations: 'Install-only target documented from upstream Amazon Q docs; not empirically verified in-repo.',
  },
  {
    id: 'antigravity',
    canonicalHostName: 'Antigravity (Google)',
    consumerType: 'coding-agent-project-local',
    compatibilityTier: 'Tier 2',
    installGuidePath: 'docs/install/antigravity.md',
    adapterDocPath: null,
    configurationMethod: 'Project-local BLENDOPS.md + MCP Store or mcp_config.json',
    availableCapabilities: [
      'project-local-skill-read',
      'mcp-path-1-host-b',
      'mcp-path-2-community',
      'cli-appendix-execution',
    ],
    evidenceLevel: 'linked-only',
    verificationState: 'Not Verified',
    verificationDate: 'Not Verified',
    verificationEvidencePath: null,
    limitations: 'Install-only target; MCP config location is linked-only with no dedicated adapter verification record.',
  },
  {
    id: 'augment-code',
    canonicalHostName: 'Augment Code',
    consumerType: 'coding-agent-project-local',
    compatibilityTier: 'Tier 2',
    installGuidePath: 'docs/install/augment-code.md',
    adapterDocPath: null,
    configurationMethod: 'Project-local BLENDOPS.md + Augment Settings panel or ~/.augment/settings.json',
    availableCapabilities: [
      'project-local-skill-read',
      'mcp-path-1-host-b',
      'mcp-path-2-community',
      'cli-appendix-execution',
    ],
    evidenceLevel: 'linked-only',
    verificationState: 'Not Verified',
    verificationDate: 'Not Verified',
    verificationEvidencePath: null,
    limitations: 'Install-only target; linked-only upstream documentation without empirical host verification.',
  },
  {
    id: 'blackbox-ai',
    canonicalHostName: 'Blackbox AI (VS Code)',
    consumerType: 'coding-agent-project-local',
    compatibilityTier: 'Tier 2',
    installGuidePath: 'docs/install/blackbox-ai.md',
    adapterDocPath: null,
    configurationMethod: 'Project-local BLENDOPS.md + Blackbox panel MCP Servers configuration',
    availableCapabilities: [
      'project-local-skill-read',
      'mcp-path-1-host-b',
      'mcp-path-2-community',
    ],
    evidenceLevel: 'linked-only',
    verificationState: 'Not Verified',
    verificationDate: 'Not Verified',
    verificationEvidencePath: null,
    limitations: 'Install-only target; linked-only upstream documentation without empirical host verification.',
  },
  {
    id: 'cline',
    canonicalHostName: 'Cline (VS Code)',
    consumerType: 'coding-agent-project-local',
    compatibilityTier: 'Tier 2',
    installGuidePath: 'docs/install/cline.md',
    adapterDocPath: null,
    configurationMethod: 'Project-local BLENDOPS.md + .clinerules + VS Code Cline MCP Settings',
    availableCapabilities: [
      'project-local-skill-read',
      'mcp-path-1-host-b',
      'mcp-path-2-community',
      'cli-appendix-execution',
    ],
    evidenceLevel: 'linked-only',
    verificationState: 'Not Verified',
    verificationDate: 'Not Verified',
    verificationEvidencePath: null,
    limitations: 'Install-only target; linked-only upstream documentation without empirical host verification.',
  },
  {
    id: 'continue',
    canonicalHostName: 'Continue.dev',
    consumerType: 'coding-agent-project-local',
    compatibilityTier: 'Tier 2',
    installGuidePath: 'docs/install/continue.md',
    adapterDocPath: null,
    configurationMethod: 'Project-local BLENDOPS.md + .continue/mcpServers/ configuration',
    availableCapabilities: [
      'project-local-skill-read',
      'mcp-path-1-host-b',
      'mcp-path-2-community',
      'cli-appendix-execution',
    ],
    evidenceLevel: 'linked-only',
    verificationState: 'Not Verified',
    verificationDate: 'Not Verified',
    verificationEvidencePath: null,
    limitations: 'Install-only target; linked-only upstream documentation without empirical host verification.',
  },
  {
    id: 'gemini',
    canonicalHostName: 'Gemini CLI',
    consumerType: 'coding-agent-project-local',
    compatibilityTier: 'Tier 2',
    installGuidePath: 'docs/install/gemini.md',
    adapterDocPath: null,
    configurationMethod: 'Project-local BLENDOPS.md / GEMINI.md + upstream Gemini CLI MCP settings',
    availableCapabilities: [
      'project-local-skill-read',
      'mcp-path-1-host-b',
      'mcp-path-2-community',
      'cli-appendix-execution',
    ],
    evidenceLevel: 'linked-only',
    verificationState: 'Not Verified',
    verificationDate: 'Not Verified',
    verificationEvidencePath: null,
    limitations: 'Install-only target; tool-native skill loader conventions are unverified.',
  },
  {
    id: 'github-copilot',
    canonicalHostName: 'GitHub Copilot',
    consumerType: 'coding-agent-project-local',
    compatibilityTier: 'Tier 2',
    installGuidePath: 'docs/install/github-copilot.md',
    adapterDocPath: null,
    configurationMethod: 'Project-local BLENDOPS.md / .github/copilot-instructions.md + VS Code MCP configuration',
    availableCapabilities: [
      'project-local-skill-read',
      'mcp-path-1-host-b',
      'mcp-path-2-community',
    ],
    evidenceLevel: 'linked-only',
    verificationState: 'Not Verified',
    verificationDate: 'Not Verified',
    verificationEvidencePath: null,
    limitations: 'Install-only target; uses generic project-local instructions and linked-only MCP docs.',
  },
  {
    id: 'goose',
    canonicalHostName: 'goose (Block)',
    consumerType: 'coding-agent-project-local',
    compatibilityTier: 'Tier 2',
    installGuidePath: 'docs/install/goose.md',
    adapterDocPath: null,
    configurationMethod: 'Project-local BLENDOPS.md / .goosehints + goose Standard IO MCP extension',
    availableCapabilities: [
      'project-local-skill-read',
      'mcp-path-1-host-b',
      'mcp-path-2-community',
      'cli-appendix-execution',
    ],
    evidenceLevel: 'linked-only',
    verificationState: 'Not Verified',
    verificationDate: 'Not Verified',
    verificationEvidencePath: null,
    limitations: 'Install-only target; upstream Blender MCP tutorial exists, but no BlendOps in-repo eval has been executed.',
  },
  {
    id: 'jetbrains-junie',
    canonicalHostName: 'JetBrains Junie / AI Assistant',
    consumerType: 'coding-agent-project-local',
    compatibilityTier: 'Tier 2',
    installGuidePath: 'docs/install/jetbrains-junie.md',
    adapterDocPath: null,
    configurationMethod: 'Project-local BLENDOPS.md / .junie/guidelines.md + .junie/mcp/mcp.json',
    availableCapabilities: [
      'project-local-skill-read',
      'mcp-path-1-host-b',
      'mcp-path-2-community',
      'cli-appendix-execution',
    ],
    evidenceLevel: 'linked-only',
    verificationState: 'Not Verified',
    verificationDate: 'Not Verified',
    verificationEvidencePath: null,
    limitations: 'Install-only target; linked-only upstream documentation without empirical host verification.',
  },
  {
    id: 'openhands',
    canonicalHostName: 'OpenHands',
    consumerType: 'coding-agent-project-local',
    compatibilityTier: 'Tier 2',
    installGuidePath: 'docs/install/openhands.md',
    adapterDocPath: null,
    configurationMethod: 'Project-local BLENDOPS.md + ~/.openhands/mcp.json or openhands mcp CLI',
    availableCapabilities: [
      'project-local-skill-read',
      'mcp-path-1-host-b',
      'mcp-path-2-community',
      'cli-appendix-execution',
    ],
    evidenceLevel: 'linked-only',
    verificationState: 'Not Verified',
    verificationDate: 'Not Verified',
    verificationEvidencePath: null,
    limitations: 'Install-only target; linked-only upstream documentation without empirical host verification.',
  },
  {
    id: 'roo-code',
    canonicalHostName: 'Roo Code (VS Code)',
    consumerType: 'coding-agent-project-local',
    compatibilityTier: 'Tier 2',
    installGuidePath: 'docs/install/roo-code.md',
    adapterDocPath: null,
    configurationMethod: 'Project-local BLENDOPS.md + .roo/mcp.json (project) or global mcp_settings.json',
    availableCapabilities: [
      'project-local-skill-read',
      'mcp-path-1-host-b',
      'mcp-path-2-community',
      'cli-appendix-execution',
    ],
    evidenceLevel: 'linked-only',
    verificationState: 'Not Verified',
    verificationDate: 'Not Verified',
    verificationEvidencePath: null,
    limitations: 'Install-only target; linked-only upstream documentation without empirical host verification.',
  },
  {
    id: 'sourcegraph-cody',
    canonicalHostName: 'Sourcegraph Cody',
    consumerType: 'coding-agent-project-local',
    compatibilityTier: 'Tier 2',
    installGuidePath: 'docs/install/sourcegraph-cody.md',
    adapterDocPath: null,
    configurationMethod: 'Project-local BLENDOPS.md + opt-in agentic context fetching MCP config',
    availableCapabilities: [
      'project-local-skill-read',
      'mcp-path-1-host-b',
      'mcp-path-2-community',
    ],
    evidenceLevel: 'linked-only',
    verificationState: 'Not Verified',
    verificationDate: 'Not Verified',
    verificationEvidencePath: null,
    limitations: 'Install-only target; linked-only upstream documentation without empirical host verification.',
  },
  {
    id: 'trae',
    canonicalHostName: 'Trae (ByteDance)',
    consumerType: 'coding-agent-project-local',
    compatibilityTier: 'Tier 2',
    installGuidePath: 'docs/install/trae.md',
    adapterDocPath: null,
    configurationMethod: 'Project-local BLENDOPS.md + Trae Settings -> MCP -> Add Manually (v1.3.0+)',
    availableCapabilities: [
      'project-local-skill-read',
      'mcp-path-1-host-b',
      'mcp-path-2-community',
      'cli-appendix-execution',
    ],
    evidenceLevel: 'linked-only',
    verificationState: 'Not Verified',
    verificationDate: 'Not Verified',
    verificationEvidencePath: null,
    limitations: 'Install-only target; linked-only upstream documentation without empirical host verification.',
  },
  {
    id: 'windsurf',
    canonicalHostName: 'Windsurf (Codeium)',
    consumerType: 'coding-agent-project-local',
    compatibilityTier: 'Tier 2',
    installGuidePath: 'docs/install/windsurf.md',
    adapterDocPath: null,
    configurationMethod: 'Project-local BLENDOPS.md / .windsurfrules + ~/.codeium/windsurf/mcp_config.json',
    availableCapabilities: [
      'project-local-skill-read',
      'mcp-path-1-host-b',
      'mcp-path-2-community',
      'cli-appendix-execution',
    ],
    evidenceLevel: 'linked-only',
    verificationState: 'Not Verified',
    verificationDate: 'Not Verified',
    verificationEvidencePath: null,
    limitations: 'Install-only target; linked-only upstream documentation without empirical host verification.',
  },
  {
    id: 'zed',
    canonicalHostName: 'Zed editor',
    consumerType: 'coding-agent-project-local',
    compatibilityTier: 'Tier 2',
    installGuidePath: 'docs/install/zed.md',
    adapterDocPath: null,
    configurationMethod: 'Project-local BLENDOPS.md / .rules + Zed settings.json context_servers',
    availableCapabilities: [
      'project-local-skill-read',
      'mcp-path-1-host-b',
      'mcp-path-2-community',
    ],
    evidenceLevel: 'linked-only',
    verificationState: 'Not Verified',
    verificationDate: 'Not Verified',
    verificationEvidencePath: null,
    limitations: 'Install-only target; linked-only upstream documentation without empirical host verification.',
  },
  {
    id: 'lm-studio',
    canonicalHostName: 'LM Studio',
    consumerType: 'local-llm-runner',
    compatibilityTier: 'Tier 3',
    installGuidePath: 'docs/install/lm-studio.md',
    adapterDocPath: null,
    configurationMethod: 'Docs-only / prompt-attached skill content + LM Studio mcp.json (Cursor-compatible)',
    availableCapabilities: [
      'docs-only-reference',
      'mcp-path-1-host-b',
      'mcp-path-2-community',
    ],
    evidenceLevel: 'linked-only',
    verificationState: 'Not Verified',
    verificationDate: 'Not Verified',
    verificationEvidencePath: null,
    limitations: 'Local LLM runner without project-local file skill loader; BlendOps is docs-only / reference.',
  },
  {
    id: 'ollama',
    canonicalHostName: 'Ollama',
    consumerType: 'local-llm-runner',
    compatibilityTier: 'Tier 3',
    installGuidePath: 'docs/install/ollama.md',
    adapterDocPath: null,
    configurationMethod: 'Docs-only / prompt-attached skill content + experimental ~/.ollama/mcp-servers.json or 3rd-party MCP client',
    availableCapabilities: [
      'docs-only-reference',
      'mcp-path-1-host-b',
      'mcp-path-2-community',
    ],
    evidenceLevel: 'linked-only',
    verificationState: 'Not Verified',
    verificationDate: 'Not Verified',
    verificationEvidencePath: null,
    limitations: 'Local LLM runner without project-local file conventions; MCP support is experimental / client-dependent.',
  },
  {
    id: 'open-webui',
    canonicalHostName: 'Open WebUI',
    consumerType: 'local-llm-runner',
    compatibilityTier: 'Tier 3',
    installGuidePath: 'docs/install/open-webui.md',
    adapterDocPath: null,
    configurationMethod: 'Docs-only / Knowledge base attachment + Admin Settings -> External Tools -> Streamable HTTP MCP',
    availableCapabilities: [
      'docs-only-reference',
      'mcp-path-1-host-b',
      'mcp-path-2-community',
    ],
    evidenceLevel: 'linked-only',
    verificationState: 'Not Verified',
    verificationDate: 'Not Verified',
    verificationEvidencePath: null,
    limitations: 'Local LLM web UI without project-local file skill loader; requires Streamable HTTP MCP bridge.',
  },
]);

let cachedSchemaValidator = null;

function getMatrixSchemaValidator(schemaPath = DEFAULT_SCHEMA_PATH) {
  if (cachedSchemaValidator && cachedSchemaValidator.schemaPath === schemaPath) {
    return cachedSchemaValidator.validate;
  }
  const raw = fs.readFileSync(schemaPath, 'utf8');
  const schema = JSON.parse(raw);
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  const validate = ajv.compile(schema);
  cachedSchemaValidator = { schemaPath, validate };
  return validate;
}

export function buildExpectedCompatibilityMatrix() {
  const sortedTargets = [...CANONICAL_26_TARGETS].sort((a, b) =>
    a.id < b.id ? -1 : a.id > b.id ? 1 : 0,
  );
  const verifiedReadCount = sortedTargets.filter((t) => t.evidenceLevel === 'verified-read').length;
  const linkedOnlyCount = sortedTargets.filter((t) => t.evidenceLevel === 'linked-only').length;
  const dedicatedAdapterDocs = sortedTargets.filter((t) => t.adapterDocPath !== null).length;
  const installOnlyTargets = sortedTargets.filter((t) => t.adapterDocPath === null).length;

  return {
    $schema: '../schemas/adapter-compatibility-matrix.schema.json',
    schemaVersion: '1.0.0',
    summary: {
      totalInstallTargets: sortedTargets.length,
      dedicatedAdapterDocs,
      installOnlyTargets,
      verifiedReadCount,
      linkedOnlyCount,
      verifiedE2eCount: 0,
    },
    promotionPolicy: {
      allowDocOnlyPromotion: false,
      verifiedReadAllowlist: ['claude-code', 'generic-project'],
      rule: 'No install target or adapter may be promoted from linked-only to verified-read or verified-e2e based on documentation alone. Promotion requires a dedicated adapter doc in docs/adapters/ AND an in-repo empirical verification record under docs/evals/.',
    },
    targets: sortedTargets,
  };
}

export function validateCompatibilityMatrixObject(
  matrix,
  { rootDir = ROOT_DIR, schemaPath = DEFAULT_SCHEMA_PATH } = {},
) {
  const errors = [];
  if (!matrix || typeof matrix !== 'object' || Array.isArray(matrix)) {
    return { valid: false, errors: ['Compatibility matrix root must be a JSON object'] };
  }

  const validateSchema = getMatrixSchemaValidator(schemaPath);
  const schemaOk = validateSchema(matrix);
  if (!schemaOk) {
    for (const err of validateSchema.errors || []) {
      errors.push(`schema(${err.instancePath || '/'}): ${err.message}`);
    }
  }

  const installDir = path.join(rootDir, 'docs', 'install');
  const discoveredInstallIds = fs.existsSync(installDir)
    ? fs
        .readdirSync(installDir)
        .filter((f) => f.endsWith('.md') && f !== 'README.md' && f !== 'installer-spec.md')
        .map((f) => f.replace(/\.md$/, ''))
        .sort()
    : [];

  const seenIds = new Set();
  const targets = Array.isArray(matrix.targets) ? matrix.targets : [];

  for (const t of targets) {
    if (!t || typeof t !== 'object') continue;
    if (seenIds.has(t.id)) {
      errors.push(`Duplicate target id in compatibility matrix: '${t.id}'`);
    }
    seenIds.add(t.id);

    const expectedInstallRel = `docs/install/${t.id}.md`;
    if (t.installGuidePath !== expectedInstallRel) {
      errors.push(
        `Target '${t.id}' installGuidePath '${t.installGuidePath}' must equal '${expectedInstallRel}'`,
      );
    }
    if (!fs.existsSync(path.join(rootDir, t.installGuidePath))) {
      errors.push(`Target '${t.id}' installGuidePath does not exist on disk: ${t.installGuidePath}`);
    }

    if (t.adapterDocPath !== null) {
      if (!fs.existsSync(path.join(rootDir, t.adapterDocPath))) {
        errors.push(`Target '${t.id}' adapterDocPath does not exist on disk: ${t.adapterDocPath}`);
      }
    }

    // Strict anti-promotion rule: never promote to verified-read based on docs alone
    if (t.evidenceLevel === 'verified-read') {
      if (!EMPIRICALLY_VERIFIED_READ_TARGETS.has(t.id)) {
        errors.push(
          `Unverified promotion blocked for '${t.id}': cannot claim evidenceLevel 'verified-read' without empirical host verification (only claude-code and generic-project are verified-read)`,
        );
      }
      if (!t.adapterDocPath) {
        errors.push(`Target '${t.id}' claiming 'verified-read' must have a non-null adapterDocPath`);
      }
      if (t.verificationState !== 'Verified Read (Repo-Local)') {
        errors.push(
          `Target '${t.id}' with evidenceLevel 'verified-read' must have verificationState 'Verified Read (Repo-Local)'`,
        );
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(t.verificationDate || '')) {
        errors.push(
          `Target '${t.id}' with evidenceLevel 'verified-read' must record an ISO verificationDate (YYYY-MM-DD)`,
        );
      }
      if (!t.verificationEvidencePath || !fs.existsSync(path.join(rootDir, t.verificationEvidencePath))) {
        errors.push(
          `Target '${t.id}' with evidenceLevel 'verified-read' must reference an existing verificationEvidencePath under docs/evals/`,
        );
      }
    } else if (t.evidenceLevel === 'linked-only') {
      if (t.verificationState !== 'Not Verified') {
        errors.push(
          `Target '${t.id}' with evidenceLevel 'linked-only' must have verificationState 'Not Verified' (received '${t.verificationState}')`,
        );
      }
      if (t.verificationDate !== 'Not Verified') {
        errors.push(
          `Target '${t.id}' with evidenceLevel 'linked-only' must have verificationDate 'Not Verified' (received '${t.verificationDate}')`,
        );
      }
      if (t.verificationEvidencePath !== null) {
        errors.push(
          `Target '${t.id}' with evidenceLevel 'linked-only' must have verificationEvidencePath: null`,
        );
      }
    }
  }

  for (const diskId of discoveredInstallIds) {
    if (!seenIds.has(diskId)) {
      errors.push(`Install guide 'docs/install/${diskId}.md' is missing from registry/compatibility-matrix.json`);
    }
  }

  // Cross-check docs/adapter-registry.md mentions every install guide filename
  const adapterRegistryPath = path.join(rootDir, 'docs', 'adapter-registry.md');
  if (fs.existsSync(adapterRegistryPath)) {
    const regTxt = fs.readFileSync(adapterRegistryPath, 'utf8');
    for (const t of targets) {
      const installFile = `${t.id}.md`;
      if (!regTxt.includes(installFile)) {
        errors.push(
          `Target '${t.id}' (${installFile}) is missing from docs/adapter-registry.md`,
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function main() {
  const args = new Set(process.argv.slice(2));
  const checkOnly = args.has('--check');
  const expectedMatrix = buildExpectedCompatibilityMatrix();
  const expectedJson = `${JSON.stringify(expectedMatrix, null, 2)}\n`;

  if (checkOnly) {
    if (!fs.existsSync(DEFAULT_MATRIX_PATH)) {
      console.error('Missing registry/compatibility-matrix.json');
      process.exit(1);
    }
    const diskJson = fs.readFileSync(DEFAULT_MATRIX_PATH, 'utf8');
    const diskObj = JSON.parse(diskJson);
    const val = validateCompatibilityMatrixObject(diskObj, { rootDir: ROOT_DIR });
    if (!val.valid) {
      console.error('Compatibility matrix validation failed:');
      for (const e of val.errors) console.error(`- ${e}`);
      process.exit(1);
    }
    if (diskJson !== expectedJson) {
      console.error('Stale registry/compatibility-matrix.json does not match expected matrix');
      process.exit(1);
    }
    console.log(
      `Compatibility matrix --check passed (${diskObj.summary.totalInstallTargets} targets: ${diskObj.summary.verifiedReadCount} verified-read, ${diskObj.summary.linkedOnlyCount} linked-only)`,
    );
    return;
  }

  const val = validateCompatibilityMatrixObject(expectedMatrix, { rootDir: ROOT_DIR });
  if (!val.valid) {
    console.error('Compatibility matrix generation failed validation:');
    for (const e of val.errors) console.error(`- ${e}`);
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(DEFAULT_MATRIX_PATH), { recursive: true });
  fs.writeFileSync(DEFAULT_MATRIX_PATH, expectedJson, 'utf8');
  console.log(
    `Generated registry/compatibility-matrix.json (${expectedMatrix.summary.totalInstallTargets} targets: ${expectedMatrix.summary.verifiedReadCount} verified-read, ${expectedMatrix.summary.linkedOnlyCount} linked-only)`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main();
}
