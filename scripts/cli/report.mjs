import path from 'node:path';
import { SUPPORTED_TARGETS } from './constants.mjs';

export function formatInstallerHelp() {
  const targetLines = Object.values(SUPPORTED_TARGETS).map(
    (t) => `  - ${t.id.padEnd(16, ' ')} [${t.confidence}] ${t.description}`,
  );
  return [
    '## BlendOps Distributable CLI & Safe Project-Local Installer (`blendops` / `scripts/install-skills.mjs`)',
    '',
    'CLI Usage:',
    '  blendops --version',
    '  blendops --help',
    '  blendops doctor [--target <name>] [--project <path>]',
    '  blendops install [--target <name>] --project <path> [--confirm-target-path] [--patch-agents-md] [--patch-claude-md] --dry-run',
    '  blendops install [--target <name>] --project <path> [--confirm-target-path] [--patch-agents-md] [--patch-claude-md] --write',
    '  blendops install --target claude-desktop --out <path> --dry-run',
    '  blendops install --target claude-desktop --out <path> --write',
    '  blendops rollback (--project <path> | --out <path>) [--force-rollback]',
    '  blendops glb-inspect <file.glb> [--strict-bounds] [--json]',
    '  blendops glb-handoff <file.glb> [--out-dir <dir>] [--viewer <stack>] [--synthetic] [--strict-bounds] [--json]',
    '  blendops glb-validate-manifest <manifest.json> [--json]',
    '  blendops catalog-search "<query>" [--project <dir>] [--type knowledge|recipe|all] [--domain <domain>] [--kind <kind>] [--skill <id>] [--blender-version <ver>] [--evidence-status <status>] [--limit <n>] [--json]',
    '  blendops catalog-resolve <id> [--project <dir>] [--json]',
    '  blendops catalog-validate [--project <dir>] [--json]',
    '  blendops catalog-eval [--json]',
    '  blendops scene-spec-validate <scene-spec.json> [--project <dir>] [--json]',
    '  blendops plan-compile --spec <scene-spec.json> [--project <dir>] [--out <execution-plan.json>] [--json]',
    '  blendops plan-inspect <execution-plan.json> [--json]',
    '  blendops runtime doctor [--project <dir>] [--config <runtime-config.json>] [--plan <execution-plan.json>] [--json]',
    '  blendops runtime inspect [--project <dir>] [--config <runtime-config.json>] [--json]',
    '  blendops runtime capabilities [--project <dir>] [--config <runtime-config.json>] [--json]',
    '  blendops operation list [--project <dir>] [--tier L0|L1|L2] [--category <cat>] [--runtime-path <path>] [--json]',
    '  blendops operation validate [--project <dir>] [--json]',
    '  blendops execution preflight --plan <execution-plan.json> [--project <dir>] [--config <runtime-config.json>] [--json]',
    '  blendops execution report <ledger-or-evidence.json> [--json]',
    '  blendops execution inspect <ledger-or-evidence.json> [--json]',
    '',
    'Repository Script Usage (equivalent):',
    '  node scripts/install-skills.mjs --doctor [--target <name>] [--project <path>]',
    '  node scripts/install-skills.mjs --target <name> --project <path> [--confirm-target-path] [--patch-agents-md] [--patch-claude-md] --dry-run',
    '  node scripts/install-skills.mjs --target <name> --project <path> [--confirm-target-path] [--patch-agents-md] [--patch-claude-md] --write',
    '  node scripts/install-skills.mjs --target claude-desktop --out <path> --dry-run',
    '  node scripts/install-skills.mjs --target claude-desktop --out <path> --write',
    '  node scripts/install-skills.mjs --rollback (--project <path> | --out <path>) [--force-rollback]',
    '  node scripts/install-skills.mjs --help',
    '',
    'Options:',
    '  --target <name>         Target profile (auto, claude-code, opencode, cursor, codex, gemini, antigravity, github-copilot, generic-project, claude-desktop)',
    '  --project <path>        Target project root directory (required for project-local targets)',
    '  --out, --output <path>  Output directory for bundle targets (--target claude-desktop)',
    '  --doctor                Run strictly read-only repository and target diagnostics',
    '  --dry-run               Inspect target and record a verified dry-run plan without modifying target files',
    '  --write                 Execute a previously recorded, non-stale dry-run plan with atomic writes and backups',
    '  --rollback              Restore pre-install backups and remove installer-created files from .blendops/install-manifest.json',
    '  --force-rollback        Override post-install file edit protection during --rollback (alias: --force)',
    '  --confirm-target-path   Confirm target-specific writes for documented linked-only targets (cursor .mdc, codex AGENTS.md)',
    '  --patch-agents-md       Create or append a managed BlendOps section in AGENTS.md with backup',
    '  --patch-claude-md       Create or append a managed BlendOps section in CLAUDE.md with backup',
    '  --allow-global          Rejected by BlendOps CLI (global writes are disabled)',
    '  --version, -v           Show CLI version and exit without writing files',
    '  --help, -h              Show this help output and exit without writing files',
    '',
    'Supported targets:',
    ...targetLines,
    '',
    'Boundaries:',
    '- Public npm CLI (blendops@1.0.0) and GitHub Agent Skills source (listed on skills.sh); no official marketplace listing, Blender install, or MCP setup.',
    '- Global files touched: No',
    '- Runtime status: Not Run',
    '- Artifact status: Not Produced',
    '- Runtime setup: Separate; not performed',
    '',
  ].join('\n');
}

