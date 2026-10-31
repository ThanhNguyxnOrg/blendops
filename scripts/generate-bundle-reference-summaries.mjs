#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import { extractNormalizedLevel2Headings } from './check-docs.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const DEFAULT_ROOT = process.cwd();

export const EXPECTED_CANONICAL_SKILL_COUNT = 48;
export const VALID_CAPABILITY_TIERS = new Set(['L0', 'L1', 'L2', 'L3']);
export const ROUTING_PARTICIPANT_IDS = new Set([
  'blendops-help',
  'recipe-fit-assessor',
  'pack-prerequisite-checker',
  'workflow-stage-router',
]);
export const VALID_HANDOFF_TYPES = new Set([
  'progression',
  'conditional',
  'fallback',
  'alternative',
  'upstream_reference',
  'boundary_delegation',
  'retry',
]);
export const VALID_PREDICATE_OPERATORS = new Set([
  'equals',
  'not_equals',
  'in',
  'not_in',
  'exists',
]);
export const SKILL_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const INPUT_NAME_PATTERN = /^[a-z0-9_]+$/;
export const PREDICATE_FIELD_PATTERN = /^[a-zA-Z0-9_.]+$/;
export const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/;
export const CLAUDE_DESKTOP_SUMMARY_FILE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/;
export const PORTABLE_PACKAGE_SUMMARY_FILE_PATTERN = /^skill-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/;

export const CLAUDE_DESKTOP_SKILLS_REL_DIR = 'bundles/claude-desktop-manual/references/skills';
export const PORTABLE_PACKAGE_REFS_REL_DIR = 'bundles/skill-package/blendops/references';
export const CLAUDE_DESKTOP_MANIFEST_REL_PATH = 'bundles/claude-desktop-manual/manifest.json';
export const PORTABLE_PACKAGE_MANIFEST_REL_PATH = 'bundles/skill-package/manifest.json';
export const SKILL_CONTRACT_SCHEMA_REL_PATH = 'schemas/skill-contract.schema.json';

export const PRESERVED_BUNDLE_FILES = [
  'bundles/claude-desktop-manual/README.md',
  'bundles/claude-desktop-manual/IMPORT_STEPS.md',
  'bundles/claude-desktop-manual/SKILL.md',
  'bundles/claude-desktop-manual/BLENDOPS_SINGLE_FILE.md',
  'bundles/claude-desktop-manual/INSTALL_REPORT_TEMPLATE.md',
  'bundles/claude-desktop-manual/manifest.json',
  'bundles/claude-desktop-manual/references/skill-map.md',
  'bundles/claude-desktop-manual/references/runtime-stacks.md',
  'bundles/claude-desktop-manual/references/evidence-rules.md',
  'bundles/claude-desktop-manual/references/install-boundary.md',
  'bundles/claude-desktop-manual/references/laws/evidence-before-done.md',
  'bundles/claude-desktop-manual/references/laws/official-runtime-only.md',
  'bundles/claude-desktop-manual/references/laws/no-arbitrary-python-interface.md',
  'bundles/claude-desktop-manual/references/laws/non-blender-user-language.md',
  'bundles/claude-desktop-manual/references/packs/product-hero-v0.md',
  'bundles/skill-package/README.md',
  'bundles/skill-package/blendops/SKILL.md',
  'bundles/skill-package/blendops/LICENSE.txt',
  'bundles/skill-package/blendops/agents/README.md',
  'bundles/skill-package/blendops/agents/openai.yaml',
  'bundles/skill-package/blendops/references/skill-map.md',
  'bundles/skill-package/blendops/references/runtime-stacks.md',
  'bundles/skill-package/blendops/references/evidence-rules.md',
  'bundles/skill-package/blendops/references/install-boundary.md',
  'bundles/skill-package/blendops/references/law-evidence-before-done.md',
  'bundles/skill-package/blendops/references/law-official-runtime-only.md',
  'bundles/skill-package/blendops/references/law-no-arbitrary-python-interface.md',
  'bundles/skill-package/blendops/references/law-non-blender-user-language.md',
  'bundles/skill-package/blendops/references/pack-product-hero-v0.md',
];

const compiledSchemaCache = new Map();

function getCompiledContractValidator(rootDir = DEFAULT_ROOT) {
  const resolvedRoot = path.resolve(rootDir);
  const candidateSchemaAbs = path.join(resolvedRoot, SKILL_CONTRACT_SCHEMA_REL_PATH);
  let schemaPath = path.join(REPO_ROOT, SKILL_CONTRACT_SCHEMA_REL_PATH);
  if (fs.existsSync(candidateSchemaAbs)) {
    schemaPath = assertSafePathWithinRoot(candidateSchemaAbs, resolvedRoot);
  }
  const realSchemaPath = fs.realpathSync(schemaPath);
  if (compiledSchemaCache.has(realSchemaPath)) {
    return compiledSchemaCache.get(realSchemaPath);
  }
  const schemaObj = JSON.parse(fs.readFileSync(realSchemaPath, 'utf8'));
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  const validateFn = ajv.compile(schemaObj);
  compiledSchemaCache.set(realSchemaPath, validateFn);
  return validateFn;
}

export function assertSafePathWithinRoot(absPath, rootDir) {
  const resolvedRoot = path.resolve(rootDir);
  const resolvedTarget = path.resolve(absPath);
  const rel = path.relative(resolvedRoot, resolvedTarget);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error(
      `Unsafe path outside repository root rejected: "${absPath}" (root: "${resolvedRoot}")`,
    );
  }

  if (fs.existsSync(resolvedRoot)) {
    const realRoot = fs.realpathSync(resolvedRoot);
    const segments = rel.split(path.sep).filter(Boolean);
    let currentPath = resolvedRoot;

    for (let i = 0; i < segments.length; i++) {
      currentPath = path.join(currentPath, segments[i]);
      let lstat = null;
      try {
        lstat = fs.lstatSync(currentPath);
      } catch {
        // Target or intermediate subdirectory does not exist yet
        break;
      }

      if (lstat.isSymbolicLink()) {
        let realTarget = '<broken-symlink>';
        try {
          realTarget = fs.realpathSync(currentPath);
        } catch {
          throw new Error(
            `Unsafe broken symbolic link rejected inside repository root: "${currentPath}"`,
          );
        }
        const realRel = path.relative(realRoot, realTarget);
        if (!realRel || realRel.startsWith('..') || path.isAbsolute(realRel)) {
          throw new Error(
            `Unsafe symbolic link escaping repository root rejected: "${currentPath}" -> "${realTarget}" (real root: "${realRoot}")`,
          );
        }
        throw new Error(
          `Unsafe symbolic link rejected at canonical or bundle path: "${currentPath}" -> "${realTarget}"`,
        );
      }

      const realCurrent = fs.realpathSync(currentPath);
      const realRel = path.relative(realRoot, realCurrent);
      if (!realRel || realRel.startsWith('..') || path.isAbsolute(realRel)) {
        throw new Error(
          `Unsafe path escaping repository real root rejected: "${currentPath}" -> "${realCurrent}" (real root: "${realRoot}")`,
        );
      }
    }
  }

  return resolvedTarget;
}

export function buildGeneratedFileNotice(skillId) {
  return `<!-- Generated by scripts/generate-bundle-reference-summaries.mjs from skills/${skillId}/SKILL.md and skills/${skillId}/contract.json. Run \`npm run bundles:summaries:build\` to regenerate. Do not edit manually. -->`;
}

function parseFrontmatter(markdownText, relPath, errors) {
  const match = String(markdownText || '').match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) {
    errors.push(`Missing YAML frontmatter in ${relPath}`);
    return { name: '', description: '' };
  }
  const fm = match[1];
  const nameMatch = fm.match(/^name:\s*(.+?)\s*$/m);
  const descMatch = fm.match(/^description:\s*(.+?)\s*$/m);
  const name = nameMatch ? nameMatch[1].trim() : '';
  const description = descMatch ? descMatch[1].trim() : '';
  if (!name) {
    errors.push(`Missing frontmatter 'name' in ${relPath}`);
  }
  if (!description) {
    errors.push(`Missing frontmatter 'description' in ${relPath}`);
  }
  return { name, description };
}

function stripHtmlComments(text) {
  return String(text || '').replace(/<!--[\s\S]*?-->/g, '');
}

