#!/usr/bin/env node
/**
 * BlendOps Phase 2B, 2C & 3.1 — SceneSpec Validator, Skill Harmonizer & Deterministic Plan Compiler
 *
 * Implements:
 * - validateSceneSpec(specOrPath, options): Real JSON Schema Draft 2020-12 (Ajv2020) + semantic + canonical catalog validation
 * - compileExecutionPlan(specOrPath, options): Deterministic recipe selection (recipe-fit-assessor),
 *   sub-goal decomposition (blender-recipe-decomposer), 8-layer precedence resolution, cross-skill
 *   conflict detection (blocking / warning / informational), and Ajv2020 ExecutionPlan validation
 * - inspectExecutionPlan(planOrPath, options): Schema + cross-layer semantic invariant verification of a compiled plan
 * - runPlanCliSubcommand(argv, options): CLI integration for scene-spec-validate, plan-compile, plan-inspect
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_REPO_ROOT = path.resolve(__dirname, '..');

export const PRECEDENCE_HIERARCHY = [
  {
    rank: 1,
    layer_id: 'layer_1_hard_laws_and_safety',
    name: 'Hard BlendOps Laws & Safety Invariants',
    description:
      'Non-negotiable BlendOps laws (evidence-before-done, no-arbitrary-python-interface, official-runtime-only, non-blender-user-language) and non-destructive geometry/shape-key safety rules.',
  },
  {
    rank: 2,
    layer_id: 'layer_2_target_delivery_format_and_spec',
    name: 'Target Delivery Format & Specification Constraints',
    description:
      'Hard format limits imposed by target delivery standards (e.g., Khronos glTF 2.0 single 0-1 UV space, <= 4 normalized bone weights, realized Geometry Nodes instances, baked PBR image textures).',
  },
  {
    rank: 3,
    layer_id: 'layer_3_runtime_and_blender_version_limits',
    name: 'Runtime Execution Path & Blender Version Floor',
    description:
      'Capabilities and version floors of the selected execution path (Path 1 Official Blender Lab MCP requires Blender 5.1+, Path 2 Community mcp-for-blender supports Blender 3.0+, CLI Appendix headless).',
  },
  {
    rank: 4,
    layer_id: 'layer_4_explicit_performance_and_resource_budgets',
    name: 'Explicit Performance, Triangle, Draw-Call & VRAM Budgets',
    description:
      'Target platform resource envelopes (mobile_web, desktop_web, hybrid_render_and_web, offline_cinema) enforced by polycount-budget-checker and mobile-glb-budget.',
  },
  {
    rank: 5,
    layer_id: 'layer_5_explicit_scene_spec_parameters',
    name: 'Explicit User SceneSpec Parameters',
    description:
      'User-specified camera lens, aspect ratio, color management (AgX), lighting rig, and material style parameters declared in the SceneSpec.',
  },
  {
    rank: 6,
    layer_id: 'layer_6_domain_recipe_defaults',
    name: 'Canonical Domain Recipe Defaults',
    description:
      'Default workflow sequences, required skills, and domain checks from the selected primary and supporting recipes in registry/recipe-catalog.json.',
  },
  {
    rank: 7,
    layer_id: 'layer_7_skill_level_heuristics',
    name: 'Canonical Skill Heuristics',
    description:
      'Stage-level guidance and quality checklists defined in individual canonical skills/*/SKILL.md files.',
  },
  {
    rank: 8,
    layer_id: 'layer_8_aesthetic_fallbacks',
    name: 'General Studio & Presentation Aesthetic Fallbacks',
    description:
      'Fallback framing, neutral studio backdrop, and default lighting ratios used when no higher-priority constraint specifies a value.',
  },
];

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function formatAjvErrors(errors = []) {
  return errors.map((err) => {
    const loc = err.instancePath || '/';
    return `${loc} ${err.message}`;
  });
}

const PROTECTED_REPO_PREFIXES = [
  'registry',
  'schemas',
  'skills',
  'scripts',
  'laws',
  'packs',
  'bundles',
  'bin',
  'docs',
  'evals',
  '.git',
  '.github',
  'node_modules',
];

const PROTECTED_REPO_FILES = new Set([
  'package.json',
  'package-lock.json',
  'AGENTS.md',
  'README.md',
  'TODO.md',
  'CHANGELOG.md',
  'CONTRIBUTING.md',
  'CODE_OF_CONDUCT.md',
  'SECURITY.md',
  'SUPPORT.md',
  'LICENSE',
]);

/**
 * Validates a CLI `--out` file path to prevent overwriting repository sources,
 * global agent home directories, existing directories, or symbolic links.
 */
export function validateSafeCliOutFilePath(outPath, options = {}) {
  const repoRoot = path.resolve(options.repoRoot || DEFAULT_REPO_ROOT);
  if (!outPath || typeof outPath !== 'string' || outPath.includes('\0') || !outPath.trim()) {
    return {
      valid: false,
      absPath: null,
      error: 'Output path must be a non-empty string without null bytes.',
    };
  }

  const absOut = path.resolve(outPath);
  const parsed = path.parse(absOut);
  if (absOut === parsed.root) {
    return {
      valid: false,
      absPath: absOut,
      error: `Refusing to write to filesystem root: ${absOut}`,
    };
  }

  const homeDir = os.homedir ? os.homedir() : process.env.HOME || '';
  if (homeDir) {
    const absHome = path.resolve(homeDir);
    const forbiddenHomeDirs = [
      '.claude',
      '.cursor',
      '.codex',
      '.gemini',
      '.windsurf',
      '.continue',
      '.cline',
      '.roo',
      '.github',
      '.config',
    ];
    for (const dirName of forbiddenHomeDirs) {
      const candidate = path.join(absHome, dirName);
      if (absOut === candidate || absOut.startsWith(candidate + path.sep)) {
        return {
          valid: false,
          absPath: absOut,
          error: `Refusing to write to global agent/home configuration path: ${absOut}`,
        };
      }
    }
  }

  // Prevent overwriting repository source-of-truth files or directories
  const relToRepo = path.relative(repoRoot, absOut);
  if (!relToRepo.startsWith('..') && !path.isAbsolute(relToRepo)) {
    const normalizedRel = relToRepo.split(path.sep).join('/');
    if (normalizedRel === '' || PROTECTED_REPO_FILES.has(normalizedRel)) {
      return {
        valid: false,
        absPath: absOut,
        error: `Refusing to overwrite protected repository file or root: ${absOut}`,
      };
    }
    const topSegment = normalizedRel.split('/')[0];
    if (PROTECTED_REPO_PREFIXES.includes(topSegment)) {
      return {
        valid: false,
        absPath: absOut,
        error: `Refusing to write CLI output inside protected repository directory "${topSegment}/": ${absOut}`,
      };
    }
  }

  // Walk from root to absOut and reject any symbolic link along the path or at the target
  const segments = absOut.slice(parsed.root.length).split(path.sep).filter(Boolean);
  let cur = parsed.root;
  for (let i = 0; i < segments.length; i++) {
    cur = path.join(cur, segments[i]);
    if (fs.existsSync(cur)) {
      const st = fs.lstatSync(cur);
      if (st.isSymbolicLink()) {
        return {
          valid: false,
          absPath: absOut,
          error: `Refusing to write through symbolic link at: ${cur}`,
        };
      }
      if (i === segments.length - 1 && st.isDirectory()) {
        return {
          valid: false,
          absPath: absOut,
          error: `Output path already exists as a directory: ${absOut}`,
        };
      }
    } else {
      try {
        const st = fs.lstatSync(cur);
        if (st.isSymbolicLink()) {
          return {
            valid: false,
            absPath: absOut,
            error: `Refusing to write through dangling symbolic link at: ${cur}`,
          };
        }
      } catch {
        // does not exist
      }
    }
  }

  return { valid: true, absPath: absOut, error: null };
}

export function writeFileAtomicallySafe(outPath, content, options = {}) {
  const check = validateSafeCliOutFilePath(outPath, options);
  if (!check.valid) {
    throw new Error(check.error);
  }
  const absOut = check.absPath;
  const parentDir = path.dirname(absOut);
  fs.mkdirSync(parentDir, { recursive: true });
  const parentStat = fs.lstatSync(parentDir);
  if (parentStat.isSymbolicLink() || !parentStat.isDirectory()) {
    throw new Error(`Output parent directory is not a real directory: ${parentDir}`);
  }
  const tmpPath = path.join(
    parentDir,
    `.${path.basename(absOut)}.tmp-${process.pid}-${Date.now()}`,
  );
  fs.writeFileSync(tmpPath, content, 'utf8');
  fs.renameSync(tmpPath, absOut);
  return absOut;
}

export function parseMajorMinorVersion(verStr) {
  if (!verStr || typeof verStr !== 'string') return null;
  const m = verStr.trim().match(/^(\d+)\.(\d+)/);
  if (!m) return null;
  const major = Number(m[1]);
  const minor = Number(m[2]);
  return { major, minor, num: major * 100 + minor };
}

export function extractBlenderVersionBounds(versionTarget) {
  if (!versionTarget || typeof versionTarget !== 'object') {
    return { minVer: null, recVer: null, rangeMinVer: null, rangeMaxVer: null, effectiveMaxVer: null };
  }
  const minParsed = parseMajorMinorVersion(versionTarget.min);
  const recParsed = parseMajorMinorVersion(versionTarget.recommended);
  let rangeMinParsed = null;
  let rangeMaxParsed = null;
  if (typeof versionTarget.tested_range === 'string') {
    const parts = versionTarget.tested_range.split('-').map((s) => s.trim());
    if (parts.length === 2) {
      rangeMinParsed = parseMajorMinorVersion(parts[0]);
      rangeMaxParsed = parseMajorMinorVersion(parts[1]);
    } else if (parts.length === 1) {
      rangeMinParsed = parseMajorMinorVersion(parts[0]);
      rangeMaxParsed = rangeMinParsed;
    }
  }
  const minVer = minParsed ? minParsed.num : null;
  const recVer = recParsed ? recParsed.num : null;
  const rangeMinVer = rangeMinParsed ? rangeMinParsed.num : null;
  const rangeMaxVer = rangeMaxParsed ? rangeMaxParsed.num : null;
  const candidates = [recVer, rangeMaxVer].filter((x) => x !== null);
  const effectiveMaxVer =
    candidates.length > 0 ? Math.max(...candidates) : minVer !== null ? minVer : null;
  return {
    minVer,
    recVer,
    rangeMinVer,
    rangeMaxVer,
    effectiveMaxVer,
  };
}

/**
 * Resolves catalog files from either a project-local `.blendops/catalog` directory
 * (if `projectDir` is provided and installed) or the repository root.
 */