export function formatInstallerReport(result) {
  const createdStr =
    result.filesCreated && result.filesCreated.length > 0
      ? result.filesCreated.join(', ')
      : 'none';
  const modifiedStr =
    result.filesModified && result.filesModified.length > 0
      ? result.filesModified.join(', ')
      : 'none';
  const skippedStr =
    result.filesSkipped && result.filesSkipped.length > 0
      ? result.filesSkipped.map((s) => `${s.path} (${s.reason})`).join('; ')
      : 'none';
  const backupsStr =
    result.backups && result.backups.length > 0
      ? result.backups.map((b) => (typeof b === 'string' ? b : `${b.path} -> ${b.backup_path}`)).join(', ')
      : 'none';
  const limitationsStr =
    result.limitations && result.limitations.length > 0
      ? result.limitations.join(' ')
      : 'Skill install is separate from runtime setup.';

  const lines = [
    '## BlendOps installer report',
    '',
    `- Target requested: ${result.targetRequested || result.targetSelected}`,
    `- Target selected: ${result.targetSelected}`,
    `- Resolved install mode: ${result.resolvedInstallMode || result.scope}`,
    `- Confidence: ${result.confidence}`,
    `- Mode: ${result.mode}`,
    `- Scope: ${result.scope}`,
    `- Project/out path: ${result.projectOrOutPath}`,
    `- Detected markers: ${
      result.detectedMarkers && result.detectedMarkers.length > 0
        ? result.detectedMarkers.map((d) => `${d.target} (${d.markers.join(', ')})`).join('; ')
        : 'none'
    }`,
    `- Files created: ${createdStr}`,
    `- Files modified: ${modifiedStr}`,
    `- Files skipped: ${skippedStr}`,
    `- Backups: ${backupsStr}`,
    `- Rollback manifest: ${result.rollbackManifestPath || 'none'}`,
    '- Global files touched: No',
    '- Runtime status: Not Run',
    '- Artifact status: Not Produced',
    '- Runtime setup: Separate; not performed',
    `- Limitations: ${limitationsStr}`,
  ];

  if (result.skillMdCountPerZip !== undefined) {
    lines.push(`- SKILL.md count if ZIP mode: ${result.skillMdCountPerZip} per ZIP (${result.zipCount || 14} ZIPs)`);
  }

  return `${lines.join('\n')}\n`;
}