function normalizeInlineMarkdown(text, skillId) {
  let cleaned = String(text || '')
    .trim()
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ');
  cleaned = cleaned.replace(/`references\/([^`]+)`/g, `\`skills/${skillId}/references/$1\``);
  cleaned = cleaned.replace(/`\.\.\/([a-z0-9-]+)\/SKILL\.md`/g, '`$1`');
  cleaned = cleaned.replace(/\.\.\/([a-z0-9-]+)\/SKILL\.md/g, '`$1`');
  cleaned = cleaned.replace(/`\.\.\/\.\.\/(laws|docs|packs)\/([^`]+)`/g, '`$1/$2`');
  return cleaned;
}

function extractMarkdownListItems(sectionBody, skillId) {
  const cleaned = stripHtmlComments(sectionBody);
  const lines = cleaned.split(/\r?\n/);
  const items = [];
  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;
    const bulletMatch = trimmed.match(/^(?:[-*]|\d+\.)\s+(.+?)\s*$/);
    if (bulletMatch) {
      items.push(normalizeInlineMarkdown(bulletMatch[1], skillId));
    }
  }
  return items;
}

function extractFirstParagraph(sectionBody, skillId) {
  const cleaned = stripHtmlComments(sectionBody).trim();
  if (!cleaned) return '';
  const paragraphs = cleaned
    .split(/\r?\n\s*\r?\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && !p.startsWith('#') && !p.startsWith('|') && !p.startsWith('```'));
  if (paragraphs.length === 0) return '';
  return normalizeInlineMarkdown(paragraphs[0], skillId);
}

function isValidScalarValue(val) {
  if (typeof val === 'string') return val.length >= 1;
  if (typeof val === 'number') return Number.isFinite(val);
  if (typeof val === 'boolean') return true;
  return false;
}

function validateAndNormalizeConditionGroup(rawGroup, locationLabel, contractRel, errors) {
  if (!rawGroup || typeof rawGroup !== 'object' || Array.isArray(rawGroup)) {
    errors.push(`Invalid ${locationLabel} in ${contractRel}: expected conditionGroup object`);
    return null;
  }
  const keys = Object.keys(rawGroup);
  if (keys.length !== 1 || (keys[0] !== 'all' && keys[0] !== 'any')) {
    errors.push(
      `Invalid ${locationLabel} in ${contractRel}: must contain exactly one condition mode ("all" or "any")`,
    );
    return null;
  }
  const mode = keys[0];
  const rawPredicates = rawGroup[mode];
  if (!Array.isArray(rawPredicates) || rawPredicates.length === 0) {
    errors.push(
      `Invalid ${locationLabel}.${mode} in ${contractRel}: expected non-empty array of predicates`,
    );
    return null;
  }

  const normalizedPredicates = [];
  for (let i = 0; i < rawPredicates.length; i++) {
    const pred = rawPredicates[i];
    const predLoc = `${locationLabel}.${mode}[${i}]`;
    if (!pred || typeof pred !== 'object' || Array.isArray(pred)) {
      errors.push(`Invalid predicate at ${predLoc} in ${contractRel}: expected object`);
      continue;
    }
    const predKeys = Object.keys(pred);
    for (const k of predKeys) {
      if (k !== 'field' && k !== 'operator' && k !== 'value') {
        errors.push(`Unknown property "${k}" at ${predLoc} in ${contractRel}`);
      }
    }
    if (typeof pred.field !== 'string' || !PREDICATE_FIELD_PATTERN.test(pred.field)) {
      errors.push(`Invalid predicate "field" at ${predLoc} in ${contractRel}`);
    }
    if (typeof pred.operator !== 'string' || !VALID_PREDICATE_OPERATORS.has(pred.operator)) {
      errors.push(
        `Invalid predicate "operator" "${String(pred.operator)}" at ${predLoc} in ${contractRel}`,
      );
    }
    if (!Object.hasOwn(pred, 'value') || pred.value === undefined) {
      errors.push(`Missing predicate "value" at ${predLoc} in ${contractRel}`);
    } else if (pred.operator === 'in' || pred.operator === 'not_in') {
      if (
        !Array.isArray(pred.value) ||
        pred.value.length === 0 ||
        !pred.value.every((v) => isValidScalarValue(v))
      ) {
        errors.push(
          `Invalid predicate "value" for operator "${pred.operator}" at ${predLoc} in ${contractRel}: expected non-empty scalar array`,
        );
      } else {
        const serializedSet = new Set(pred.value.map((v) => JSON.stringify(v)));
        if (serializedSet.size !== pred.value.length) {
          errors.push(
            `Duplicate items in predicate "value" array at ${predLoc} in ${contractRel}`,
          );
        }
      }
    } else if (pred.operator === 'exists') {
      if (typeof pred.value !== 'boolean') {
        errors.push(
          `Invalid predicate "value" for operator "exists" at ${predLoc} in ${contractRel}: expected boolean`,
        );
      }
    } else if (pred.operator === 'equals' || pred.operator === 'not_equals') {
      if (!isValidScalarValue(pred.value)) {
        errors.push(
          `Invalid predicate "value" for operator "${pred.operator}" at ${predLoc} in ${contractRel}: expected scalar string, number, or boolean`,
        );
      }
    }

    if (
      typeof pred.field === 'string' &&
      typeof pred.operator === 'string' &&
      Object.hasOwn(pred, 'value')
    ) {
      normalizedPredicates.push({
        field: pred.field,
        operator: pred.operator,
        value: Array.isArray(pred.value) ? [...pred.value] : pred.value,
      });
    }
  }

  return {
    mode,
    predicates: normalizedPredicates,
    [mode]: normalizedPredicates,
  };
}

function validateInputParameterEntry(entry, listLabel, index, contractRel, errors) {
  const itemLabel = `${listLabel}[${index}]`;
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    errors.push(
      `Invalid ${listLabel === 'inputs.required' ? 'required' : 'optional'} input at ${itemLabel} in ${contractRel}: expected object with name, type, and description`,
    );
    return null;
  }
  for (const key of Object.keys(entry)) {
    if (key !== 'name' && key !== 'type' && key !== 'description') {
      errors.push(`Unknown property "${key}" at ${itemLabel} in ${contractRel}`);
    }
  }
  if (typeof entry.name !== 'string' || !INPUT_NAME_PATTERN.test(entry.name.trim())) {
    errors.push(
      `Invalid or missing "name" at ${itemLabel} in ${contractRel} (must match ${INPUT_NAME_PATTERN})`,
    );
  }
  if (typeof entry.type !== 'string' || entry.type.trim().length < 2 || entry.type.trim().length > 64) {
    errors.push(
      `Invalid or missing "type" at ${itemLabel} in ${contractRel} (must be a string of length 2..64; never defaulted)`,
    );
  }
  if (
    typeof entry.description !== 'string' ||
    entry.description.trim().length < 5 ||
    entry.description.trim().length > 240
  ) {
    errors.push(
      `Invalid or missing "description" at ${itemLabel} in ${contractRel} (must be a string of length 5..240)`,
    );
  }

  if (
    typeof entry.name === 'string' &&
    typeof entry.type === 'string' &&
    typeof entry.description === 'string'
  ) {
    return {
      name: entry.name.trim(),
      type: entry.type.trim(),
      description: entry.description.trim(),
    };
  }
  return null;
}

export function discoverCanonicalSkillIds(rootDir = DEFAULT_ROOT, options = {}) {
  const { expectFullCatalog = true } = options;
  const resolvedRoot = path.resolve(rootDir);
  const errors = [];

  let skillsDir;
  try {
    skillsDir = assertSafePathWithinRoot(path.join(resolvedRoot, 'skills'), resolvedRoot);
  } catch (err) {
    return {
      ok: false,
      errors: [err.message],
      skillIds: [],
    };
  }

  if (!fs.existsSync(skillsDir) || !fs.statSync(skillsDir).isDirectory()) {
    return {
      ok: false,
      errors: [`Missing canonical skills directory: skills/`],
      skillIds: [],
    };
  }

  const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
  const rawNames = [];
  const seenNormalized = new Map();

  for (const entry of entries) {
    if (entry.name === '_template') continue;
    if (entry.isSymbolicLink()) {
      errors.push(
        `Unsafe symbolic link in canonical skills directory rejected: "skills/${entry.name}"`,
      );
      continue;
    }
    if (!entry.isDirectory()) continue;
    if (!SKILL_ID_PATTERN.test(entry.name)) {
      errors.push(
        `Invalid canonical skill directory name "skills/${entry.name}" (must match ${SKILL_ID_PATTERN})`,
      );
      continue;
    }
    const lower = entry.name.toLowerCase();
    if (seenNormalized.has(lower)) {
      errors.push(
        `Duplicate canonical skill ID detected: "${entry.name}" conflicts with "${seenNormalized.get(lower)}"`,
      );
      continue;
    }
    seenNormalized.set(lower, entry.name);
    rawNames.push(entry.name);
  }

  const skillIds = rawNames.sort((a, b) => a.localeCompare(b));

  if (expectFullCatalog && skillIds.length !== EXPECTED_CANONICAL_SKILL_COUNT) {
    errors.push(
      `Expected ${EXPECTED_CANONICAL_SKILL_COUNT} canonical skills in skills/, found ${skillIds.length}`,
    );
  }

  return {
    ok: errors.length === 0,
    errors,
    skillIds,
  };
}