export function resolveCatalogPaths(repoRoot = DEFAULT_REPO_ROOT, projectDir = null) {
  if (projectDir) {
    const absProject = path.resolve(projectDir);
    const localCatalogDir = path.join(absProject, '.blendops', 'catalog');
    const localKnowledgePath = path.join(localCatalogDir, 'knowledge-catalog.json');
    const localRecipePath = path.join(localCatalogDir, 'recipe-catalog.json');
    const localSourcesPath = path.join(localCatalogDir, 'knowledge-sources.json');
    if (
      fs.existsSync(localKnowledgePath) &&
      fs.existsSync(localRecipePath) &&
      fs.existsSync(localSourcesPath)
    ) {
      return {
        sourceMode: 'project-local',
        catalogDir: localCatalogDir,
        knowledgeCatalogPath: localKnowledgePath,
        recipeCatalogPath: localRecipePath,
        knowledgeSourcesPath: localSourcesPath,
        catalogIndexPath: path.join(localCatalogDir, 'catalog-index.json'),
        skillsPath: fs.existsSync(path.join(localCatalogDir, 'skills-summary.json'))
          ? path.join(localCatalogDir, 'skills-summary.json')
          : path.join(repoRoot, 'registry', 'skills.json'),
        schemasDir: fs.existsSync(path.join(localCatalogDir, 'schemas', 'scene-spec.schema.json'))
          ? path.join(localCatalogDir, 'schemas')
          : path.join(repoRoot, 'schemas'),
      };
    }
  }
  return {
    sourceMode: 'repository',
    catalogDir: path.join(repoRoot, 'registry'),
    knowledgeCatalogPath: path.join(repoRoot, 'registry', 'knowledge-catalog.json'),
    recipeCatalogPath: path.join(repoRoot, 'registry', 'recipe-catalog.json'),
    knowledgeSourcesPath: path.join(repoRoot, 'registry', 'knowledge-sources.json'),
    catalogIndexPath: path.join(repoRoot, 'registry', 'catalog-index.json'),
    skillsPath: path.join(repoRoot, 'registry', 'skills.json'),
    schemasDir: path.join(repoRoot, 'schemas'),
  };
}

function loadInputJson(objOrPath) {
  if (typeof objOrPath === 'string') {
    const absPath = path.resolve(objOrPath);
    if (!fs.existsSync(absPath)) {
      throw new Error(`File not found: ${absPath}`);
    }
    return { data: readJsonFile(absPath), filePath: absPath };
  }
  if (objOrPath && typeof objOrPath === 'object') {
    return { data: objOrPath, filePath: null };
  }
  throw new Error('Expected a file path or JSON object.');
}

export const PRIMARY_GOAL_TO_RECIPE_ID = {
  product_hero_presentation: 'recipe.product-hero-scene',
  environment_or_diorama_scene: 'recipe.stylized-environment-scene',
  hard_surface_prop_asset: 'recipe.hard-surface-prop',
  procedural_geometry_nodes_asset: 'recipe.procedural-geometry-nodes-asset',
  rigged_character_or_animation: 'recipe.rigged-and-animated-asset',
  web_glb_optimization_and_handoff: 'recipe.web-ready-asset-optimization',
  scene_quality_inspection_and_cleanup: 'recipe.scene-quality-inspection-and-correction',
  hybrid_render_and_web_glb: 'recipe.product-hero-scene',
};

/**
 * Validates a SceneSpec against schemas/scene-spec.schema.json (Draft 2020-12)
 * plus semantic and canonical catalog invariants.
 */
