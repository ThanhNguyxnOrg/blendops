import fs from 'node:fs';
import path from 'node:path';
import { MANAGED_SECTION_END, MANAGED_SECTION_START } from './constants.mjs';

export function buildManagedBlendOpsSection({ selectedTarget, effectiveBehavior }) {
  return [
    MANAGED_SECTION_START,
    '## BlendOps Project-Local Guidance',
    '',
    `Target profile: \`${selectedTarget}\` (attachment mode: \`${effectiveBehavior}\`)`,
    '',
    'Read [`BLENDOPS.md`](./BLENDOPS.md) at the repository root for the canonical BlendOps workflow guidance, 2-path + CLI appendix runtime model, and evidence truth states.',
    '',
    '### Local Shared Knowledge & Recipe Catalog (`.blendops/catalog/`)',
    '',
    '- Installed locally at `.blendops/catalog/knowledge-catalog.json`, `.blendops/catalog/recipe-catalog.json`, and `.blendops/catalog/catalog-index.json` (plus schemas in `.blendops/catalog/schemas/`).',
    '- Query via CLI (`blendops catalog-search --project <dir> "<query>"`, `blendops catalog-resolve --project <dir> <id>`, `blendops plan-compile --project <dir> --spec <file>`) or read `.blendops/catalog/catalog-index.json` and `.blendops/catalog/recipe-catalog.json` directly when no CLI is invoked.',
    '',
    '- Skill install is separate from Blender runtime setup.',
    '- Runtime status: `Not Run`',
    '- Artifact status: `Not Produced`',
    '- Do not claim preview, render, or GLB artifacts without verified evidence.',
    MANAGED_SECTION_END,
  ].join('\n');
}

export function buildCanonicalBlendOpsMd(repoRoot, { selectedTarget, confidence, effectiveBehavior }) {
  const baseTemplate = fs
    .readFileSync(path.join(repoRoot, 'bundles', 'generic-project-local', 'BLENDOPS.md'), 'utf8')
    .trimEnd();
  return [
    MANAGED_SECTION_START,
    baseTemplate,
    '',
    '## Installer attachment metadata',
    '',
    `- Target selected: \`${selectedTarget}\``,
    `- Confidence: \`${confidence}\``,
    `- Attachment behavior: \`${effectiveBehavior}\``,
    '- Shared catalog installed: `.blendops/catalog/knowledge-catalog.json`, `.blendops/catalog/recipe-catalog.json`, `.blendops/catalog/catalog-index.json`',
    '- Runtime status: `Not Run`',
    '- Artifact status: `Not Produced`',
    MANAGED_SECTION_END,
    '',
  ].join('\n');
}

export function buildCursorRuleMdcManagedBlock({ selectedTarget, confidence }) {
  return [
    MANAGED_SECTION_START,
    '# BlendOps Cursor Project Rule',
    '',
    `Target profile: \`${selectedTarget}\` (\`${confidence}\`)`,
    '',
    'Refer to [`BLENDOPS.md`](../../BLENDOPS.md) at the project root for the full BlendOps workflow guidance, 2-path + CLI appendix runtime boundaries, and evidence truth states.',
    'Local shared catalog files are available at `.blendops/catalog/knowledge-catalog.json`, `.blendops/catalog/recipe-catalog.json`, and `.blendops/catalog/catalog-index.json`.',
    '',
    '- Skill install does not configure `.cursor/mcp.json`, install Blender, or run Blender.',
    '- Runtime status: `Not Run`',
    '- Artifact status: `Not Produced`',
    MANAGED_SECTION_END,
  ].join('\n');
}

export function buildCursorRuleMdcContent({ selectedTarget, confidence }) {
  return [
    '---',
    'description: BlendOps project-local workflow guidance for Blender planning, readiness, evidence, and handoff (Runtime: Not Run, Artifacts: Not Produced)',
    'globs:',
    'alwaysApply: false',
    '---',
    '',
    buildCursorRuleMdcManagedBlock({ selectedTarget, confidence }),
    '',
  ].join('\n');
}

export function countOccurrences(text, needle) {
  if (!needle) return 0;
  let count = 0;
  let pos = 0;
  while (true) {
    const idx = text.indexOf(needle, pos);
    if (idx === -1) break;
    count += 1;
    pos = idx + needle.length;
  }
  return count;
}

export function inspectManagedMarkers(text) {
  const startCount = countOccurrences(text, MANAGED_SECTION_START);
  const endCount = countOccurrences(text, MANAGED_SECTION_END);

  if (startCount === 0 && endCount === 0) {
    return {
      status: 'none',
      startIdx: -1,
      endIdx: -1,
      managedBlock: null,
    };
  }
  if (startCount !== 1 || endCount !== 1) {
    return {
      status: 'malformed',
      reason: `expected exactly 1 '${MANAGED_SECTION_START}' and 1 '${MANAGED_SECTION_END}', found ${startCount} start and ${endCount} end marker(s)`,
      startIdx: -1,
      endIdx: -1,
      managedBlock: null,
    };
  }

  const startIdx = text.indexOf(MANAGED_SECTION_START);
  const endIdx = text.indexOf(MANAGED_SECTION_END);
  if (endIdx < startIdx) {
    return {
      status: 'malformed',
      reason: `'${MANAGED_SECTION_END}' appears before '${MANAGED_SECTION_START}'`,
      startIdx,
      endIdx,
      managedBlock: null,
    };
  }

  return {
    status: 'valid',
    startIdx,
    endIdx,
    managedBlock: text.slice(startIdx, endIdx + MANAGED_SECTION_END.length),
  };
}

export function applyManagedBlockToDocument(existingContent, managedBlock, defaultHeaderTitle) {
  if (existingContent === null || existingContent === undefined) {
    if (!defaultHeaderTitle) {
      return managedBlock.endsWith('\n') ? managedBlock : `${managedBlock}\n`;
    }
    return `${defaultHeaderTitle}\n\n${managedBlock.trim()}\n`;
  }

  const markerInfo = inspectManagedMarkers(existingContent);
  if (markerInfo.status === 'malformed') {
    throw new Error(
      `Cannot apply managed BlendOps section: existing document has malformed markers (${markerInfo.reason}).`,
    );
  }

  if (markerInfo.status === 'valid') {
    const before = existingContent.slice(0, markerInfo.startIdx);
    const after = existingContent.slice(markerInfo.endIdx + MANAGED_SECTION_END.length);
    return `${before}${managedBlock.trim()}${after}`;
  }

  const trimmed = existingContent.trimEnd();
  return `${trimmed}\n\n${managedBlock.trim()}\n`;
}