export function loadAndValidateSkillSourcePair(skillId, catalogSkillSet, rootDir = DEFAULT_ROOT) {
  const resolvedRoot = path.resolve(rootDir);
  const errors = [];

  if (!SKILL_ID_PATTERN.test(String(skillId || ''))) {
    return {
      ok: false,
      errors: [`Unsafe or invalid skill ID "${skillId}"`],
      model: null,
    };
  }

  const skillMdRel = `skills/${skillId}/SKILL.md`;
  const contractRel = `skills/${skillId}/contract.json`;

  let skillDir;
  let skillMdAbs;
  let contractAbs;
  try {
    skillDir = assertSafePathWithinRoot(
      path.join(resolvedRoot, 'skills', skillId),
      resolvedRoot,
    );
    skillMdAbs = assertSafePathWithinRoot(path.join(skillDir, 'SKILL.md'), resolvedRoot);
    contractAbs = assertSafePathWithinRoot(path.join(skillDir, 'contract.json'), resolvedRoot);
  } catch (err) {
    return {
      ok: false,
      errors: [err.message],
      model: null,
    };
  }

  if (!fs.existsSync(skillMdAbs) || !fs.statSync(skillMdAbs).isFile()) {
    errors.push(`Missing canonical SKILL.md: ${skillMdRel}`);
  }
  if (!fs.existsSync(contractAbs) || !fs.statSync(contractAbs).isFile()) {
    errors.push(`Missing canonical contract.json: ${contractRel}`);
  }
  if (errors.length > 0) {
    return { ok: false, errors, model: null };
  }

  const skillMdText = fs.readFileSync(skillMdAbs, 'utf8');
  let contract;
  try {
    contract = JSON.parse(fs.readFileSync(contractAbs, 'utf8'));
  } catch (err) {
    errors.push(`Malformed JSON in ${contractRel}: ${err.message}`);
    return { ok: false, errors, model: null };
  }

  if (!contract || typeof contract !== 'object' || Array.isArray(contract)) {
    errors.push(`Invalid contract root in ${contractRel}: expected JSON object`);
    return { ok: false, errors, model: null };
  }

  const frontmatter = parseFrontmatter(skillMdText, skillMdRel, errors);
  if (frontmatter.name && frontmatter.name !== skillId) {
    errors.push(
      `Frontmatter name mismatch in ${skillMdRel}: expected "${skillId}", got "${frontmatter.name}"`,
    );
  }

  if (contract.id !== skillId) {
    errors.push(
      `Contract ID mismatch in ${contractRel}: expected "${skillId}", got "${String(contract.id)}"`,
    );
  }

  if (typeof contract.version !== 'string' || !SEMVER_PATTERN.test(contract.version.trim())) {
    errors.push(
      `Missing or invalid required "version" in ${contractRel}: expected semver X.Y.Z, got "${String(contract.version)}"`,
    );
  }

  for (const field of ['category', 'role', 'purpose', 'capabilityTier']) {
    if (typeof contract[field] !== 'string' || contract[field].trim().length === 0) {
      errors.push(`Missing or empty required string field "${field}" in ${contractRel}`);
    }
  }

  if (
    typeof contract.capabilityTier === 'string' &&
    !VALID_CAPABILITY_TIERS.has(contract.capabilityTier)
  ) {
    errors.push(
      `Unsupported capabilityTier "${contract.capabilityTier}" in ${contractRel} (allowed: ${Array.from(VALID_CAPABILITY_TIERS).join(', ')})`,
    );
  }

  // Validate routingPrecedence and full activationGate
  let normalizedRoutingPrecedence = null;
  const isRoutingParticipant = ROUTING_PARTICIPANT_IDS.has(skillId);
  if (isRoutingParticipant && !contract.routingPrecedence) {
    errors.push(
      `Missing required "routingPrecedence" for routing participant "${skillId}" in ${contractRel}`,
    );
  } else if (!isRoutingParticipant && contract.routingPrecedence !== undefined) {
    errors.push(
      `Unexpected "routingPrecedence" on non-routing skill "${skillId}" in ${contractRel}`,
    );
  } else if (contract.routingPrecedence !== undefined) {
    const rp = contract.routingPrecedence;
    if (!rp || typeof rp !== 'object' || Array.isArray(rp)) {
      errors.push(`Invalid "routingPrecedence" in ${contractRel}: expected object`);
    } else {
      if (rp.group !== 'entry-and-stage-routing') {
        errors.push(
          `Invalid routingPrecedence.group in ${contractRel}: expected "entry-and-stage-routing", got "${String(rp.group)}"`,
        );
      }
      if (!Number.isInteger(rp.rank) || rp.rank < 1 || rp.rank > 4) {
        errors.push(
          `Invalid routingPrecedence.rank in ${contractRel}: expected integer 1..4, got "${String(rp.rank)}"`,
        );
      }
      const gate = rp.activationGate;
      if (!gate || typeof gate !== 'object' || Array.isArray(gate)) {
        errors.push(`Missing or invalid "routingPrecedence.activationGate" in ${contractRel}`);
      } else {
        if (gate.goalClarity !== 'ambiguous_or_mixed' && gate.goalClarity !== 'clear') {
          errors.push(
            `Invalid routingPrecedence.activationGate.goalClarity in ${contractRel}: expected "ambiguous_or_mixed" or "clear", got "${String(gate.goalClarity)}"`,
          );
        }
        for (const boolKey of [
          'recipeSelected',
          'preflightPassed',
          'hasStageOrArtifactInventory',
        ]) {
          if (typeof gate[boolKey] !== 'boolean') {
            errors.push(
              `Invalid routingPrecedence.activationGate.${boolKey} in ${contractRel}: expected boolean, got "${String(gate[boolKey])}"`,
            );
          }
        }
        for (const key of Object.keys(gate)) {
          if (
            key !== 'goalClarity' &&
            key !== 'recipeSelected' &&
            key !== 'preflightPassed' &&
            key !== 'hasStageOrArtifactInventory'
          ) {
            errors.push(
              `Unknown property "routingPrecedence.activationGate.${key}" in ${contractRel}`,
            );
          }
        }
        normalizedRoutingPrecedence = {
          group: rp.group,
          rank: rp.rank,
          activationGate: {
            goalClarity: gate.goalClarity,
            recipeSelected: gate.recipeSelected,
            preflightPassed: gate.preflightPassed,
            hasStageOrArtifactInventory: gate.hasStageOrArtifactInventory,
          },
        };
      }
    }
  }

  if (!Array.isArray(contract.triggers) || contract.triggers.length === 0) {
    errors.push(`Missing or empty "triggers" array in ${contractRel}`);
  } else {
    for (let i = 0; i < contract.triggers.length; i++) {
      if (typeof contract.triggers[i] !== 'string' || contract.triggers[i].trim().length < 2) {
        errors.push(`Invalid trigger at triggers[${i}] in ${contractRel}`);
      }
    }
  }

  if (!Array.isArray(contract.exclusions) || contract.exclusions.length === 0) {
    errors.push(`Missing or empty "exclusions" array in ${contractRel}`);
  } else {
    for (let i = 0; i < contract.exclusions.length; i++) {
      const ex = contract.exclusions[i];
      if (!ex || typeof ex !== 'object' || Array.isArray(ex)) {
        errors.push(`Invalid exclusion entry at exclusions[${i}] in ${contractRel}`);
        continue;
      }
      for (const k of ['condition', 'delegateTo', 'reason']) {
        if (typeof ex[k] !== 'string' || ex[k].trim().length === 0) {
          errors.push(`Missing "${k}" in exclusions[${i}] of ${contractRel}`);
        }
      }
      if (typeof ex.delegateTo === 'string' && ex.delegateTo.trim()) {
        if (ex.delegateTo === skillId) {
          errors.push(`Self-delegation in exclusions[${i}] of ${contractRel}: "${ex.delegateTo}"`);
        } else if (catalogSkillSet && !catalogSkillSet.has(ex.delegateTo)) {
          errors.push(
            `Unknown exclusion delegateTo target "${ex.delegateTo}" in exclusions[${i}] of ${contractRel}`,
          );
        }
      }
    }
  }

  const normalizedRequiredInputs = [];
  const normalizedOptionalInputs = [];
  if (!contract.inputs || typeof contract.inputs !== 'object' || Array.isArray(contract.inputs)) {
    errors.push(`Missing "inputs" object in ${contractRel}`);
  } else {
    if (!Array.isArray(contract.inputs.required) || contract.inputs.required.length === 0) {
      errors.push(`Missing or empty "inputs.required" array in ${contractRel}`);
    } else {
      for (let i = 0; i < contract.inputs.required.length; i++) {
        const normReq = validateInputParameterEntry(
          contract.inputs.required[i],
          'inputs.required',
          i,
          contractRel,
          errors,
        );
        if (normReq) normalizedRequiredInputs.push(normReq);
      }
    }
    if (contract.inputs.optional !== undefined) {
      if (!Array.isArray(contract.inputs.optional)) {
        errors.push(`Invalid "inputs.optional" in ${contractRel}: expected array`);
      } else {
        for (let i = 0; i < contract.inputs.optional.length; i++) {
          const normOpt = validateInputParameterEntry(
            contract.inputs.optional[i],
            'inputs.optional',
            i,
            contractRel,
            errors,
          );
          if (normOpt) normalizedOptionalInputs.push(normOpt);
        }
      }
    }
  }

  if (!contract.outputs || typeof contract.outputs !== 'object' || Array.isArray(contract.outputs)) {
    errors.push(`Missing "outputs" object in ${contractRel}`);
  } else {
    if (!Array.isArray(contract.outputs.primary) || contract.outputs.primary.length === 0) {
      errors.push(`Missing or empty "outputs.primary" array in ${contractRel}`);
    } else {
      for (let i = 0; i < contract.outputs.primary.length; i++) {
        if (typeof contract.outputs.primary[i] !== 'string' || !contract.outputs.primary[i].trim()) {
          errors.push(`Invalid primary output at outputs.primary[${i}] in ${contractRel}`);
        }
      }
    }
    const tsp = contract.outputs.truthStatePolicy;
    if (!tsp || typeof tsp !== 'object' || Array.isArray(tsp)) {
      errors.push(`Missing "outputs.truthStatePolicy" in ${contractRel}`);
    } else {
      if (tsp.runtimeDefault !== 'Not Run') {
        errors.push(
          `Invalid outputs.truthStatePolicy.runtimeDefault in ${contractRel}: expected "Not Run", got "${String(tsp.runtimeDefault)}"`,
        );
      }
      if (tsp.artifactDefault !== 'Not Produced') {
        errors.push(
          `Invalid outputs.truthStatePolicy.artifactDefault in ${contractRel}: expected "Not Produced", got "${String(tsp.artifactDefault)}"`,
        );
      }
      if (tsp.mutationRule !== 'downgrade_only') {
        errors.push(
          `Invalid outputs.truthStatePolicy.mutationRule in ${contractRel}: expected "downgrade_only", got "${String(tsp.mutationRule)}"`,
        );
      }
    }
  }

  const normalizedHandoffs = [];
  if (!Array.isArray(contract.handoffs) || contract.handoffs.length === 0) {
    errors.push(`Missing or empty "handoffs" array in ${contractRel}`);
  } else {
    for (let i = 0; i < contract.handoffs.length; i++) {
      const h = contract.handoffs[i];
      if (!h || typeof h !== 'object' || Array.isArray(h)) {
        errors.push(`Invalid handoff at handoffs[${i}] in ${contractRel}`);
        continue;
      }
      for (const k of ['target', 'type', 'label']) {
        if (typeof h[k] !== 'string' || !h[k].trim()) {
          errors.push(`Missing "${k}" in handoffs[${i}] of ${contractRel}`);
        }
      }
      if (typeof h.type === 'string' && !VALID_HANDOFF_TYPES.has(h.type)) {
        errors.push(
          `Invalid handoff type "${h.type}" in handoffs[${i}] of ${contractRel}`,
        );
      }
      if (typeof h.target === 'string' && h.target.trim()) {
        if (h.target === skillId) {
          errors.push(`Self-handoff in handoffs[${i}] of ${contractRel}: "${h.target}"`);
        } else if (catalogSkillSet && !catalogSkillSet.has(h.target)) {
          errors.push(
            `Unknown handoff target "${h.target}" in handoffs[${i}] of ${contractRel}`,
          );
        }
      }

      const normWhen = validateAndNormalizeConditionGroup(
        h.when,
        `handoffs[${i}].when`,
        contractRel,
        errors,
      );

      let normRetryPolicy = null;
      if (h.type === 'retry') {
        if (!h.retryPolicy || typeof h.retryPolicy !== 'object' || Array.isArray(h.retryPolicy)) {
          errors.push(
            `Missing required "retryPolicy" for retry handoff at handoffs[${i}] in ${contractRel}`,
          );
        } else {
          if (
            !Number.isInteger(h.retryPolicy.maxAttempts) ||
            h.retryPolicy.maxAttempts < 1 ||
            h.retryPolicy.maxAttempts > 5
          ) {
            errors.push(
              `Invalid retryPolicy.maxAttempts at handoffs[${i}] in ${contractRel}: expected integer 1..5, got "${String(h.retryPolicy.maxAttempts)}"`,
            );
          }
          const normExit = validateAndNormalizeConditionGroup(
            h.retryPolicy.exitCondition,
            `handoffs[${i}].retryPolicy.exitCondition`,
            contractRel,
            errors,
          );
          if (normExit && Number.isInteger(h.retryPolicy.maxAttempts)) {
            normRetryPolicy = {
              maxAttempts: h.retryPolicy.maxAttempts,
              exitCondition: normExit,
            };
          }
        }
      } else if (h.retryPolicy !== undefined) {
        errors.push(
          `Unexpected "retryPolicy" on non-retry handoff (type="${String(h.type)}") at handoffs[${i}] in ${contractRel}`,
        );
      }

      if (
        typeof h.target === 'string' &&
        typeof h.type === 'string' &&
        typeof h.label === 'string' &&
        normWhen
      ) {
        normalizedHandoffs.push({
          target: h.target.trim(),
          type: h.type.trim(),
          label: h.label.trim(),
          when: normWhen,
          retryPolicy: normRetryPolicy,
        });
      }
    }
  }

  // Canonical JSON Schema validation via Ajv2020 against schemas/skill-contract.schema.json
  try {
    const validateContractSchema = getCompiledContractValidator(resolvedRoot);
    const schemaValid = validateContractSchema(contract);
    if (!schemaValid && Array.isArray(validateContractSchema.errors)) {
      for (const ajvErr of validateContractSchema.errors) {
        const loc = ajvErr.instancePath || '/';
        errors.push(
          `Schema violation in ${contractRel} at ${loc}: ${ajvErr.message} (${JSON.stringify(ajvErr.params)})`,
        );
      }
    }
  } catch (err) {
    errors.push(`Contract schema validator error for ${contractRel}: ${err.message}`);
  }

  const extracted = extractNormalizedLevel2Headings(skillMdText);
  const requiredSections = [
    'Purpose',
    'Quick start',
    'When to use',
    'When not to use',
    'Trigger phrases',
    'Official runtime boundary',
    'Cross-skill handoff',
    'Non-goals',
  ];
  for (const sec of requiredSections) {
    const count = extracted.counts.get(sec) || 0;
    if (count === 0) {
      errors.push(`Missing required section "## ${sec}" in ${skillMdRel}`);
    } else if (count > 1) {
      errors.push(`Duplicate section "## ${sec}" in ${skillMdRel}`);
    } else {
      const body = stripHtmlComments(extracted.sectionBodies.get(sec) || '').trim();
      if (!body) {
        errors.push(`Empty required section "## ${sec}" in ${skillMdRel}`);
      }
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors, model: null };
  }

  const purposeDetail = extractFirstParagraph(extracted.sectionBodies.get('Purpose'), skillId);
  const quickStartSteps = extractMarkdownListItems(
    extracted.sectionBodies.get('Quick start'),
    skillId,
  );
  const whenToUseItems = extractMarkdownListItems(
    extracted.sectionBodies.get('When to use'),
    skillId,
  );
  const nonGoalItems = extractMarkdownListItems(
    extracted.sectionBodies.get('Non-goals'),
    skillId,
  );
  const runtimeBoundarySummary = extractFirstParagraph(
    extracted.sectionBodies.get('Official runtime boundary'),
    skillId,
  );

  if (quickStartSteps.length === 0) {
    errors.push(`Section "## Quick start" in ${skillMdRel} has no extractable list steps`);
  }
  if (whenToUseItems.length === 0) {
    errors.push(`Section "## When to use" in ${skillMdRel} has no extractable list items`);
  }
  if (nonGoalItems.length === 0) {
    errors.push(`Section "## Non-goals" in ${skillMdRel} has no extractable list items`);
  }

  if (errors.length > 0) {
    return { ok: false, errors, model: null };
  }

  const model = {
    id: skillId,
    name: frontmatter.name,
    description: frontmatter.description,
    version: contract.version.trim(),
    category: contract.category.trim(),
    role: contract.role.trim(),
    capabilityTier: contract.capabilityTier.trim(),
    routingPrecedence: normalizedRoutingPrecedence,
    purpose: contract.purpose.trim(),
    purposeDetail:
      purposeDetail && purposeDetail !== contract.purpose.trim() ? purposeDetail : '',
    whenToUse: whenToUseItems,
    triggers: contract.triggers.map((t) => t.trim()),
    exclusions: contract.exclusions.map((ex) => ({
      condition: ex.condition.trim(),
      delegateTo: ex.delegateTo.trim(),
      reason: ex.reason.trim(),
    })),
    inputs: {
      required: normalizedRequiredInputs,
      optional: normalizedOptionalInputs,
    },
    outputs: {
      primary: contract.outputs.primary.map((o) => o.trim()),
      truthStatePolicy: {
        runtimeDefault: contract.outputs.truthStatePolicy.runtimeDefault,
        artifactDefault: contract.outputs.truthStatePolicy.artifactDefault,
        mutationRule: contract.outputs.truthStatePolicy.mutationRule,
      },
    },
    quickStart: quickStartSteps,
    handoffs: normalizedHandoffs,
    nonGoals: nonGoalItems,
    runtimeBoundarySummary,
  };

  return {
    ok: true,
    errors: [],
    model,
  };
}