export function validateSceneSpec(specOrPath, options = {}) {
  const repoRoot = options.repoRoot || DEFAULT_REPO_ROOT;
  const projectDir = options.projectDir || null;
  const catalogPaths = resolveCatalogPaths(repoRoot, projectDir);
  const { schemasDir, recipeCatalogPath, sourceMode } = catalogPaths;
  const schemaPath = path.join(schemasDir, 'scene-spec.schema.json');
  const schema = readJsonFile(schemaPath);

  let spec;
  try {
    spec = loadInputJson(specOrPath).data;
  } catch (err) {
    return {
      valid: false,
      errors: [err.message],
      warnings: [],
      spec: null,
      spec_id: null,
      runtime_status: 'Not Run',
      artifact_status: 'Not Produced',
    };
  }

  const ajv = new Ajv2020({ allErrors: true, strict: false });
  const validate = ajv.compile(schema);
  const errors = [];
  const warnings = [];

  if (!validate(spec)) {
    for (const msg of formatAjvErrors(validate.errors)) {
      errors.push(`scene-spec schema error: ${msg}`);
    }
  }

  let recipesById = new Map();
  try {
    const recipeCatalog = readJsonFile(recipeCatalogPath);
    recipesById = new Map((recipeCatalog.recipes || []).map((r) => [r.id, r]));
  } catch (err) {
    errors.push(`Failed to load canonical recipe catalog (${recipeCatalogPath}): ${err.message}`);
  }

  if (spec && typeof spec === 'object') {
    // 1. Canonical recipe override and primary goal recipe resolution check (Defect 2A)
    const explicitOverride = spec.intent?.explicit_recipe_override;
    if (explicitOverride !== undefined && explicitOverride !== null) {
      if (typeof explicitOverride !== 'string' || !/^recipe\.[a-z0-9-]+$/.test(explicitOverride)) {
        errors.push(
          `Invalid intent.explicit_recipe_override "${String(explicitOverride)}": must match ^recipe\\.[a-z0-9-]+$.`,
        );
      } else if (!recipesById.has(explicitOverride)) {
        errors.push(
          `Unresolved intent.explicit_recipe_override "${explicitOverride}": recipe does not exist in canonical recipe catalog (${sourceMode}).`,
        );
      }
    } else if (spec.intent?.primary_goal) {
      const mappedPrimary = PRIMARY_GOAL_TO_RECIPE_ID[spec.intent.primary_goal];
      if (!mappedPrimary || !recipesById.has(mappedPrimary)) {
        errors.push(
          `Cannot resolve canonical primary recipe for intent.primary_goal "${spec.intent.primary_goal}" in ${sourceMode} recipe catalog.`,
        );
      }
    }

    // 2. Blender version target internal ordering sanity check
    if (spec.blender_version_target && typeof spec.blender_version_target === 'object') {
      const bounds = extractBlenderVersionBounds(spec.blender_version_target);
      if (bounds.minVer !== null && bounds.recVer !== null && bounds.minVer > bounds.recVer) {
        errors.push(
          `blender_version_target.min (${spec.blender_version_target.min}) cannot exceed recommended (${spec.blender_version_target.recommended}).`,
        );
      }
      if (
        bounds.rangeMinVer !== null &&
        bounds.rangeMaxVer !== null &&
        bounds.rangeMaxVer < bounds.rangeMinVer
      ) {
        errors.push(
          `blender_version_target.tested_range (${spec.blender_version_target.tested_range}) has end version < start version.`,
        );
      }
    }

    if (Array.isArray(spec.objects_and_subjects)) {
      const seenIds = new Set();
      for (const obj of spec.objects_and_subjects) {
        if (obj && obj.id) {
          if (seenIds.has(obj.id)) {
            errors.push(`Duplicate objects_and_subjects[].id: ${obj.id}`);
          }
          seenIds.add(obj.id);
        }
      }
    }

    if (
      spec.animation_and_rigging &&
      Array.isArray(spec.animation_and_rigging.frame_range) &&
      spec.animation_and_rigging.frame_range.length === 2
    ) {
      const [start, end] = spec.animation_and_rigging.frame_range;
      if (end < start) {
        errors.push(`animation_and_rigging.frame_range end (${end}) must be >= start (${start})`);
      }
    }

    if (
      spec.camera_and_framing &&
      typeof spec.camera_and_framing.clip_start_m === 'number' &&
      typeof spec.camera_and_framing.clip_end_m === 'number'
    ) {
      if (spec.camera_and_framing.clip_end_m <= spec.camera_and_framing.clip_start_m) {
        errors.push(
          `camera_and_framing.clip_end_m (${spec.camera_and_framing.clip_end_m}) must be > clip_start_m (${spec.camera_and_framing.clip_start_m})`,
        );
      } else if (
        spec.camera_and_framing.clip_end_m / spec.camera_and_framing.clip_start_m >
        100000
      ) {
        warnings.push(
          `Camera far/near clip ratio (${Math.round(spec.camera_and_framing.clip_end_m / spec.camera_and_framing.clip_start_m)}:1) exceeds 100,000:1 and risks Z-fighting.`,
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    spec: errors.length === 0 ? spec : spec || null,
    spec_id: spec?.id || null,
    title: spec?.title || null,
    language: spec?.language || null,
    catalog_source_mode: sourceMode,
    runtime_status: 'Not Run',
    artifact_status: 'Not Produced',
  };
}

/**
 * Resolves the primary recipe and supporting recipes using `recipe-fit-assessor`
 * and decomposes sub-goals via `blender-recipe-decomposer`.
 */
function resolveRecipesForSpec(spec, recipesById) {
  const primaryRecipeId =
    spec.intent.explicit_recipe_override ||
    PRIMARY_GOAL_TO_RECIPE_ID[spec.intent.primary_goal] ||
    'recipe.product-hero-scene';

  if (!recipesById.has(primaryRecipeId)) {
    throw new Error(
      `Unresolved primary recipe "${primaryRecipeId}": recipe does not exist in canonical catalog.`,
    );
  }

  const supportingSet = new Set();

  const needsScanOrCleanup =
    spec.objects_and_subjects.some((o) => o.has_non_manifold_or_scan_noise || !o.transforms_applied) ||
    spec.intent.primary_goal === 'scene_quality_inspection_and_cleanup';
  if (needsScanOrCleanup && primaryRecipeId !== 'recipe.scene-quality-inspection-and-correction') {
    supportingSet.add('recipe.scene-quality-inspection-and-correction');
  }

  const needsHardSurface = spec.objects_and_subjects.some(
    (o) =>
      o.source_type === 'hard_surface_modeled' ||
      o.modifiers.includes('Boolean') ||
      o.modifiers.includes('Bevel'),
  );
  if (needsHardSurface && primaryRecipeId !== 'recipe.hard-surface-prop') {
    supportingSet.add('recipe.hard-surface-prop');
  }

  const needsGeometryNodes =
    spec.simulation_and_vfx.simulation_types.includes('geometry_nodes_scatter') ||
    spec.objects_and_subjects.some((o) => o.source_type === 'procedural_geometry_nodes');
  if (needsGeometryNodes && primaryRecipeId !== 'recipe.procedural-geometry-nodes-asset') {
    supportingSet.add('recipe.procedural-geometry-nodes-asset');
  }

  if (
    (spec.style_and_materials.bake_procedural_to_pbr ||
      spec.style_and_materials.shader_workflow === 'principled_bsdf_pbr' ||
      spec.style_and_materials.shader_workflow === 'procedural_nodes_baked_to_textures') &&
    primaryRecipeId !== 'recipe.uv-and-pbr-material-preparation'
  ) {
    supportingSet.add('recipe.uv-and-pbr-material-preparation');
  }

  const rendersVisualOutput = spec.deliverables.formats.some((f) =>
    ['png_still', 'exr_multilayer', 'mp4_turntable'].includes(f),
  );
  if (rendersVisualOutput && primaryRecipeId !== 'recipe.presentation-lighting-and-camera') {
    supportingSet.add('recipe.presentation-lighting-and-camera');
  }

  const deliversGlb = spec.deliverables.formats.some((f) =>
    ['glb_web_standard', 'gltf_extended'].includes(f),
  );
  if (deliversGlb) {
    if (
      (spec.optimization_and_budgets.target_tier === 'mobile_web' ||
        spec.optimization_and_budgets.target_tier === 'hybrid_render_and_web' ||
        spec.optimization_and_budgets.generate_lods) &&
      primaryRecipeId !== 'recipe.web-ready-asset-optimization'
    ) {
      supportingSet.add('recipe.web-ready-asset-optimization');
    }
    if (primaryRecipeId !== 'recipe.blender-to-glb-handoff') {
      supportingSet.add('recipe.blender-to-glb-handoff');
    }
  }

  const supportingRecipeIds = [];
  for (const id of supportingSet) {
    if (id === primaryRecipeId) continue;
    if (!recipesById.has(id)) {
      throw new Error(
        `Unresolved supporting recipe "${id}": recipe does not exist in canonical catalog.`,
      );
    }
    if (!supportingRecipeIds.includes(id)) {
      supportingRecipeIds.push(id);
    }
  }
  const orderedRecipeIds = [primaryRecipeId, ...supportingRecipeIds];

  const decomposedSubGoals = orderedRecipeIds.map((recipeId, idx) => {
    const rec = recipesById.get(recipeId);
    if (!rec) {
      throw new Error(`Recipe "${recipeId}" missing from canonical catalog during decomposition.`);
    }
    const recSkills = [
      ...new Set([...(rec.required_skill_ids || []), ...(rec.optional_skills || [])]),
    ];
    const recKnowledge = [...new Set([...(rec.required_knowledge_ids || [])])];
    return {
      step_index: idx + 1,
      recipe_id: recipeId,
      sub_goal: `${rec.title}: ${rec.intent}`,
      skills: recSkills,
      knowledge_refs: recKnowledge,
    };
  });

  const selectionRationale = `Selected primary recipe ${primaryRecipeId} for intent.primary_goal="${spec.intent.primary_goal}" via recipe-fit-assessor, decomposed into ${decomposedSubGoals.length} ordered sub-goal(s) via blender-recipe-decomposer (${supportingRecipeIds.length} supporting recipe(s): ${supportingRecipeIds.join(', ') || 'none'}).`;

  return {
    primary_recipe_id: primaryRecipeId,
    supporting_recipe_ids: supportingRecipeIds,
    selection_rationale: selectionRationale,
    decomposed_sub_goals: decomposedSubGoals,
  };
}

/**
 * Detects cross-skill, format, budget, and runtime conflicts using the 8-layer precedence hierarchy.
 */
function detectConflicts(spec) {
  const conflicts = [];
  const deliversStandardGlb =
    spec.deliverables.requires_standard_khronos_gltf_2_0 ||
    spec.deliverables.formats.includes('glb_web_standard');
  const glbOnlyDelivery =
    spec.deliverables.formats.length === 1 &&
    spec.deliverables.formats[0] === 'glb_web_standard';

  // 1. UDIM multi-tile vs standard Khronos glTF 2.0 single 0-1 UV space
  const usesUdim =
    spec.style_and_materials.uv_packing === 'udim_tiles' ||
    spec.style_and_materials.udim_tile_count > 1 ||
    spec.objects_and_subjects.some((o) => o.uv_strategy === 'udim_multi_tile');
  if (usesUdim && deliversStandardGlb) {
    conflicts.push({
      conflict_id: 'conflict.udim-vs-standard-glb',
      severity: 'blocking',
      rule_id: 'CONFLICT_UDIM_VS_STANDARD_GLB',
      winning_layer_rank: 2,
      winning_layer_id: 'layer_2_target_delivery_format_and_spec',
      losing_layer_id: 'layer_5_explicit_scene_spec_parameters',
      summary:
        'SceneSpec requests multi-tile UDIM UV packing (>1 tile in 1001+ range) together with standard Khronos glTF 2.0 GLB delivery. Core glTF 2.0 does not support multi-tile UDIM textures without baking/repacking into [0, 1] UV space or splitting materials per tile.',
      affected_skills: ['glb-web-handoff', 'material-quality-checker', 'output-format-decision'],
      knowledge_refs: [
        'knowledge.udim-vs-single-atlas-uv-packing',
        'knowledge.uv-seam-placement-and-texel-density',
      ],
      remediation:
        'Repack UV islands into a single [0, 1] UV atlas and bake multi-tile textures prior to GLB export, or assign separate material slots per tile with UV coordinates shifted into [0, 1].',
    });
  }

  // 2. Cycles Volumetric Fog without bake/card fallback on GLB-only delivery
  if (
    spec.lighting_and_environment.volumetric_effects.enabled &&
    !spec.lighting_and_environment.volumetric_effects.bake_or_card_fallback_for_realtime &&
    glbOnlyDelivery
  ) {
    conflicts.push({
      conflict_id: 'conflict.volumetric-fog-glb-only',
      severity: 'blocking',
      rule_id: 'CONFLICT_VOLUMETRIC_FOG_GLB_ONLY',
      winning_layer_rank: 2,
      winning_layer_id: 'layer_2_target_delivery_format_and_spec',
      losing_layer_id: 'layer_5_explicit_scene_spec_parameters',
      summary:
        'SceneSpec enables Blender Cycles/EEVEE volumetric fog without a real-time card/shader fallback while only exporting a standard web GLB. Standard glTF 2.0 does not transport Blender Principled Volume shaders or Mantaflow smoke grids.',
      affected_skills: ['lighting-material-plan', 'glb-web-handoff', 'output-format-decision'],
      knowledge_refs: [
        'knowledge.volumetrics-fog-and-principled-volume-tradeoffs',
        'knowledge.rigid-body-cloth-and-simulation-cache-baking',
      ],
      remediation:
        'Enable bake_or_card_fallback_for_realtime (billboard alpha cards or Three.js host fog) for GLB delivery, or add png_still / exr_multilayer to deliverables for offline volumetric rendering.',
    });
  }

  // 3. Unbaked Blender procedural shader nodes when delivering standard GLB
  if (
    (spec.style_and_materials.shader_workflow === 'procedural_nodes_unbaked' ||
      (spec.style_and_materials.shader_workflow === 'toon_npr_shader' &&
        !spec.style_and_materials.bake_procedural_to_pbr)) &&
    deliversStandardGlb
  ) {
    conflicts.push({
      conflict_id: 'conflict.unbaked-procedural-shader-glb',
      severity: 'blocking',
      rule_id: 'CONFLICT_UNBAKED_PROCEDURAL_SHADER_GLB',
      winning_layer_rank: 2,
      winning_layer_id: 'layer_2_target_delivery_format_and_spec',
      losing_layer_id: 'layer_5_explicit_scene_spec_parameters',
      summary:
        'SceneSpec uses unbaked Blender procedural shader nodes (Noise/Voronoi/ColorRamp/Shader-to-RGB) while targeting standard glTF 2.0 GLB export. Blender procedural nodes are silently dropped by the glTF exporter unless baked to PBR image textures.',
      affected_skills: ['lighting-material-plan', 'material-quality-checker', 'glb-web-handoff'],
      knowledge_refs: [
        'knowledge.shader-node-gltf-export-portability',
        'knowledge.principled-bsdf-v2-energy-conserving-pbr',
      ],
      remediation:
        'Set shader_workflow to "procedural_nodes_baked_to_textures" and bake_procedural_to_pbr: true to bake Base Color, Roughness, Metallic, and MikkTSpace Normal maps before GLB export.',
    });
  }

  // 4. Unrealized Geometry Nodes instances when delivering standard GLB
  const hasGnObjects =
    spec.simulation_and_vfx.simulation_types.includes('geometry_nodes_scatter') ||
    spec.objects_and_subjects.some((o) => o.source_type === 'procedural_geometry_nodes');
  if (hasGnObjects && !spec.simulation_and_vfx.geometry_nodes_realize_instances && deliversStandardGlb) {
    conflicts.push({
      conflict_id: 'conflict.unrealized-geometry-nodes-glb',
      severity: 'blocking',
      rule_id: 'CONFLICT_UNREALIZED_GEOMETRY_NODES_GLB',
      winning_layer_rank: 2,
      winning_layer_id: 'layer_2_target_delivery_format_and_spec',
      losing_layer_id: 'layer_5_explicit_scene_spec_parameters',
      summary:
        'SceneSpec includes Geometry Nodes procedural scatter/generator objects with geometry_nodes_realize_instances: false while targeting standard GLB export. Unrealized procedural instances and unmapped named attributes export as empty nodes or missing UVs.',
      affected_skills: ['scene-readiness', 'glb-web-handoff', 'pre-handoff-verification'],
      knowledge_refs: [
        'knowledge.procedural-instancing-and-realize-instances-budget',
        'knowledge.geometry-nodes-fields-and-anonymous-attributes',
      ],
      remediation:
        'Set simulation_and_vfx.geometry_nodes_realize_instances: true and store UV coordinates into an explicit Face Corner 2D Vector attribute named UVMap before GLB export.',
    });
  }

  // 5. Unapplied transforms or negative/non-unit scale on export or rigged objects
  const badScaleObjects = spec.objects_and_subjects.filter(
    (o) =>
      !o.transforms_applied ||
      o.scale_factors.some((s) => s <= 0 || Math.abs(s - 1.0) > 1e-4),
  );
  if (badScaleObjects.length > 0 && (deliversStandardGlb || spec.animation_and_rigging.has_armature)) {
    const hasNegativeScale = badScaleObjects.some((o) => o.scale_factors.some((s) => s < 0));
    conflicts.push({
      conflict_id: 'conflict.unapplied-or-negative-scale-export',
      severity: 'blocking',
      rule_id: 'CONFLICT_UNAPPLIED_OR_NEGATIVE_SCALE_EXPORT',
      winning_layer_rank: 1,
      winning_layer_id: 'layer_1_hard_laws_and_safety',
      losing_layer_id: 'layer_5_explicit_scene_spec_parameters',
      summary: `Object(s) [${badScaleObjects.map((o) => o.id).join(', ')}] have unapplied transforms or non-unit/negative scale (${hasNegativeScale ? 'negative scale inverts face winding and flips normals in glTF/Three.js' : 'non-unit scale distorts bevels, UVs, and skeletal skinning'}).`,
      affected_skills: ['scene-readiness', 'pre-handoff-verification', 'glb-web-handoff'],
      knowledge_refs: [
        'knowledge.mesh-manifold-normals-and-scale-hygiene',
        'knowledge.gltf-2-coordinate-system-and-transform-conventions',
      ],
      remediation:
        'Apply Rotation & Scale (Ctrl+A -> Rotation & Scale) so all exported/rigged objects have scale [1.0, 1.0, 1.0], and recalculate outward normals if negative scale was used.',
    });
  }

  // 6. Bone influences per vertex > 4 for standard glTF 2.0 skinning
  if (
    spec.animation_and_rigging.has_armature &&
    spec.animation_and_rigging.max_bone_influences_per_vertex > 4 &&
    deliversStandardGlb
  ) {
    conflicts.push({
      conflict_id: 'conflict.bone-influences-exceed-gltf-limit',
      severity: 'blocking',
      rule_id: 'CONFLICT_BONE_INFLUENCES_EXCEED_GLTF_LIMIT',
      winning_layer_rank: 2,
      winning_layer_id: 'layer_2_target_delivery_format_and_spec',
      losing_layer_id: 'layer_5_explicit_scene_spec_parameters',
      summary: `SceneSpec specifies max_bone_influences_per_vertex = ${spec.animation_and_rigging.max_bone_influences_per_vertex}, exceeding the core Khronos glTF 2.0 JOINTS_0 / WEIGHTS_0 limit of 4 normalized bone influences per vertex.`,
      affected_skills: ['glb-animation-handoff', 'pre-handoff-verification'],
      knowledge_refs: ['knowledge.armature-joint-hierarchy-and-linear-blend-skinning'],
      remediation:
        'Run Limit Total (<= 4 influences per vertex) and Normalize All in Weight Paint mode before exporting to glTF 2.0.',
    });
  }

  // 7. Applying modifiers directly on a mesh with active Shape Keys
  if (
    spec.animation_and_rigging.has_shape_keys &&
    spec.animation_and_rigging.apply_modifiers_with_shape_keys
  ) {
    conflicts.push({
      conflict_id: 'conflict.apply-modifiers-with-shape-keys',
      severity: 'blocking',
      rule_id: 'CONFLICT_APPLY_MODIFIERS_WITH_SHAPE_KEYS',
      winning_layer_rank: 1,
      winning_layer_id: 'layer_1_hard_laws_and_safety',
      losing_layer_id: 'layer_5_explicit_scene_spec_parameters',
      summary:
        'SceneSpec sets apply_modifiers_with_shape_keys: true on a mesh with active Shape Keys. Blender cannot directly apply topology-changing modifiers on meshes with Shape Keys without destroying morph target vertex indices.',
      affected_skills: ['glb-animation-handoff', 'scene-readiness'],
      knowledge_refs: [
        'knowledge.nla-action-baking-and-morph-target-export',
        'knowledge.non-destructive-hard-surface-modifier-stack',
      ],
      remediation:
        'Set apply_modifiers_with_shape_keys: false, finalize base topology before authoring Shape Keys, or propagate modifiers across duplicated per-shape-key meshes and rejoin as shapes.',
    });
  }

  // 8. Unbaked NLA / IK constraints when exporting animated GLB
  if (
    spec.animation_and_rigging.enabled &&
    spec.animation_and_rigging.has_armature &&
    !spec.animation_and_rigging.bake_nla_to_linear_keyframes &&
    deliversStandardGlb
  ) {
    conflicts.push({
      conflict_id: 'conflict.unbaked-nla-constraints-glb',
      severity: 'blocking',
      rule_id: 'CONFLICT_UNBAKED_NLA_CONSTRAINTS_GLB',
      winning_layer_rank: 2,
      winning_layer_id: 'layer_2_target_delivery_format_and_spec',
      losing_layer_id: 'layer_5_explicit_scene_spec_parameters',
      summary:
        'SceneSpec enables armature animation for GLB delivery with bake_nla_to_linear_keyframes: false. Blender IK solvers, Copy Transforms, and Python driver expressions are not exported to glTF 2.0 unless baked to visual deformation keyframes.',
      affected_skills: ['glb-animation-handoff', 'glb-web-handoff'],
      knowledge_refs: ['knowledge.nla-action-baking-and-morph-target-export'],
      remediation:
        'Set bake_nla_to_linear_keyframes: true (Bake Action with Visual Keying, Clear Constraints, and Export Deform Bones Only).',
    });
  }

  // 9. Polycount sum vs optimization_and_budgets.max_triangles
  const totalObjectTriangles = spec.objects_and_subjects.reduce(
    (sum, obj) => sum + (obj.poly_budget_triangles || 0),
    0,
  );
  if (totalObjectTriangles > spec.optimization_and_budgets.max_triangles) {
    const ratio = totalObjectTriangles / spec.optimization_and_budgets.max_triangles;
    conflicts.push({
      conflict_id: 'conflict.poly-sum-exceeds-budget',
      severity: ratio > 1.25 ? 'blocking' : 'warning',
      rule_id: 'CONFLICT_POLY_SUM_EXCEEDS_BUDGET',
      winning_layer_rank: 4,
      winning_layer_id: 'layer_4_explicit_performance_and_resource_budgets',
      losing_layer_id: 'layer_5_explicit_scene_spec_parameters',
      summary: `Total object triangle budget (${totalObjectTriangles.toLocaleString()} tris) exceeds optimization_and_budgets.max_triangles (${spec.optimization_and_budgets.max_triangles.toLocaleString()} tris, ${(ratio * 100).toFixed(0)}% of budget).`,
      affected_skills: ['polycount-budget-checker', 'mobile-glb-budget'],
      knowledge_refs: [
        'knowledge.triangle-draw-call-and-vram-budgets',
        'knowledge.lod-hierarchy-and-decimation-strategy',
      ],
      remediation:
        'Reduce per-object poly_budget_triangles via Planar/Collapse Decimate with pinned UV seams, bake high-frequency detail into MikkTSpace normal maps, or raise max_triangles for non-mobile tiers.',
    });
  }

  // 10. Camera far/near clip ratio > 100,000:1 (warning)
  const clipRatio = spec.camera_and_framing.clip_end_m / spec.camera_and_framing.clip_start_m;
  if (clipRatio > 100000) {
    conflicts.push({
      conflict_id: 'conflict.camera-clip-ratio-z-fighting',
      severity: 'warning',
      rule_id: 'CONFLICT_CAMERA_CLIP_RATIO_Z_FIGHTING',
      winning_layer_rank: 7,
      winning_layer_id: 'layer_7_skill_level_heuristics',
      losing_layer_id: 'layer_5_explicit_scene_spec_parameters',
      summary: `Camera clip_end_m / clip_start_m ratio (${Math.round(clipRatio).toLocaleString()}:1) exceeds the safe 100,000:1 depth precision threshold and risks coplanar Z-fighting flicker.`,
      affected_skills: ['camera-composition', 'composition-quality-checker'],
      knowledge_refs: ['knowledge.physically-based-camera-lens-and-dof'],
      remediation:
        'Raise camera_and_framing.clip_start_m (>= 0.01m - 0.1m) and lower clip_end_m to tightly bound the actual scene extents.',
    });
  }

  // 11. Scan noise / non-manifold source mesh requires cleanup gate (warning)
  const noisyObjects = spec.objects_and_subjects.filter((o) => o.has_non_manifold_or_scan_noise);
  if (noisyObjects.length > 0) {
    conflicts.push({
      conflict_id: 'conflict.scan-noise-requires-cleanup-gate',
      severity: 'warning',
      rule_id: 'CONFLICT_SCAN_NOISE_REQUIRES_CLEANUP_GATE',
      winning_layer_rank: 1,
      winning_layer_id: 'layer_1_hard_laws_and_safety',
      losing_layer_id: 'layer_6_domain_recipe_defaults',
      summary: `Object(s) [${noisyObjects.map((o) => o.id).join(', ')}] flag has_non_manifold_or_scan_noise: true. UV unwrapping, normal baking, and Booleans will fail unless preceded by manifold cleanup.`,
      affected_skills: ['scene-readiness', 'pre-handoff-verification'],
      knowledge_refs: ['knowledge.mesh-manifold-normals-and-scale-hygiene'],
      remediation:
        'Execute scene-readiness manifold cleanup (Merge by Distance, Delete Loose, Fill Holes, Recalculate Outside Normals) before stage 5 material/UV baking.',
    });
  }

  // 12. Hybrid Cycles offline render + real-time GLB dual-branch notice (informational)
  const hasOfflineRender = spec.deliverables.formats.some((f) =>
    ['png_still', 'exr_multilayer'].includes(f),
  );
  if (spec.render_and_color.engine === 'CYCLES' && hasOfflineRender && deliversStandardGlb) {
    conflicts.push({
      conflict_id: 'conflict.hybrid-cycles-and-web-glb-dual-branch',
      severity: 'informational',
      rule_id: 'CONFLICT_HYBRID_CYCLES_AND_MOBILE_GLB',
      winning_layer_rank: 2,
      winning_layer_id: 'layer_2_target_delivery_format_and_spec',
      losing_layer_id: 'layer_6_domain_recipe_defaults',
      summary:
        'SceneSpec targets both offline Cycles AgX rendering and standard web GLB export. Harmonizer schedules a dual-branch execution plan: full Cycles AgX lighting for still renders, and baked Principled BSDF PBR + KTX2/Draco for GLB handoff.',
      affected_skills: [
        'cycles-vs-eevee-decision',
        'color-management-decision',
        'glb-web-handoff',
      ],
      knowledge_refs: [
        'knowledge.agx-filmic-color-management-and-cycles-eevee',
        'knowledge.threejs-r3f-tone-mapping-and-environment-parity',
      ],
      remediation:
        'Maintain Principled BSDF v2 energy-conserving materials and match AgX tone mapping + HDRI environment lighting in the target Three.js/R3F viewer.',
    });
  }

  // 13. Path-specific Blender version floor enforcement (Layer 3: runtime & version limits)
  const vBounds = extractBlenderVersionBounds(spec.blender_version_target);
  const preferredPath = spec.runtime_preference?.preferred_path;
  if (
    preferredPath === 'path-1-official-blender-lab-mcp' &&
    ((vBounds.recVer !== null && vBounds.recVer < 501) ||
      (vBounds.effectiveMaxVer !== null && vBounds.effectiveMaxVer < 501))
  ) {
    conflicts.push({
      conflict_id: 'conflict.runtime-path-1-blender-version-floor',
      severity: 'blocking',
      rule_id: 'CONFLICT_RUNTIME_PATH_1_BLENDER_VERSION_FLOOR',
      winning_layer_rank: 3,
      winning_layer_id: 'layer_3_runtime_and_blender_version_limits',
      losing_layer_id: 'layer_5_explicit_scene_spec_parameters',
      summary: `SceneSpec selects Path 1 (Official Blender Lab MCP) with blender_version_target recommended="${spec.blender_version_target.recommended}" (tested_range="${spec.blender_version_target.tested_range}"), which is below the mandatory Blender 5.1+ floor required by the official Blender Lab MCP add-on manifest.`,
      affected_skills: ['runtime-path-picker', 'runtime-readiness', 'path-one-host-outline'],
      knowledge_refs: ['knowledge.mesh-manifold-normals-and-scale-hygiene'],
      remediation:
        'Upgrade blender_version_target.recommended / tested_range to Blender 5.1+ for Path 1 Official Blender Lab MCP, or switch runtime_preference.preferred_path to "path-2-community-mcp-for-blender" (supports Blender 3.0+) or "cli-appendix-headless".',
    });
  } else if (
    (preferredPath === 'path-2-community-mcp-for-blender' ||
      preferredPath === 'cli-appendix-headless') &&
    ((vBounds.recVer !== null && vBounds.recVer < 300) ||
      (vBounds.effectiveMaxVer !== null && vBounds.effectiveMaxVer < 300) ||
      (vBounds.minVer !== null && vBounds.minVer < 300))
  ) {
    conflicts.push({
      conflict_id: 'conflict.runtime-path-2-blender-version-floor',
      severity: 'blocking',
      rule_id: 'CONFLICT_RUNTIME_PATH_2_BLENDER_VERSION_FLOOR',
      winning_layer_rank: 3,
      winning_layer_id: 'layer_3_runtime_and_blender_version_limits',
      losing_layer_id: 'layer_5_explicit_scene_spec_parameters',
      summary: `SceneSpec selects ${preferredPath} with blender_version_target min="${spec.blender_version_target.min}" / recommended="${spec.blender_version_target.recommended}", which is below the Blender 3.0+ floor supported by Path 2 community mcp-for-blender and the CLI appendix.`,
      affected_skills: ['runtime-path-picker', 'runtime-readiness'],
      knowledge_refs: ['knowledge.mesh-manifold-normals-and-scale-hygiene'],
      remediation:
        'Target Blender 3.0+ (recommended 3.6 LTS - 5.1+) when using Path 2 community mcp-for-blender or CLI appendix headless execution.',
    });
  }

  return conflicts;
}

/**
 * Compiles a deterministic ExecutionPlan from a validated SceneSpec.
 */
export function compileExecutionPlan(specOrPath, options = {}) {
  const repoRoot = options.repoRoot || DEFAULT_REPO_ROOT;
  const projectDir = options.projectDir || null;
  const catalogPaths = resolveCatalogPaths(repoRoot, projectDir);

  const specValidation = validateSceneSpec(specOrPath, { repoRoot, projectDir });
  if (!specValidation.valid) {
    return {
      ok: false,
      validation: specValidation,
      plan: null,
      runtime_status: 'Not Run',
      artifact_status: 'Not Produced',
    };
  }

  const spec = specValidation.spec || loadInputJson(specOrPath).data;
  const knowledgeCatalog = readJsonFile(catalogPaths.knowledgeCatalogPath);
  const recipeCatalog = readJsonFile(catalogPaths.recipeCatalogPath);
  const planSchema = readJsonFile(path.join(catalogPaths.schemasDir, 'execution-plan.schema.json'));

  const knowledgeById = new Map(knowledgeCatalog.records.map((r) => [r.id, r]));
  const recipesById = new Map(recipeCatalog.recipes.map((r) => [r.id, r]));

  let recipeResolution;
  try {
    recipeResolution = resolveRecipesForSpec(spec, recipesById);
  } catch (err) {
    return {
      ok: false,
      validation: {
        ...specValidation,
        valid: false,
        errors: [...specValidation.errors, err.message],
      },
      plan: null,
      runtime_status: 'Not Run',
      artifact_status: 'Not Produced',
    };
  }
  const conflicts = detectConflicts(spec);

  const blockingCount = conflicts.filter((c) => c.severity === 'blocking').length;
  const warningCount = conflicts.filter((c) => c.severity === 'warning').length;
  const infoCount = conflicts.filter((c) => c.severity === 'informational').length;

  const status =
    blockingCount > 0 ? 'blocked' : warningCount > 0 ? 'ready_with_warnings' : 'ready';
  const isPlanningOnlyPath =
    spec.runtime_preference.preferred_path === 'unconfigured-planning-only';
  const canProceedToRuntime = blockingCount === 0 && !isPlanningOnlyPath;

  const runtimeSkillMap = {
    'path-1-official-blender-lab-mcp': 'path-one-host-outline',
    'path-2-community-mcp-for-blender': 'runtime-path-picker',
    'cli-appendix-headless': 'cli-appendix-job-outline',
    'unconfigured-planning-only': 'runtime-setup',
  };
  const selectedRuntimeSkill =
    runtimeSkillMap[spec.runtime_preference.preferred_path] || 'runtime-path-picker';

  const primaryRec = recipesById.get(recipeResolution.primary_recipe_id);
  const primaryPlannerSkill =
    primaryRec && Array.isArray(primaryRec.required_skill_ids)
      ? primaryRec.required_skill_ids.find((s) =>
          [
            'product-hero-scene-planner',
            'environment-shot',
            'interior-scene',
            'character-portrait',
            'product-grid-scene-planner',
          ].includes(s),
        )
      : null;

  const deliversGlb = spec.deliverables.formats.some((f) =>
    ['glb_web_standard', 'gltf_extended'].includes(f),
  );
  const deliversRender = spec.deliverables.formats.some((f) =>
    ['png_still', 'exr_multilayer', 'mp4_turntable'].includes(f),
  );

  const stages = [
    {
      stage_index: 1,
      stage_id: 'discover',
      stage_name: 'Discover & Scope Intent',
      skills: ['blender-brainstorming', 'workflow-stage-router', 'scope-guard'],
      knowledge_refs: [
        'knowledge.mesh-manifold-normals-and-scale-hygiene',
        'knowledge.modular-architectural-grid-and-metric-scale',
      ],
      entry_criteria: 'Structured SceneSpec validated against schemas/scene-spec.schema.json.',
      exit_gate: 'Scope bounded to supported Blender/glTF capabilities with zero out-of-scope DCC assumptions.',
    },
    {
      stage_index: 2,
      stage_id: 'define',
      stage_name: 'Define Brief, Budgets & Acceptance Criteria',
      skills: [
        'intent-to-3d-brief-writer',
        'acceptance-criteria-builder',
        'polycount-budget-checker',
        ...(spec.optimization_and_budgets.target_tier === 'mobile_web' ? ['mobile-glb-budget'] : []),
      ],
      knowledge_refs: [
        'knowledge.triangle-draw-call-and-vram-budgets',
        'knowledge.gltf-2-coordinate-system-and-transform-conventions',
      ],
      entry_criteria: 'Primary goal and target platform budgets declared.',
      exit_gate: 'Measurable triangle, draw-call, VRAM, and visual acceptance criteria locked.',
    },
    {
      stage_index: 3,
      stage_id: 'plan',
      stage_name: 'Harmonize Recipes, Camera, Lighting & Render Decisions',
      skills: [
        'recipe-fit-assessor',
        'blender-recipe-decomposer',
        ...(primaryPlannerSkill ? [primaryPlannerSkill] : []),
        'camera-composition',
        'lighting-material-plan',
        'cycles-vs-eevee-decision',
        'color-management-decision',
        'resolution-aspect-decision',
        'output-format-decision',
      ],
      knowledge_refs: [
        'knowledge.physically-based-camera-lens-and-dof',
        'knowledge.three-point-and-hdri-studio-lighting',
        'knowledge.principled-bsdf-v2-energy-conserving-pbr',
        'knowledge.agx-filmic-color-management-and-cycles-eevee',
      ],
      entry_criteria: 'Acceptance criteria locked and recipes decomposed.',
      exit_gate: 'Zero blocking cross-skill conflicts in ExecutionPlan.',
    },
    {
      stage_index: 4,
      stage_id: 'source',
      stage_name: 'Source Assets, Check Readiness & Verify Runtime Path',
      skills: [
        'asset-discovery',
        'asset-license-checker',
        'asset-style-check',
        'asset-fallback-strategy',
        'scene-readiness',
        'runtime-path-picker',
        'runtime-readiness',
        selectedRuntimeSkill,
      ],
      knowledge_refs: [
        'knowledge.mesh-manifold-normals-and-scale-hygiene',
        'knowledge.modular-architectural-grid-and-metric-scale',
      ],
      entry_criteria: 'Harmonized ExecutionPlan status is ready or ready_with_warnings.',
      exit_gate: 'All source assets pass scale/manifold readiness and runtime smoke check is recorded.',
    },
    {
      stage_index: 5,
      stage_id: 'execute',
      stage_name: 'Execute Scene Assembly, Shading, Lighting & Baking',
      skills: [
        'stage-gates',
        'runtime-attempt-report',
        ...(spec.animation_and_rigging.enabled ? ['glb-animation-handoff'] : []),
        ...(deliversGlb ? ['glb-web-handoff'] : []),
      ],
      knowledge_refs: [
        'knowledge.non-destructive-hard-surface-modifier-stack',
        'knowledge.uv-seam-placement-and-texel-density',
        'knowledge.normal-roughness-and-orm-channel-packing',
        ...(spec.style_and_materials.bake_procedural_to_pbr
          ? ['knowledge.shader-node-gltf-export-portability']
          : []),
      ],
      entry_criteria: 'Stage 4 readiness gates passed with no blocking conflicts.',
      exit_gate: 'All scene mutations, UV/PBR bakes, and lighting setups recorded in runtime attempt report.',
    },
    {
      stage_index: 6,
      stage_id: 'verify',
      stage_name: 'Verify Quality Checkers & Pre-Handoff Gates',
      skills: [
        'composition-quality-checker',
        'lighting-quality-checker',
        'material-quality-checker',
        'preview-report',
        'pre-handoff-verification',
      ],
      knowledge_refs: [
        'knowledge.environment-depth-layering-and-atmospheric-perspective',
        'knowledge.glb-binary-chunk-alignment-and-khronos-validation',
        ...(deliversGlb ? ['knowledge.threejs-r3f-tone-mapping-and-environment-parity'] : []),
      ],
      entry_criteria: 'Scene assembly and baking completed.',
      exit_gate: 'All composition, lighting, material, and Khronos validator checks pass.',
    },
    {
      stage_index: 7,
      stage_id: 'deliver',
      stage_name: 'Record Evidence Packets & Plain-Language Delivery',
      skills: [
        'render-export-evidence',
        'done-criteria',
        'plain-language-response',
        ...(spec.deliverables.target_consumers.includes('threejs_r3f') ? ['r3f-component-plan'] : []),
      ],
      knowledge_refs: [
        'knowledge.glb-binary-chunk-alignment-and-khronos-validation',
        'knowledge.texture-resolution-ktx2-and-draco-meshopt-compression',
      ],
      entry_criteria: 'Pre-handoff verification passed.',
      exit_gate: 'Validated evidence packets recorded under docs/evals/ before any Verified claim.',
    },
  ];

  // Deduplicate stage skills & knowledge refs
  const allSkillSet = new Set();
  const allKnowledgeSet = new Set();

  for (const step of recipeResolution.decomposed_sub_goals) {
    for (const s of step.skills) allSkillSet.add(s);
    for (const k of step.knowledge_refs) allKnowledgeSet.add(k);
  }
  for (const st of stages) {
    st.skills = [...new Set(st.skills)];
    st.knowledge_refs = [...new Set(st.knowledge_refs)];
    for (const s of st.skills) allSkillSet.add(s);
    for (const k of st.knowledge_refs) allKnowledgeSet.add(k);
  }
  for (const c of conflicts) {
    for (const s of c.affected_skills) allSkillSet.add(s);
    for (const k of c.knowledge_refs) allKnowledgeSet.add(k);
  }

  const resolvedKnowledge = [...allKnowledgeSet]
    .map((id) => knowledgeById.get(id))
    .filter(Boolean)
    .map((k) => ({
      id: k.id,
      title: k.title,
      domain: k.domain,
      authority_level: k.evidence_status || 'version-checked',
      blender_versions: k.blender_versions || { minimum: '3.6 LTS', doc_checked_version: '5.2.3 LTS' },
    }));

  const parameterDecisions = [
    {
      parameter: 'uv_packing_and_shader_portability',
      selected_value: deliversGlb
        ? 'single_0_1_atlas_baked_principled_bsdf'
        : `${spec.style_and_materials.uv_packing}_${spec.style_and_materials.shader_workflow}`,
      winning_layer_rank: deliversGlb ? 2 : 5,
      winning_layer_id: deliversGlb
        ? 'layer_2_target_delivery_format_and_spec'
        : 'layer_5_explicit_scene_spec_parameters',
      governing_id: deliversGlb
        ? 'knowledge.shader-node-gltf-export-portability'
        : 'style_and_materials',
      rationale: deliversGlb
        ? 'Khronos glTF 2.0 requires [0, 1] UV coordinates and baked Principled BSDF image textures.'
        : 'Uses explicit SceneSpec UV packing and shader workflow for offline rendering.',
    },
    {
      parameter: 'triangle_and_vram_budget',
      selected_value: `${spec.optimization_and_budgets.max_triangles} tris / ${spec.optimization_and_budgets.max_vram_mb} MB VRAM`,
      winning_layer_rank: 4,
      winning_layer_id: 'layer_4_explicit_performance_and_resource_budgets',
      governing_id: 'knowledge.triangle-draw-call-and-vram-budgets',
      rationale: `Enforces explicit ${spec.optimization_and_budgets.target_tier} budget ceiling via polycount-budget-checker.`,
    },
    {
      parameter: 'render_engine_and_color_transform',
      selected_value: `${spec.render_and_color.engine} (${spec.render_and_color.view_transform} / ${spec.render_and_color.look})`,
      winning_layer_rank: 5,
      winning_layer_id: 'layer_5_explicit_scene_spec_parameters',
      governing_id: 'knowledge.agx-filmic-color-management-and-cycles-eevee',
      rationale:
        'Preserves explicit SceneSpec engine and AgX color management with highlight desaturation rolloff.',
    },
    {
      parameter: 'runtime_execution_path',
      selected_value: spec.runtime_preference.preferred_path,
      winning_layer_rank: 3,
      winning_layer_id: 'layer_3_runtime_and_blender_version_limits',
      governing_id: selectedRuntimeSkill,
      rationale: `Routes execution planning through ${selectedRuntimeSkill} while keeping truth states at Not Run / Not Produced.`,
    },
  ];

  const stageGates = [
    {
      gate_id: 'gate.transform-and-manifold-readiness',
      stage_id: 'source',
      skill_id: 'scene-readiness',
      criterion:
        'All objects have applied unit scale [1, 1, 1], zero non-manifold holes, and consistent outward normals.',
      blocking: true,
    },
    {
      gate_id: 'gate.polycount-and-vram-budget',
      stage_id: 'define',
      skill_id: 'polycount-budget-checker',
      criterion: `Total triangles <= ${spec.optimization_and_budgets.max_triangles.toLocaleString()}, draw calls <= ${spec.optimization_and_budgets.max_draw_calls}, VRAM <= ${spec.optimization_and_budgets.max_vram_mb} MB.`,
      blocking: true,
    },
    {
      gate_id: 'gate.pbr-and-color-management-audit',
      stage_id: 'verify',
      skill_id: 'material-quality-checker',
      criterion:
        'Albedo within [0.04, 0.90] linear sRGB, Non-Color set on Normal/ORM maps, and AgX view transform verified.',
      blocking: true,
    },
    {
      gate_id: 'gate.evidence-before-done',
      stage_id: 'deliver',
      skill_id: 'done-criteria',
      criterion:
        'No runtime mutation, render, or GLB export claim may be marked Verified without a schema-valid evidence packet under docs/evals/.',
      blocking: true,
    },
  ];

  const requiredEvidencePackets = [
    {
      packet_type: 'runtime-smoke',
      governing_skill: 'runtime-readiness',
      schema_ref: 'schemas/evidence-packet.schema.json',
      required_before_claim: 'Verified runtime connection or scene inspection',
      default_truth_state: 'Not Run',
    },
    {
      packet_type: 'preview-check',
      governing_skill: 'preview-report',
      schema_ref: 'schemas/evidence-packet.schema.json',
      required_before_claim: 'Verified viewport/camera/lighting preview',
      default_truth_state: 'Not Produced',
    },
  ];

  if (deliversRender) {
    requiredEvidencePackets.push({
      packet_type: 'render-export',
      governing_skill: 'render-export-evidence',
      schema_ref: 'schemas/evidence-packet.schema.json',
      required_before_claim: 'Verified still render or turntable artifact',
      default_truth_state: 'Not Produced',
    });
  }
  if (deliversGlb) {
    requiredEvidencePackets.push({
      packet_type: 'glb-handoff',
      governing_skill: 'glb-web-handoff',
      schema_ref: 'schemas/evidence-packet.schema.json',
      required_before_claim: 'Verified Khronos glTF 2.0 GLB export and web handoff',
      default_truth_state: 'Not Produced',
    });
  }

  const planSlug = spec.id.replace(/^scene-spec\./, '');
  const plan = {
    schema_version: '1.0.0',
    plan_id: `plan.${planSlug}`,
    scene_spec_id: spec.id,
    scene_spec_title: spec.title,
    status,
    can_proceed_to_runtime: canProceedToRuntime,
    blender_version_target: spec.blender_version_target,
    runtime_preference: {
      preferred_path: spec.runtime_preference.preferred_path,
      allow_cli_fallback: spec.runtime_preference.allow_cli_fallback,
      selected_runtime_skill: selectedRuntimeSkill,
    },
    precedence_hierarchy: PRECEDENCE_HIERARCHY,
    recipe_resolution: recipeResolution,
    stages,
    resolved_skills: [...allSkillSet],
    resolved_knowledge: resolvedKnowledge,
    parameter_decisions: parameterDecisions,
    conflicts,
    conflict_summary: {
      blocking_count: blockingCount,
      warning_count: warningCount,
      informational_count: infoCount,
      total_count: conflicts.length,
    },
    stage_gates: stageGates,
    required_evidence_packets: requiredEvidencePackets,
    truth_states: {
      runtime_status: 'Not Run',
      artifact_status: 'Not Produced',
      evidence_gate_enforced: true,
    },
  };

  const ajv = new Ajv2020({ allErrors: true, strict: false });
  const validatePlan = ajv.compile(planSchema);
  if (!validatePlan(plan)) {
    throw new Error(
      `Compiled ExecutionPlan failed schema validation: ${formatAjvErrors(validatePlan.errors).join('; ')}`,
    );
  }

  return {
    ok: true,
    catalog_source_mode: catalogPaths.sourceMode,
    validation: specValidation,
    plan,
    runtime_status: 'Not Run',
    artifact_status: 'Not Produced',
  };
}

/**
 * Validates and inspects an existing ExecutionPlan JSON object or file,
 * enforcing both JSON Schema Draft 2020-12 and cross-layer semantic invariants.
 */
export function inspectExecutionPlan(planOrPath, options = {}) {
  const repoRoot = options.repoRoot || DEFAULT_REPO_ROOT;
  const projectDir = options.projectDir || null;
  const catalogPaths = resolveCatalogPaths(repoRoot, projectDir);
  const { schemasDir, knowledgeCatalogPath, recipeCatalogPath, skillsPath, sourceMode } =
    catalogPaths;
  const planSchema = readJsonFile(path.join(schemasDir, 'execution-plan.schema.json'));

  let plan;
  try {
    plan = loadInputJson(planOrPath).data;
  } catch (err) {
    return {
      valid: false,
      errors: [err.message],
      plan: null,
      runtime_status: 'Not Run',
      artifact_status: 'Not Produced',
    };
  }

  const ajv = new Ajv2020({ allErrors: true, strict: false });
  const validate = ajv.compile(planSchema);
  const errors = [];
  if (!validate(plan)) {
    for (const msg of formatAjvErrors(validate.errors)) {
      errors.push(`execution-plan schema error: ${msg}`);
    }
  }

  // Load canonical catalogs for semantic invariant verification (Defect 2C)
  let knowledgeById = new Map();
  let recipesById = new Map();
  let canonicalSkillIds = new Set();
  try {
    const knowledgeCatalog = readJsonFile(knowledgeCatalogPath);
    const recipeCatalog = readJsonFile(recipeCatalogPath);
    const skillsData = readJsonFile(skillsPath);
    knowledgeById = new Map((knowledgeCatalog.records || []).map((r) => [r.id, r]));
    recipesById = new Map((recipeCatalog.recipes || []).map((r) => [r.id, r]));
    canonicalSkillIds = new Set((skillsData.skills || []).map((s) => s.id));
  } catch (err) {
    errors.push(`Failed to load canonical catalogs for plan inspection: ${err.message}`);
  }

  if (plan && typeof plan === 'object') {
    // 1. Conflict counts and status consistency invariants
    const conflicts = Array.isArray(plan.conflicts) ? plan.conflicts : [];
    const seenConflictIds = new Set();
    for (const c of conflicts) {
      if (c && c.conflict_id) {
        if (seenConflictIds.has(c.conflict_id)) {
          errors.push(`Duplicate conflict_id in conflicts[]: "${c.conflict_id}"`);
        }
        seenConflictIds.add(c.conflict_id);
      }
    }

    const actualBlocking = conflicts.filter((c) => c?.severity === 'blocking').length;
    const actualWarning = conflicts.filter((c) => c?.severity === 'warning').length;
    const actualInfo = conflicts.filter((c) => c?.severity === 'informational').length;
    const actualTotal = conflicts.length;

    if (plan.conflict_summary && typeof plan.conflict_summary === 'object') {
      if (plan.conflict_summary.blocking_count !== actualBlocking) {
        errors.push(
          `conflict_summary.blocking_count (${plan.conflict_summary.blocking_count}) does not match actual blocking conflicts (${actualBlocking}).`,
        );
      }
      if (plan.conflict_summary.warning_count !== actualWarning) {
        errors.push(
          `conflict_summary.warning_count (${plan.conflict_summary.warning_count}) does not match actual warning conflicts (${actualWarning}).`,
        );
      }
      if (plan.conflict_summary.informational_count !== actualInfo) {
        errors.push(
          `conflict_summary.informational_count (${plan.conflict_summary.informational_count}) does not match actual informational conflicts (${actualInfo}).`,
        );
      }
      if (plan.conflict_summary.total_count !== actualTotal) {
        errors.push(
          `conflict_summary.total_count (${plan.conflict_summary.total_count}) does not match actual conflicts length (${actualTotal}).`,
        );
      }
    }

    const expectedStatus =
      actualBlocking > 0 ? 'blocked' : actualWarning > 0 ? 'ready_with_warnings' : 'ready';
    if (plan.status !== expectedStatus) {
      errors.push(
        `ExecutionPlan status "${plan.status}" contradicts conflicts (blocking=${actualBlocking}, warning=${actualWarning}; expected status="${expectedStatus}").`,
      );
    }

    const isPlanningOnlyPath =
      plan.runtime_preference?.preferred_path === 'unconfigured-planning-only';
    const expectedCanProceed =
      actualBlocking === 0 && plan.status !== 'blocked' && !isPlanningOnlyPath;
    if (plan.can_proceed_to_runtime !== expectedCanProceed) {
      errors.push(
        `ExecutionPlan can_proceed_to_runtime (${plan.can_proceed_to_runtime}) contradicts plan readiness/runtime state (status="${plan.status}", blocking=${actualBlocking}, preferred_path="${plan.runtime_preference?.preferred_path}"; expected ${expectedCanProceed}).`,
      );
    }

    // 2. Runtime path and version floor consistency
    const runtimeSkillMap = {
      'path-1-official-blender-lab-mcp': 'path-one-host-outline',
      'path-2-community-mcp-for-blender': 'runtime-path-picker',
      'cli-appendix-headless': 'cli-appendix-job-outline',
      'unconfigured-planning-only': 'runtime-setup',
    };
    const prefPath = plan.runtime_preference?.preferred_path;
    if (!prefPath || !Object.prototype.hasOwnProperty.call(runtimeSkillMap, prefPath)) {
      errors.push(
        `Invalid runtime_preference.preferred_path "${String(prefPath)}". Must be one of: ${Object.keys(runtimeSkillMap).join(', ')}.`,
      );
    } else if (plan.runtime_preference.selected_runtime_skill !== runtimeSkillMap[prefPath]) {
      errors.push(
        `runtime_preference.selected_runtime_skill "${plan.runtime_preference.selected_runtime_skill}" does not match preferred_path "${prefPath}" (expected "${runtimeSkillMap[prefPath]}").`,
      );
    }

    if (plan.blender_version_target && typeof plan.blender_version_target === 'object') {
      const vBounds = extractBlenderVersionBounds(plan.blender_version_target);
      if (vBounds.minVer !== null && vBounds.recVer !== null && vBounds.minVer > vBounds.recVer) {
        errors.push(
          `blender_version_target.min (${plan.blender_version_target.min}) exceeds recommended (${plan.blender_version_target.recommended}).`,
        );
      }
      if (
        prefPath === 'path-1-official-blender-lab-mcp' &&
        ((vBounds.recVer !== null && vBounds.recVer < 501) ||
          (vBounds.effectiveMaxVer !== null && vBounds.effectiveMaxVer < 501)) &&
        plan.status !== 'blocked'
      ) {
        errors.push(
          `ExecutionPlan selects Path 1 Official Blender Lab MCP with Blender target below 5.1+ (${plan.blender_version_target.recommended}), but status is "${plan.status}" instead of "blocked".`,
        );
      }
      if (
        (prefPath === 'path-2-community-mcp-for-blender' ||
          prefPath === 'cli-appendix-headless') &&
        ((vBounds.recVer !== null && vBounds.recVer < 300) ||
          (vBounds.effectiveMaxVer !== null && vBounds.effectiveMaxVer < 300) ||
          (vBounds.minVer !== null && vBounds.minVer < 300)) &&
        plan.status !== 'blocked'
      ) {
        errors.push(
          `ExecutionPlan selects ${prefPath} with Blender target below 3.0+ (${plan.blender_version_target.recommended}), but status is "${plan.status}" instead of "blocked".`,
        );
      }
    }

    // 3. Recipe resolution integrity against canonical recipe catalog
    const rr = plan.recipe_resolution;
    if (rr && typeof rr === 'object') {
      if (!rr.primary_recipe_id || !recipesById.has(rr.primary_recipe_id)) {
        errors.push(
          `Unresolved recipe_resolution.primary_recipe_id "${rr.primary_recipe_id}" in ${sourceMode} recipe catalog.`,
        );
      }
      const suppIds = Array.isArray(rr.supporting_recipe_ids) ? rr.supporting_recipe_ids : [];
      const seenSupp = new Set();
      for (const sid of suppIds) {
        if (!recipesById.has(sid)) {
          errors.push(
            `Unresolved recipe_resolution.supporting_recipe_ids entry "${sid}" in ${sourceMode} recipe catalog.`,
          );
        }
        if (sid === rr.primary_recipe_id) {
          errors.push(
            `recipe_resolution.supporting_recipe_ids must not duplicate primary_recipe_id "${sid}".`,
          );
        }
        if (seenSupp.has(sid)) {
          errors.push(`Duplicate recipe ID "${sid}" in recipe_resolution.supporting_recipe_ids.`);
        }
        seenSupp.add(sid);
      }

      const subGoals = Array.isArray(rr.decomposed_sub_goals) ? rr.decomposed_sub_goals : [];
      if (subGoals.length > 0 && subGoals[0]?.recipe_id !== rr.primary_recipe_id) {
        errors.push(
          `recipe_resolution.decomposed_sub_goals[0].recipe_id ("${subGoals[0]?.recipe_id}") must match primary_recipe_id ("${rr.primary_recipe_id}").`,
        );
      }
      subGoals.forEach((sg, idx) => {
        if (sg.step_index !== idx + 1) {
          errors.push(
            `decomposed_sub_goals[${idx}].step_index (${sg.step_index}) must be sequential (${idx + 1}).`,
          );
        }
        if (!recipesById.has(sg.recipe_id)) {
          errors.push(
            `Unresolved decomposed_sub_goals[${idx}].recipe_id "${sg.recipe_id}" in ${sourceMode} recipe catalog.`,
          );
        }
        for (const sk of sg.skills || []) {
          if (!canonicalSkillIds.has(sk)) {
            errors.push(
              `Unknown skill "${sk}" in decomposed_sub_goals[${idx}].skills (not in canonical 48-skill registry).`,
            );
          }
        }
        for (const kr of sg.knowledge_refs || []) {
          if (!knowledgeById.has(kr)) {
            errors.push(
              `Unknown knowledge ref "${kr}" in decomposed_sub_goals[${idx}].knowledge_refs.`,
            );
          }
        }
      });
    }

    // 4. Resolved skills & knowledge cross-reference integrity
    const resolvedSkillSet = new Set();
    if (Array.isArray(plan.resolved_skills)) {
      for (const sk of plan.resolved_skills) {
        if (resolvedSkillSet.has(sk)) {
          errors.push(`Duplicate skill ID "${sk}" in resolved_skills.`);
        }
        resolvedSkillSet.add(sk);
        if (!canonicalSkillIds.has(sk)) {
          errors.push(
            `Unknown skill ID "${sk}" in resolved_skills (not in canonical 48-skill registry).`,
          );
        }
      }
    }

    const resolvedKnowledgeSet = new Set();
    if (Array.isArray(plan.resolved_knowledge)) {
      for (const kObj of plan.resolved_knowledge) {
        if (!kObj || !kObj.id) continue;
        if (resolvedKnowledgeSet.has(kObj.id)) {
          errors.push(`Duplicate knowledge ID "${kObj.id}" in resolved_knowledge.`);
        }
        resolvedKnowledgeSet.add(kObj.id);
        if (!knowledgeById.has(kObj.id)) {
          errors.push(
            `Unknown knowledge ID "${kObj.id}" in resolved_knowledge (not in canonical knowledge catalog).`,
          );
        }
      }
    }

    // 5. 7-stage ordering and stage skill/knowledge references
    const expectedStages = [
      'discover',
      'define',
      'plan',
      'source',
      'execute',
      'verify',
      'deliver',
    ];
    if (Array.isArray(plan.stages)) {
      plan.stages.forEach((st, idx) => {
        if (st.stage_index !== idx + 1) {
          errors.push(`stages[${idx}].stage_index (${st.stage_index}) must be ${idx + 1}.`);
        }
        if (st.stage_id !== expectedStages[idx]) {
          errors.push(
            `stages[${idx}].stage_id ("${st.stage_id}") must be "${expectedStages[idx]}" at stage_index ${idx + 1}.`,
          );
        }
        for (const sk of st.skills || []) {
          if (!canonicalSkillIds.has(sk)) {
            errors.push(`Unknown skill ID "${sk}" in stages[${idx}].skills.`);
          }
          if (!resolvedSkillSet.has(sk)) {
            errors.push(
              `Skill "${sk}" in stages[${idx}].skills is missing from plan.resolved_skills.`,
            );
          }
        }
        for (const kr of st.knowledge_refs || []) {
          if (!knowledgeById.has(kr)) {
            errors.push(`Unknown knowledge ID "${kr}" in stages[${idx}].knowledge_refs.`);
          }
          if (!resolvedKnowledgeSet.has(kr)) {
            errors.push(
              `Knowledge "${kr}" in stages[${idx}].knowledge_refs is missing from plan.resolved_knowledge.`,
            );
          }
        }
      });
    }

    // 6. Stage gates, conflict references, and required evidence packets
    for (const gate of plan.stage_gates || []) {
      if (!canonicalSkillIds.has(gate.skill_id)) {
        errors.push(`Unknown skill_id "${gate.skill_id}" in stage_gates (${gate.gate_id}).`);
      }
      if (!expectedStages.includes(gate.stage_id)) {
        errors.push(`Invalid stage_id "${gate.stage_id}" in stage_gates (${gate.gate_id}).`);
      }
    }

    for (const c of conflicts) {
      for (const sk of c.affected_skills || []) {
        if (!canonicalSkillIds.has(sk)) {
          errors.push(`Unknown affected_skill "${sk}" in conflict "${c.conflict_id}".`);
        }
      }
      for (const kr of c.knowledge_refs || []) {
        if (!knowledgeById.has(kr)) {
          errors.push(`Unknown knowledge_ref "${kr}" in conflict "${c.conflict_id}".`);
        }
      }
    }

    const packetTypes = new Set();
    for (const pkt of plan.required_evidence_packets || []) {
      packetTypes.add(pkt.packet_type);
      if (!canonicalSkillIds.has(pkt.governing_skill)) {
        errors.push(
          `Unknown governing_skill "${pkt.governing_skill}" in required_evidence_packets (${pkt.packet_type}).`,
        );
      }
    }
    if (!packetTypes.has('runtime-smoke') || !packetTypes.has('preview-check')) {
      errors.push(
        `required_evidence_packets must include both "runtime-smoke" and "preview-check".`,
      );
    }

    // 7. Truth-state invariants (Law 1: Evidence Before Done)
    if (
      !plan.truth_states ||
      plan.truth_states.runtime_status !== 'Not Run' ||
      plan.truth_states.artifact_status !== 'Not Produced' ||
      plan.truth_states.evidence_gate_enforced !== true
    ) {
      errors.push(
        `ExecutionPlan truth_states must remain runtime_status="Not Run", artifact_status="Not Produced", evidence_gate_enforced=true.`,
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    catalog_source_mode: sourceMode,
    plan_id: plan?.plan_id || null,
    scene_spec_id: plan?.scene_spec_id || null,
    status: plan?.status || null,
    can_proceed_to_runtime: Boolean(plan?.can_proceed_to_runtime),
    primary_recipe_id: plan?.recipe_resolution?.primary_recipe_id || null,
    supporting_recipe_ids: plan?.recipe_resolution?.supporting_recipe_ids || [],
    resolved_skill_count: Array.isArray(plan?.resolved_skills) ? plan.resolved_skills.length : 0,
    resolved_knowledge_count: Array.isArray(plan?.resolved_knowledge)
      ? plan.resolved_knowledge.length
      : 0,
    conflict_summary: plan?.conflict_summary || null,
    conflicts: plan?.conflicts || [],
    plan,
    runtime_status: 'Not Run',
    artifact_status: 'Not Produced',
  };
}

function formatPlanInspectionHumanReport(inspection) {
  if (!inspection.valid) {
    return [
      '# BlendOps ExecutionPlan Inspection',
      'Valid: No',
      ...inspection.errors.map((e) => `  - ${e}`),
      'Runtime status: Not Run',
      'Artifact status: Not Produced',
    ].join('\n');
  }
  const p = inspection.plan;
  const lines = [
    `# BlendOps ExecutionPlan — ${p.plan_id}`,
    `SceneSpec: ${p.scene_spec_id} (${p.scene_spec_title})`,
    `Status: ${p.status} (Can proceed to runtime: ${p.can_proceed_to_runtime ? 'Yes' : 'No — blocked by conflicts or unconfigured runtime path'})`,
    `Primary Recipe: ${p.recipe_resolution.primary_recipe_id}`,
    `Supporting Recipes: ${p.recipe_resolution.supporting_recipe_ids.join(', ') || 'none'}`,
    `Resolved Skills (${p.resolved_skills.length}): ${p.resolved_skills.join(', ')}`,
    `Resolved Knowledge Records (${p.resolved_knowledge.length}): ${p.resolved_knowledge.map((k) => k.id).join(', ')}`,
    `Conflicts: ${p.conflict_summary.total_count} total (${p.conflict_summary.blocking_count} blocking, ${p.conflict_summary.warning_count} warning, ${p.conflict_summary.informational_count} informational)`,
  ];
  for (const c of p.conflicts) {
    lines.push(
      `  - [${c.severity.toUpperCase()}] ${c.conflict_id} (${c.rule_id}, winning layer #${c.winning_layer_rank} ${c.winning_layer_id}): ${c.summary}`,
      `    Remediation: ${c.remediation}`,
    );
  }
  lines.push(
    `Required Evidence Packets: ${p.required_evidence_packets.map((e) => e.packet_type).join(', ')}`,
    `Runtime status: ${p.truth_states.runtime_status}`,
    `Artifact status: ${p.truth_states.artifact_status}`,
  );
  return lines.join('\n');
}

/**
 * CLI handler for `scene-spec-validate`, `plan-compile`, and `plan-inspect`.
 */
export function runPlanCliSubcommand(argv, options = {}) {
  const repoRoot = options.repoRoot || DEFAULT_REPO_ROOT;
  const sub = argv[0];
  const rest = argv.slice(1);
  const asJson = rest.includes('--json');

  let projectDir = options.projectDir || null;
  let outPath = null;
  const positional = [];

  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg === '--json') continue;
    if (arg === '--project' && rest[i + 1]) {
      projectDir = rest[++i];
    } else if (arg === '--out' && rest[i + 1]) {
      outPath = rest[++i];
    } else if (!arg.startsWith('--')) {
      positional.push(arg);
    }
  }

  const targetPath = positional[0];
  if (!targetPath) {
    return {
      ok: false,
      exitCode: 1,
      report: `Missing required file path argument for ${sub}.\nRuntime status: Not Run\nArtifact status: Not Produced`,
      runtimeStatus: 'Not Run',
      artifactStatus: 'Not Produced',
    };
  }

  if (sub === 'scene-spec-validate') {
    const res = validateSceneSpec(targetPath, { repoRoot, projectDir });
    const report = asJson
      ? JSON.stringify(res, null, 2)
      : [
          `# BlendOps SceneSpec Validation`,
          `Spec ID: ${res.spec_id || 'unknown'}`,
          `Valid: ${res.valid ? 'Yes' : 'No'}`,
          `Errors: ${res.errors.length}`,
          ...res.errors.map((e) => `  - ${e}`),
          `Warnings: ${res.warnings.length}`,
          ...res.warnings.map((w) => `  - ${w}`),
          `Runtime status: Not Run`,
          `Artifact status: Not Produced`,
        ].join('\n');
    return {
      ok: res.valid,
      exitCode: res.valid ? 0 : 1,
      report,
      data: res,
      runtimeStatus: 'Not Run',
      artifactStatus: 'Not Produced',
    };
  }

  if (sub === 'plan-compile') {
    if (outPath) {
      const outCheck = validateSafeCliOutFilePath(outPath, { repoRoot, projectDir });
      if (!outCheck.valid) {
        const errPayload = {
          ok: false,
          error: outCheck.error,
          runtime_status: 'Not Run',
          artifact_status: 'Not Produced',
        };
        return {
          ok: false,
          exitCode: 1,
          report: asJson
            ? JSON.stringify(errPayload, null, 2)
            : `# BlendOps Plan Compilation Failed (Unsafe --out Path)\n  - ${outCheck.error}\nRuntime status: Not Run\nArtifact status: Not Produced`,
          data: errPayload,
          runtimeStatus: 'Not Run',
          artifactStatus: 'Not Produced',
        };
      }
    }

    const compiled = compileExecutionPlan(targetPath, { repoRoot, projectDir });
    if (!compiled.ok) {
      const report = asJson
        ? JSON.stringify(compiled, null, 2)
        : [
            `# BlendOps Plan Compilation Failed (Invalid SceneSpec)`,
            ...compiled.validation.errors.map((e) => `  - ${e}`),
            `Runtime status: Not Run`,
            `Artifact status: Not Produced`,
          ].join('\n');
      return {
        ok: false,
        exitCode: 1,
        report,
        data: compiled,
        runtimeStatus: 'Not Run',
        artifactStatus: 'Not Produced',
      };
    }

    if (outPath) {
      writeFileAtomicallySafe(outPath, JSON.stringify(compiled.plan, null, 2) + '\n', {
        repoRoot,
        projectDir,
      });
    }

    const inspection = inspectExecutionPlan(compiled.plan, { repoRoot, projectDir });
    const report = asJson
      ? JSON.stringify(compiled.plan, null, 2)
      : formatPlanInspectionHumanReport(inspection);

    const isBlocked = compiled.plan.status === 'blocked';
    return {
      ok: !isBlocked,
      exitCode: isBlocked ? 2 : 0,
      report,
      data: compiled.plan,
      runtimeStatus: 'Not Run',
      artifactStatus: 'Not Produced',
    };
  }

  if (sub === 'plan-inspect') {
    const inspection = inspectExecutionPlan(targetPath, { repoRoot, projectDir });
    const report = asJson
      ? JSON.stringify(inspection, null, 2)
      : formatPlanInspectionHumanReport(inspection);
    return {
      ok: inspection.valid,
      exitCode: inspection.valid ? 0 : 1,
      report,
      data: inspection,
      runtimeStatus: 'Not Run',
      artifactStatus: 'Not Produced',
    };
  }

  return {
    ok: false,
    exitCode: 1,
    report: `Unknown plan subcommand: ${sub}`,
    runtimeStatus: 'Not Run',
    artifactStatus: 'Not Produced',
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const args = process.argv.slice(2);
  const res = runPlanCliSubcommand(args, { repoRoot: DEFAULT_REPO_ROOT });
  console.log(res.report);
  process.exit(res.exitCode);
}