export function formatPredicateExpression(pred) {
  return `${pred.field} ${pred.operator} ${JSON.stringify(pred.value)}`;
}

export function formatConditionGroupExpression(condGroup, prefix = 'when') {
  const mode = condGroup.mode || (Array.isArray(condGroup.all) ? 'all' : 'any');
  const predicates = condGroup.predicates || condGroup[mode] || [];
  return `\`${prefix}.${mode}: [${predicates.map(formatPredicateExpression).join('; ')}]\``;
}

export function formatRetryPolicyExpression(retryPolicy) {
  if (!retryPolicy) return '';
  return `; retryPolicy: \`maxAttempts=${retryPolicy.maxAttempts}\`, ${formatConditionGroupExpression(retryPolicy.exitCondition, 'exitCondition')}`;
}

export function formatRoutingPrecedenceLine(routingPrecedence) {
  const gate = routingPrecedence.activationGate;
  return `group \`${routingPrecedence.group}\`, rank \`${routingPrecedence.rank}\` | activationGate: \`goalClarity=${JSON.stringify(gate.goalClarity)}\`, \`recipeSelected=${JSON.stringify(gate.recipeSelected)}\`, \`preflightPassed=${JSON.stringify(gate.preflightPassed)}\`, \`hasStageOrArtifactInventory=${JSON.stringify(gate.hasStageOrArtifactInventory)}\``;
}

function parseConditionGroupExpression(mode, innerText) {
  const parts = String(innerText || '')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
  const predicates = parts.map((part) => {
    const match = part.match(/^([a-zA-Z0-9_.]+)\s+(equals|not_equals|in|not_in|exists)\s+(.+)$/);
    if (!match) {
      throw new Error(`Unable to parse rendered predicate expression: "${part}"`);
    }
    return {
      field: match[1],
      operator: match[2],
      value: JSON.parse(match[3]),
    };
  });
  return { [mode]: predicates };
}

export function extractSummaryRoutingSemantics(markdownText) {
  const text = String(markdownText || '');
  const lines = text.split(/\r?\n/);

  let routingPrecedence = null;
  const routingRe =
    /group `([^`]+)`, rank `(\d+)` \| activationGate: `goalClarity=("[^"]+")`, `recipeSelected=(true|false)`, `preflightPassed=(true|false)`, `hasStageOrArtifactInventory=(true|false)`/;
  for (const line of lines) {
    const m = line.match(routingRe);
    if (m) {
      routingPrecedence = {
        group: m[1],
        rank: Number(m[2]),
        activationGate: {
          goalClarity: JSON.parse(m[3]),
          recipeSelected: JSON.parse(m[4]),
          preflightPassed: JSON.parse(m[5]),
          hasStageOrArtifactInventory: JSON.parse(m[6]),
        },
      };
      break;
    }
  }

  const handoffs = [];
  const handoffLineRe =
    /^- (?:\*\*\[([a-z_]+)\]\*\*|\[([a-z_]+)\]) (.+?) → `([a-z0-9-]+)` \(`references\/(?:skills\/[a-z0-9-]+\.md|skill-[a-z0-9-]+\.md)`\) — `when\.(all|any): \[(.+?)\]`(?:; retryPolicy: `maxAttempts=(\d+)`, `exitCondition\.(all|any): \[(.+?)\]`)?$/;

  for (const line of lines) {
    const m = line.match(handoffLineRe);
    if (!m) continue;
    const type = m[1] || m[2];
    const label = m[3];
    const target = m[4];
    const whenMode = m[5];
    const whenInner = m[6];
    const maxAttemptsRaw = m[7];
    const exitMode = m[8];
    const exitInner = m[9];

    const entry = {
      target,
      type,
      label,
      when: parseConditionGroupExpression(whenMode, whenInner),
    };
    if (maxAttemptsRaw !== undefined && exitMode && exitInner !== undefined) {
      entry.retryPolicy = {
        maxAttempts: Number(maxAttemptsRaw),
        exitCondition: parseConditionGroupExpression(exitMode, exitInner),
      };
    }
    handoffs.push(entry);
  }

  return {
    routingPrecedence,
    handoffs,
  };
}

export function renderClaudeDesktopSummary(model) {
  const lines = [];
  lines.push(buildGeneratedFileNotice(model.id));
  lines.push(`# ${model.id} (reference summary)`);
  lines.push('');
  lines.push('## Purpose');
  lines.push(model.purpose);
  if (model.purposeDetail) {
    lines.push('');
    lines.push(model.purposeDetail);
  }
  lines.push('');
  lines.push('## Metadata & truth boundary');
  lines.push(`- **Canonical skill:** \`skills/${model.id}/SKILL.md\``);
  lines.push(`- **Contract:** \`skills/${model.id}/contract.json\` (\`v${model.version}\`)`);
  lines.push(`- **Category / role:** \`${model.category}\` / \`${model.role}\``);
  lines.push(`- **Capability tier:** \`${model.capabilityTier}\``);
  if (model.routingPrecedence) {
    lines.push(
      `- **Routing precedence:** ${formatRoutingPrecedenceLine(model.routingPrecedence)}`,
    );
  }
  lines.push(
    `- **Truth-state policy:** Runtime status defaults to \`${model.outputs.truthStatePolicy.runtimeDefault}\`; Artifact status defaults to \`${model.outputs.truthStatePolicy.artifactDefault}\`; mutation rule is \`${model.outputs.truthStatePolicy.mutationRule}\` (never upgrade without verified evidence).`,
  );
  lines.push('');
  lines.push('## When to use');
  for (const item of model.whenToUse) {
    lines.push(`- ${item}`);
  }
  lines.push('');
  lines.push('## Trigger cues');
  for (const trigger of model.triggers) {
    lines.push(`- "${trigger}"`);
  }
  lines.push('');
  lines.push('## When not to use');
  for (const ex of model.exclusions) {
    lines.push(
      `- ${ex.condition} → delegate to \`${ex.delegateTo}\` (\`references/skills/${ex.delegateTo}.md\`; ${ex.reason})`,
    );
  }
  lines.push('');
  lines.push('## Inputs & output/evidence contract');
  lines.push('### Required inputs');
  for (const req of model.inputs.required) {
    lines.push(`- \`${req.name}\` (\`${req.type}\`): ${req.description}`);
  }
  if (model.inputs.optional.length > 0) {
    lines.push('');
    lines.push('### Optional inputs');
    for (const opt of model.inputs.optional) {
      lines.push(`- \`${opt.name}\` (\`${opt.type}\`): ${opt.description}`);
    }
  }
  lines.push('');
  lines.push('### Primary outputs');
  for (const out of model.outputs.primary) {
    lines.push(`- \`${out}\``);
  }
  lines.push('');
  lines.push('## Quick-start procedure');
  for (let i = 0; i < model.quickStart.length; i++) {
    lines.push(`${i + 1}. ${model.quickStart[i]}`);
  }
  lines.push('');
  lines.push('## Handoff notes');
  for (const h of model.handoffs) {
    lines.push(
      `- **[${h.type}]** ${h.label} → \`${h.target}\` (\`references/skills/${h.target}.md\`) — ${formatConditionGroupExpression(h.when, 'when')}${formatRetryPolicyExpression(h.retryPolicy)}`,
    );
  }
  lines.push('');
  lines.push('## Safety boundaries & non-goals');
  if (model.runtimeBoundarySummary) {
    lines.push(`- **Runtime boundary:** ${model.runtimeBoundarySummary}`);
  }
  for (const ng of model.nonGoals) {
    lines.push(`- ${ng}`);
  }
  lines.push('');
  return lines.join('\n');
}

export function renderPortablePackageSummary(model) {
  const lines = [];
  lines.push(buildGeneratedFileNotice(model.id));
  lines.push(`# ${model.id}`);
  lines.push('');
  lines.push(`Purpose: ${model.purpose}`);
  if (model.purposeDetail) {
    lines.push('');
    lines.push(model.purposeDetail);
  }
  lines.push('');
  lines.push(
    `Metadata: Contract \`v${model.version}\` | Category \`${model.category}\` | Role \`${model.role}\` | Tier \`${model.capabilityTier}\` | Runtime default \`${model.outputs.truthStatePolicy.runtimeDefault}\` | Artifact default \`${model.outputs.truthStatePolicy.artifactDefault}\` | Mutation \`${model.outputs.truthStatePolicy.mutationRule}\``,
  );
  if (model.routingPrecedence) {
    lines.push(
      `Routing precedence: ${formatRoutingPrecedenceLine(model.routingPrecedence)}`,
    );
  }
  lines.push('');
  lines.push('## When to use & trigger cues');
  for (const item of model.whenToUse) {
    lines.push(`- ${item}`);
  }
  lines.push(
    `- Trigger phrases: ${model.triggers.map((t) => `"${t}"`).join(', ')}`,
  );
  lines.push('');
  lines.push('## When not to use (delegation boundaries)');
  for (const ex of model.exclusions) {
    lines.push(
      `- ${ex.condition} → use \`${ex.delegateTo}\` (\`references/skill-${ex.delegateTo}.md\`; ${ex.reason})`,
    );
  }
  lines.push('');
  lines.push('## Input & output contract');
  for (const req of model.inputs.required) {
    lines.push(`- Required input \`${req.name}\` (\`${req.type}\`): ${req.description}`);
  }
  for (const opt of model.inputs.optional) {
    lines.push(`- Optional input \`${opt.name}\` (\`${opt.type}\`): ${opt.description}`);
  }
  lines.push(
    `- Output contract: ${model.outputs.primary.map((o) => `\`${o}\``).join(', ')} (Runtime status: \`${model.outputs.truthStatePolicy.runtimeDefault}\`, Artifact status: \`${model.outputs.truthStatePolicy.artifactDefault}\`, \`${model.outputs.truthStatePolicy.mutationRule}\`).`,
  );
  lines.push('');
  lines.push('## Quick-start steps');
  for (let i = 0; i < model.quickStart.length; i++) {
    lines.push(`${i + 1}. ${model.quickStart[i]}`);
  }
  lines.push('');
  lines.push('## Cross-skill handoffs');
  for (const h of model.handoffs) {
    lines.push(
      `- [${h.type}] ${h.label} → \`${h.target}\` (\`references/skill-${h.target}.md\`) — ${formatConditionGroupExpression(h.when, 'when')}${formatRetryPolicyExpression(h.retryPolicy)}`,
    );
  }
  lines.push('');
  lines.push('## Safety boundaries & non-goals');
  if (model.runtimeBoundarySummary) {
    lines.push(`- Runtime boundary: ${model.runtimeBoundarySummary}`);
  }
  for (const ng of model.nonGoals) {
    lines.push(`- ${ng}`);
  }
  lines.push('');
  return lines.join('\n');
}

function isClaudeDesktopSkillEntryPath(entryPath) {
  return /^references\/skills\/[^/]+\.md$/.test(String(entryPath || ''));
}

function isPortablePackageSkillEntryPath(entryPath) {
  const p = String(entryPath || '');
  if (p === 'blendops/references/skill-map.md' || p === 'references/skill-map.md') {
    return false;
  }
  return /^(?:blendops\/)?references\/skill-[^/]+\.md$/.test(p);
}

export function validateExistingManifestStructure(
  existingManifestObj,
  manifestRelPath = CLAUDE_DESKTOP_MANIFEST_REL_PATH,
  { allowDuplicateSkillPaths = false, profile = 'claude-desktop-manual' } = {},
) {
  const errors = [];
  if (
    !existingManifestObj ||
    typeof existingManifestObj !== 'object' ||
    Array.isArray(existingManifestObj)
  ) {
    return [`Invalid JSON object in ${manifestRelPath}: expected top-level object`];
  }
  if (!Array.isArray(existingManifestObj.files)) {
    return [`Missing or non-array "files" in ${manifestRelPath}`];
  }

  const isSkillPath =
    profile === 'claude-desktop-manual'
      ? isClaudeDesktopSkillEntryPath
      : isPortablePackageSkillEntryPath;

  const seenPaths = new Map();
  for (let i = 0; i < existingManifestObj.files.length; i++) {
    const entry = existingManifestObj.files[i];
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      errors.push(
        `Malformed manifest entry in ${manifestRelPath} at files[${i}]: expected non-null object`,
      );
      continue;
    }
    if (typeof entry.path !== 'string' || entry.path.trim().length === 0) {
      errors.push(
        `Malformed manifest entry in ${manifestRelPath} at files[${i}]: missing or non-string "path"`,
      );
      continue;
    }
    if (entry.path !== entry.path.trim()) {
      errors.push(
        `Malformed manifest entry in ${manifestRelPath} at files[${i}]: "path" has leading or trailing whitespace`,
      );
      continue;
    }
    if (
      entry.purpose !== undefined &&
      (typeof entry.purpose !== 'string' || entry.purpose.trim().length === 0)
    ) {
      errors.push(
        `Malformed manifest entry in ${manifestRelPath} at files[${i}]: "purpose" must be a non-empty string`,
      );
      continue;
    }
    if (seenPaths.has(entry.path)) {
      const firstIndex = seenPaths.get(entry.path);
      if (!allowDuplicateSkillPaths || !isSkillPath(entry.path)) {
        errors.push(
          `Duplicate manifest entry path "${entry.path}" in ${manifestRelPath} at files[${i}] (first seen at files[${firstIndex}])`,
        );
      }
    } else {
      seenPaths.set(entry.path, i);
    }
  }

  return errors;
}

export function buildUpdatedBundleManifest(
  existingManifestObj,
  models,
  {
    profile = 'claude-desktop-manual',
    manifestRelPath = profile === 'claude-desktop-manual'
      ? CLAUDE_DESKTOP_MANIFEST_REL_PATH
      : PORTABLE_PACKAGE_MANIFEST_REL_PATH,
  } = {},
) {
  const structErrors = validateExistingManifestStructure(existingManifestObj, manifestRelPath, {
    allowDuplicateSkillPaths: false,
    profile,
  });
  if (structErrors.length > 0) {
    throw new Error(structErrors.join('; '));
  }

  const isSkillPath =
    profile === 'claude-desktop-manual'
      ? isClaudeDesktopSkillEntryPath
      : isPortablePackageSkillEntryPath;

  const sortedModels = [...models].sort((a, b) => a.id.localeCompare(b.id));
  const generatedEntries = sortedModels.map((m) => {
    if (profile === 'claude-desktop-manual') {
      return {
        path: `references/skills/${m.id}.md`,
        purpose: `Generated Claude Desktop reference summary for ${m.id} (${m.category})`,
      };
    }
    return {
      path: `blendops/references/skill-${m.id}.md`,
      purpose: `Generated portable skill-package reference summary for ${m.id} (${m.category})`,
    };
  });

  const beforeEntries = [];
  const afterEntries = [];
  let seenFirstSkillEntry = false;

  for (const entry of existingManifestObj.files) {
    if (isSkillPath(entry.path)) {
      seenFirstSkillEntry = true;
      continue;
    }
    const clonedEntry = structuredClone(entry);
    if (!seenFirstSkillEntry) {
      beforeEntries.push(clonedEntry);
    } else {
      afterEntries.push(clonedEntry);
    }
  }

  const nextManifest = structuredClone(existingManifestObj);
  nextManifest.files = [...beforeEntries, ...generatedEntries, ...afterEntries];
  return `${JSON.stringify(nextManifest, null, 2)}\n`;
}

export function validateBundleManifestAgainstModels(
  manifestObj,
  models,
  manifestRelPath,
  { profile = 'claude-desktop-manual' } = {},
) {
  const errors = validateExistingManifestStructure(manifestObj, manifestRelPath, {
    allowDuplicateSkillPaths: true,
    profile,
  });
  if (
    !manifestObj ||
    typeof manifestObj !== 'object' ||
    Array.isArray(manifestObj) ||
    !Array.isArray(manifestObj.files)
  ) {
    return errors;
  }

  const isSkillPath =
    profile === 'claude-desktop-manual'
      ? isClaudeDesktopSkillEntryPath
      : isPortablePackageSkillEntryPath;

  const expectedPaths = models.map((m) =>
    profile === 'claude-desktop-manual'
      ? `references/skills/${m.id}.md`
      : `blendops/references/skill-${m.id}.md`,
  );
  const expectedSet = new Set(expectedPaths);
  const counts = new Map();

  for (let i = 0; i < manifestObj.files.length; i++) {
    const item = manifestObj.files[i];
    if (!item || typeof item !== 'object' || Array.isArray(item) || typeof item.path !== 'string') {
      continue;
    }
    if (isSkillPath(item.path)) {
      counts.set(item.path, (counts.get(item.path) || 0) + 1);
      if (!expectedSet.has(item.path)) {
        errors.push(`Stale or unknown skill summary entry in ${manifestRelPath}: "${item.path}"`);
      }
    }
  }

  for (const exp of expectedPaths) {
    const count = counts.get(exp) || 0;
    if (count === 0) {
      errors.push(`Missing generated skill summary entry in ${manifestRelPath}: "${exp}"`);
    } else if (count > 1) {
      errors.push(
        `Duplicate generated skill summary entry in ${manifestRelPath}: "${exp}" (found ${count} times)`,
      );
    }
  }

  return errors;
}

export function computeBundleSummaryPlan(rootDir = DEFAULT_ROOT, options = {}) {
  const { expectFullCatalog = true } = options;
  const resolvedRoot = path.resolve(rootDir);
  const discovery = discoverCanonicalSkillIds(resolvedRoot, { expectFullCatalog });
  const errors = [...discovery.errors];

  const catalogSkillSet = new Set(discovery.skillIds);
  const models = [];

  for (const skillId of discovery.skillIds) {
    const res = loadAndValidateSkillSourcePair(skillId, catalogSkillSet, resolvedRoot);
    if (!res.ok) {
      errors.push(...res.errors);
    } else if (res.model) {
      models.push(res.model);
    }
  }

  if (errors.length > 0) {
    return {
      ok: false,
      errors,
      skillIds: discovery.skillIds,
      models: [],
      expectedFiles: new Map(),
      manifestUpdates: new Map(),
    };
  }

  const expectedFiles = new Map();
  try {
    assertSafePathWithinRoot(path.join(resolvedRoot, CLAUDE_DESKTOP_SKILLS_REL_DIR), resolvedRoot);
    assertSafePathWithinRoot(path.join(resolvedRoot, PORTABLE_PACKAGE_REFS_REL_DIR), resolvedRoot);
  } catch (err) {
    errors.push(err.message);
  }

  for (const model of models) {
    const claudeRel = `${CLAUDE_DESKTOP_SKILLS_REL_DIR}/${model.id}.md`;
    const portableRel = `${PORTABLE_PACKAGE_REFS_REL_DIR}/skill-${model.id}.md`;

    try {
      assertSafePathWithinRoot(path.join(resolvedRoot, claudeRel), resolvedRoot);
      assertSafePathWithinRoot(path.join(resolvedRoot, portableRel), resolvedRoot);
    } catch (err) {
      errors.push(err.message);
      continue;
    }

    expectedFiles.set(claudeRel, renderClaudeDesktopSummary(model));
    expectedFiles.set(portableRel, renderPortablePackageSummary(model));
  }

  const manifestUpdates = new Map();
  let claudeManifestAbs = null;
  try {
    claudeManifestAbs = assertSafePathWithinRoot(
      path.join(resolvedRoot, CLAUDE_DESKTOP_MANIFEST_REL_PATH),
      resolvedRoot,
    );
  } catch (err) {
    errors.push(err.message);
  }

  if (claudeManifestAbs) {
    if (!fs.existsSync(claudeManifestAbs)) {
      errors.push(`Missing required bundle manifest: ${CLAUDE_DESKTOP_MANIFEST_REL_PATH}`);
    } else {
      try {
        const existingClaudeManifest = JSON.parse(fs.readFileSync(claudeManifestAbs, 'utf8'));
        manifestUpdates.set(
          CLAUDE_DESKTOP_MANIFEST_REL_PATH,
          buildUpdatedBundleManifest(existingClaudeManifest, models, {
            profile: 'claude-desktop-manual',
            manifestRelPath: CLAUDE_DESKTOP_MANIFEST_REL_PATH,
          }),
        );
      } catch (err) {
        errors.push(`Invalid manifest in ${CLAUDE_DESKTOP_MANIFEST_REL_PATH}: ${err.message}`);
      }
    }
  }

  let portableManifestAbs = null;
  try {
    portableManifestAbs = assertSafePathWithinRoot(
      path.join(resolvedRoot, PORTABLE_PACKAGE_MANIFEST_REL_PATH),
      resolvedRoot,
    );
  } catch (err) {
    errors.push(err.message);
  }

  if (portableManifestAbs && fs.existsSync(portableManifestAbs)) {
    try {
      const existingPortableManifest = JSON.parse(fs.readFileSync(portableManifestAbs, 'utf8'));
      manifestUpdates.set(
        PORTABLE_PACKAGE_MANIFEST_REL_PATH,
        buildUpdatedBundleManifest(existingPortableManifest, models, {
          profile: 'skill-package',
          manifestRelPath: PORTABLE_PACKAGE_MANIFEST_REL_PATH,
        }),
      );
    } catch (err) {
      errors.push(`Invalid manifest in ${PORTABLE_PACKAGE_MANIFEST_REL_PATH}: ${err.message}`);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    skillIds: discovery.skillIds,
    models,
    expectedFiles,
    manifestUpdates,
  };
}

export function generateBundleReferenceSummaries(rootDir = DEFAULT_ROOT, options = {}) {
  const resolvedRoot = path.resolve(rootDir);
  const plan = computeBundleSummaryPlan(resolvedRoot, options);
  const preflightErrors = [...plan.errors];

  let claudeSkillsDirAbs = null;
  let portableRefsDirAbs = null;
  try {
    claudeSkillsDirAbs = assertSafePathWithinRoot(
      path.join(resolvedRoot, CLAUDE_DESKTOP_SKILLS_REL_DIR),
      resolvedRoot,
    );
    portableRefsDirAbs = assertSafePathWithinRoot(
      path.join(resolvedRoot, PORTABLE_PACKAGE_REFS_REL_DIR),
      resolvedRoot,
    );
  } catch (err) {
    preflightErrors.push(err.message);
  }

  const staleTargetsToRemove = [];

  // Preflight existing directory entries before mutating anything on disk
  if (claudeSkillsDirAbs && fs.existsSync(claudeSkillsDirAbs)) {
    const lstatDir = fs.lstatSync(claudeSkillsDirAbs);
    if (!lstatDir.isDirectory()) {
      preflightErrors.push(
        `Expected directory at ${CLAUDE_DESKTOP_SKILLS_REL_DIR}, found non-directory`,
      );
    } else {
      for (const ent of fs.readdirSync(claudeSkillsDirAbs, { withFileTypes: true })) {
        const rel = `${CLAUDE_DESKTOP_SKILLS_REL_DIR}/${ent.name}`;
        const abs = path.join(claudeSkillsDirAbs, ent.name);
        try {
          assertSafePathWithinRoot(abs, resolvedRoot);
        } catch (err) {
          preflightErrors.push(err.message);
          continue;
        }
        if (!ent.isFile()) {
          preflightErrors.push(`Unexpected non-file entry in ${CLAUDE_DESKTOP_SKILLS_REL_DIR}: ${rel}`);
          continue;
        }
        if (
          CLAUDE_DESKTOP_SUMMARY_FILE_PATTERN.test(ent.name) &&
          !plan.expectedFiles.has(rel)
        ) {
          staleTargetsToRemove.push({ rel, abs });
        }
      }
    }
  }

  if (portableRefsDirAbs && fs.existsSync(portableRefsDirAbs)) {
    const lstatDir = fs.lstatSync(portableRefsDirAbs);
    if (!lstatDir.isDirectory()) {
      preflightErrors.push(
        `Expected directory at ${PORTABLE_PACKAGE_REFS_REL_DIR}, found non-directory`,
      );
    } else {
      for (const ent of fs.readdirSync(portableRefsDirAbs, { withFileTypes: true })) {
        if (ent.name === 'skill-map.md') continue;
        if (!ent.name.startsWith('skill-')) continue;
        const rel = `${PORTABLE_PACKAGE_REFS_REL_DIR}/${ent.name}`;
        const abs = path.join(portableRefsDirAbs, ent.name);
        try {
          assertSafePathWithinRoot(abs, resolvedRoot);
        } catch (err) {
          preflightErrors.push(err.message);
          continue;
        }
        if (!ent.isFile()) {
          preflightErrors.push(`Unexpected non-file entry in ${PORTABLE_PACKAGE_REFS_REL_DIR}: ${rel}`);
          continue;
        }
        if (
          PORTABLE_PACKAGE_SUMMARY_FILE_PATTERN.test(ent.name) &&
          !plan.expectedFiles.has(rel)
        ) {
          staleTargetsToRemove.push({ rel, abs });
        }
      }
    }
  }

  if (preflightErrors.length > 0) {
    return {
      ok: false,
      errors: preflightErrors,
      skillCount: plan.models.length,
      generatedCount: 0,
      writtenFiles: [],
      removedStaleFiles: [],
    };
  }

  fs.mkdirSync(claudeSkillsDirAbs, { recursive: true });
  fs.mkdirSync(portableRefsDirAbs, { recursive: true });

  const removedStaleFiles = [];
  for (const stale of staleTargetsToRemove) {
    const safeAbs = assertSafePathWithinRoot(stale.abs, resolvedRoot);
    fs.unlinkSync(safeAbs);
    removedStaleFiles.push(stale.rel);
  }

  const writtenFiles = [];
  for (const [relPath, content] of plan.expectedFiles.entries()) {
    const absPath = assertSafePathWithinRoot(path.join(resolvedRoot, relPath), resolvedRoot);
    fs.writeFileSync(absPath, content, 'utf8');
    writtenFiles.push(relPath);
  }

  for (const [manifestRel, content] of plan.manifestUpdates.entries()) {
    const absPath = assertSafePathWithinRoot(path.join(resolvedRoot, manifestRel), resolvedRoot);
    fs.writeFileSync(absPath, content, 'utf8');
  }

  return {
    ok: true,
    errors: [],
    skillCount: plan.models.length,
    generatedCount: writtenFiles.length,
    writtenFiles,
    removedStaleFiles,
  };
}

export function checkBundleReferenceSummaries(rootDir = DEFAULT_ROOT, options = {}) {
  const resolvedRoot = path.resolve(rootDir);
  const plan = computeBundleSummaryPlan(resolvedRoot, options);
  const errors = [...plan.errors];

  if (plan.models.length === 0) {
    return {
      ok: false,
      errors,
      skillCount: plan.models.length,
      expectedSummaryCount: plan.expectedFiles.size,
    };
  }

  // Verify preserved non-skill bundle files exist
  for (const preservedRel of PRESERVED_BUNDLE_FILES) {
    try {
      const abs = assertSafePathWithinRoot(path.join(resolvedRoot, preservedRel), resolvedRoot);
      if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
        errors.push(`Missing preserved bundle file: ${preservedRel}`);
      }
    } catch (err) {
      errors.push(err.message);
    }
  }

  // Verify all 96 expected summary files exist and match byte-for-byte
  for (const [relPath, expectedContent] of plan.expectedFiles.entries()) {
    let absPath;
    try {
      absPath = assertSafePathWithinRoot(path.join(resolvedRoot, relPath), resolvedRoot);
    } catch (err) {
      errors.push(err.message);
      continue;
    }
    if (!fs.existsSync(absPath) || !fs.statSync(absPath).isFile()) {
      errors.push(
        `Missing generated bundle summary: ${relPath} (run "npm run bundles:summaries:build")`,
      );
      continue;
    }
    const actualContent = fs.readFileSync(absPath, 'utf8');
    if (actualContent !== expectedContent) {
      errors.push(
        `Stale or manually modified bundle summary: ${relPath} does not match canonical SKILL.md + contract.json (run "npm run bundles:summaries:build")`,
      );
    }
  }

  // Check for unexpected or stale files in bundles/claude-desktop-manual/references/skills/
  try {
    const claudeSkillsDirAbs = assertSafePathWithinRoot(
      path.join(resolvedRoot, CLAUDE_DESKTOP_SKILLS_REL_DIR),
      resolvedRoot,
    );
    if (fs.existsSync(claudeSkillsDirAbs) && fs.statSync(claudeSkillsDirAbs).isDirectory()) {
      for (const ent of fs.readdirSync(claudeSkillsDirAbs, { withFileTypes: true })) {
        const rel = `${CLAUDE_DESKTOP_SKILLS_REL_DIR}/${ent.name}`;
        try {
          assertSafePathWithinRoot(path.join(claudeSkillsDirAbs, ent.name), resolvedRoot);
        } catch (err) {
          errors.push(err.message);
          continue;
        }
        if (!ent.isFile() || !ent.name.endsWith('.md') || !plan.expectedFiles.has(rel)) {
          errors.push(`Unexpected or stale file in Claude Desktop skill summaries: ${rel}`);
        }
      }
    } else {
      errors.push(
        `Missing Claude Desktop skill summaries directory: ${CLAUDE_DESKTOP_SKILLS_REL_DIR}`,
      );
    }
  } catch (err) {
    errors.push(err.message);
  }

  // Check for unexpected or stale skill-*.md files in bundles/skill-package/blendops/references/
  try {
    const portableRefsDirAbs = assertSafePathWithinRoot(
      path.join(resolvedRoot, PORTABLE_PACKAGE_REFS_REL_DIR),
      resolvedRoot,
    );
    if (fs.existsSync(portableRefsDirAbs) && fs.statSync(portableRefsDirAbs).isDirectory()) {
      for (const ent of fs.readdirSync(portableRefsDirAbs, { withFileTypes: true })) {
        if (ent.name === 'skill-map.md') continue;
        if (ent.name.startsWith('skill-')) {
          const rel = `${PORTABLE_PACKAGE_REFS_REL_DIR}/${ent.name}`;
          try {
            assertSafePathWithinRoot(path.join(portableRefsDirAbs, ent.name), resolvedRoot);
          } catch (err) {
            errors.push(err.message);
            continue;
          }
          if (!ent.isFile() || !ent.name.endsWith('.md') || !plan.expectedFiles.has(rel)) {
            errors.push(`Unexpected or stale skill summary in portable skill package: ${rel}`);
          }
        }
      }
    } else {
      errors.push(
        `Missing portable skill package references directory: ${PORTABLE_PACKAGE_REFS_REL_DIR}`,
      );
    }
  } catch (err) {
    errors.push(err.message);
  }

  // Validate bundle manifests
  for (const manifestRel of [
    CLAUDE_DESKTOP_MANIFEST_REL_PATH,
    PORTABLE_PACKAGE_MANIFEST_REL_PATH,
  ]) {
    const isRequired = manifestRel === CLAUDE_DESKTOP_MANIFEST_REL_PATH;
    let manifestAbs;
    try {
      manifestAbs = assertSafePathWithinRoot(
        path.join(resolvedRoot, manifestRel),
        resolvedRoot,
      );
    } catch (err) {
      errors.push(err.message);
      continue;
    }
    if (!fs.existsSync(manifestAbs)) {
      if (isRequired) {
        errors.push(`Missing bundle manifest: ${manifestRel}`);
      }
      continue;
    }
    const rawManifest = fs.readFileSync(manifestAbs, 'utf8');
    let parsedManifest;
    try {
      parsedManifest = JSON.parse(rawManifest);
    } catch (err) {
      errors.push(`Malformed JSON in ${manifestRel}: ${err.message}`);
      continue;
    }
    const profile =
      manifestRel === CLAUDE_DESKTOP_MANIFEST_REL_PATH ? 'claude-desktop-manual' : 'skill-package';
    const manifestErrors = validateBundleManifestAgainstModels(
      parsedManifest,
      plan.models,
      manifestRel,
      { profile },
    );
    errors.push(...manifestErrors);
    const expectedManifestContent = plan.manifestUpdates.get(manifestRel);
    if (
      manifestErrors.length === 0 &&
      expectedManifestContent !== undefined &&
      rawManifest !== expectedManifestContent
    ) {
      errors.push(
        `Out-of-sync bundle manifest: ${manifestRel} (run "npm run bundles:summaries:build")`,
      );
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    skillCount: plan.models.length,
    expectedSummaryCount: plan.expectedFiles.size,
  };
}

function parseCliArgs(argv) {
  let checkMode = false;
  let rootDir = DEFAULT_ROOT;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--check') {
      checkMode = true;
    } else if (arg === '--root') {
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) {
        throw new Error('Missing value for --root <path>');
      }
      rootDir = path.resolve(next);
      i++;
    } else if (arg.startsWith('--root=')) {
      const val = arg.slice('--root='.length).trim();
      if (!val) {
        throw new Error('Missing value for --root=<path>');
      }
      rootDir = path.resolve(val);
    } else {
      throw new Error(`Unknown CLI argument: ${arg}`);
    }
  }
  return { checkMode, rootDir };
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  try {
    const { checkMode, rootDir } = parseCliArgs(process.argv.slice(2));
    if (checkMode) {
      const res = checkBundleReferenceSummaries(rootDir);
      if (!res.ok) {
        console.error('bundles:summaries:check failed with the following issues:');
        for (const err of res.errors) {
          console.error(`- ${err}`);
        }
        process.exit(1);
      }
      console.log(
        `bundles:summaries:check passed (${res.skillCount} canonical skills -> ${res.expectedSummaryCount} bundle reference summaries verified).`,
      );
      process.exit(0);
    } else {
      const res = generateBundleReferenceSummaries(rootDir);
      if (!res.ok) {
        console.error('bundles:summaries:build failed with the following issues:');
        for (const err of res.errors) {
          console.error(`- ${err}`);
        }
        process.exit(1);
      }
      console.log(
        `bundles:summaries:build completed (${res.skillCount} canonical skills -> ${res.generatedCount} bundle reference summaries generated).`,
      );
      process.exit(0);
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}
