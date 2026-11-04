#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = path.resolve(__dirname, '..');

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
  'how', 'in', 'into', 'is', 'it', 'of', 'on', 'or', 'that', 'the',
  'their', 'this', 'to', 'use', 'using', 'vs', 'when', 'with'
]);

const OUT_OF_SCOPE_TOKENS = new Set([
  'houdini', 'vex', 'wrangle', 'pyro', 'solaris', 'karma', 'lops',
  'unreal', 'nanite', 'lumen', 'niagara', 'metasounds', 'blueprint',
  'maya', 'xgen', 'bifrost', 'arnold', '3dsmax', 'cinema4d', 'zIbrush', 'zsphere'
]);

export const REQUIRED_DOMAINS = [
  'modeling-and-topology',
  'hard-surface-and-organic',
  'geometry-nodes-and-procedural',
  'uv-texturing-and-baking',
  'materials-shaders-and-pbr',
  'lighting-camera-and-rendering',
  'rigging-and-animation',
  'simulation-and-vfx',
  'environment-and-architecture',
  'optimization-lod-and-performance',
  'interchange-gltf-and-web'
];

export const REQUIRED_RECIPE_IDS = [
  'recipe.product-hero-scene',
  'recipe.stylized-environment-scene',
  'recipe.hard-surface-prop',
  'recipe.procedural-geometry-nodes-asset',
  'recipe.uv-and-pbr-material-preparation',
  'recipe.presentation-lighting-and-camera',
  'recipe.rigged-and-animated-asset',
  'recipe.scene-quality-inspection-and-correction',
  'recipe.blender-to-glb-handoff',
  'recipe.web-ready-asset-optimization'
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJsonStable(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

export function tokenize(text) {
  if (!text) return [];
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9+#.-]+/g, ' ')
    .split(/\s+/)
    .map((t) => t.replace(/^[.-]+|[.-]+$/g, ''))
    .filter((t) => t.length >= 2 && !STOP_WORDS.has(t));
}

function classifySkillRole(skill) {
  const stage = skill.workflow_stage;
  const cat = skill.category;
  if (stage === 'discover' || stage === 'plan' || cat === 'intake-and-planning' || cat === 'workflow-governance') {
    return 'intake-routing-or-governance';
  }
  if (stage === 'inspect' || cat === 'scene-hygiene') {
    return 'scene-inspection-or-repair';
  }
  if (stage === 'Light' || stage === 'light' || stage === 'render' || cat === 'lighting-and-camera' || cat === 'rendering') {
    return 'lighting-camera-or-render-workflow';
  }
  if (stage === 'export' || stage === 'handoff' || cat === 'export-and-interchange' || cat === 'web-handoff') {
    return 'export-interchange-or-handoff';
  }
  if (stage === 'review' || stage === 'recover') {
    return 'review-recovery-or-evidence';
  }
  if (skill.id.includes('uv') || skill.id.includes('pbr') || skill.id.includes('material') || skill.id.includes('shader') || skill.id.includes('bake')) {
    return 'uv-material-or-lookdev-workflow';
  }
  if (skill.id.includes('budget') || skill.id.includes('decimate') || skill.id.includes('compression')) {
    return 'optimization-or-budget-audit';
  }
  return 'modeling-or-procedural-workflow';
}

function classifyReferenceFile(relPath, promotedMap) {
  const promotedTo = promotedMap.get(relPath) || [];
  if (
    relPath.startsWith('skills/recipe-fit-assessor/references/') ||
    relPath.startsWith('skills/blender-recipe-decomposer/references/')
  ) {
    return {
      path: relPath,
      classification: 'recipe_specific_procedure',
      rationale: 'Defines recipe catalog matching, fit scoring, or recipe sub-step decomposition rules linked to registry/recipe-catalog.json.',
      promoted_to_knowledge_ids: promotedTo
    };
  }
  if (
    relPath.startsWith('skills/workflow-stage-router/references/') ||
    relPath.startsWith('skills/pack-prerequisite-checker/references/') ||
    relPath.startsWith('skills/acceptance-criteria-builder/references/') ||
    relPath.startsWith('skills/request-clarifier/references/') ||
    relPath.startsWith('skills/reference-brief-Normalizer/') ||
    relPath.startsWith('skills/reference-brief-normalizer/references/') ||
    relPath.startsWith('skills/blender-checkpoint-manager/references/') ||
    relPath.startsWith('skills/safe-cleanup-planner/references/') ||
    relPath.startsWith('skills/mutation-Rollback-guard/') ||
    relPath.startsWith('skills/mutation-rollback-guard/references/') ||
    relPath.startsWith('skills/failure-triage-router/references/')
  ) {
    return {
      path: relPath,
      classification: 'workflow_or_pack_governance',
      rationale: 'Governs BlendOps workflow stage routing, pack prerequisites, checkpoint/rollback safety, or intake clarification.',
      promoted_to_knowledge_ids: promotedTo
    };
  }
  if (promotedTo.length > 0) {
    return {
      path: relPath,
      classification: 'reusable_cross_skill_knowledge',
      rationale: `Contains domain rules promoted to canonical knowledge record(s): ${promotedTo.join(', ')} while remaining available as a local skill reference.`,
      promoted_to_knowledge_ids: promotedTo
    };
  }
  return {
    path: relPath,
    classification: 'skill_specific_operating_instructions',
    rationale: 'Provides skill-local execution steps, report formatting templates, or checklists specific to this skill contract.',
    promoted_to_knowledge_ids: []
  };
}

export function buildSkillArchitectureAuditData(rootDir = DEFAULT_ROOT) {
  const skillsRegistry = readJson(path.join(rootDir, 'registry/skills.json'));
  const knowledgeCatalog = readJson(path.join(rootDir, 'registry/knowledge-catalog.json'));
  const recipeCatalog = readJson(path.join(rootDir, 'registry/recipe-catalog.json'));
  const workflowGraph = readJson(path.join(rootDir, 'registry/workflow-graph.json'));

  const promotedMap = new Map();
  const skillToKnowledge = new Map();
  const skillToRecipes = new Map();

  for (const record of knowledgeCatalog.records) {
    for (const refPath of record.promoted_from_skill_refs || []) {
      if (!promotedMap.has(refPath)) promotedMap.set(refPath, []);
      promotedMap.get(refPath).push(record.id);
    }
    for (const skillId of record.related_ids?.skill_ids || []) {
      if (!skillToKnowledge.has(skillId)) skillToKnowledge.set(skillId, []);
      if (!skillToKnowledge.get(skillId).includes(record.id)) {
        skillToKnowledge.get(skillId).push(record.id);
      }
    }
  }

  for (const recipe of recipeCatalog.recipes) {
    const allSkillIds = new Set([
      ...(recipe.required_skill_ids || recipe.required_skills || []),
      ...(recipe.optional_skills || [])
    ]);
    for (const st of recipe.stages || []) {
      for (const sid of st.skill_ids || []) allSkillIds.add(sid);
    }
    for (const skillId of allSkillIds) {
      if (!skillToRecipes.has(skillId)) skillToRecipes.set(skillId, []);
      if (!skillToRecipes.get(skillId).includes(recipe.id)) {
        skillToRecipes.get(skillId).push(recipe.id);
      }
    }
  }

  const allReferenceClassifications = [];
  const classificationCounts = {
    reusable_cross_skill_knowledge: 0,
    skill_specific_operating_instructions: 0,
    recipe_specific_procedure: 0,
    workflow_or_pack_governance: 0,
    historical_or_eval_evidence: 0,
    outdated_or_duplicated: 0
  };

  const skillAudits = skillsRegistry.skills.map((skill) => {
    const refsDir = path.join(rootDir, 'skills', skill.id, 'references');
    const refFiles = fs.existsSync(refsDir)
      ? fs.readdirSync(refsDir).filter((f) => f.endsWith('.md')).sort()
      : [];

    const classifiedRefs = refFiles.map((fileName) => {
      const relPath = `skills/${skill.id}/references/${fileName}`;
      const entry = classifyReferenceFile(relPath, promotedMap);
      classificationCounts[entry.classification] = (classificationCounts[entry.classification] || 0) + 1;
      allReferenceClassifications.push(entry);
      return entry;
    });

    const linkedKnowledge = (skillToKnowledge.get(skill.id) || []).sort();
    const linkedRecipes = (skillToRecipes.get(skill.id) || []).sort();

    return {
      skill_id: skill.id,
      display_name: skill.display_name || skill.name,
      workflow_stage: skill.workflow_stage,
      category: skill.category,
      capability_tier: skill.capability_tier,
      mutates_scene: Boolean(skill.mutates_scene),
      laws_enforced: skill.laws || [],
      primary_layer: 'skill-layer',
      current_role_classification: classifySkillRole(skill),
      recommended_disposition: 'keep_as_skill_and_link_knowledge',
      linked_knowledge_ids: linkedKnowledge,
      linked_recipe_ids: linkedRecipes,
      reference_files_count: classifiedRefs.length,
      references: classifiedRefs
    };
  });

  return {
    schema_version: '1.0.0',
    audit_scope: 'phase-0-and-phase-1-architecture-reconciliation',
    five_layer_architecture: {
      skill_layer: {
        canonical_paths: ['skills/*/SKILL.md', 'skills/*/skill.contract.json', 'registry/skills.json', 'registry/workflow-graph.json'],
        skill_count: skillAudits.length,
        workflow_edge_count: (workflowGraph.edges || []).length
      },
      knowledge_layer: {
        canonical_paths: ['registry/knowledge-sources.json', 'registry/knowledge-catalog.json', 'schemas/knowledge-record.schema.json', 'schemas/knowledge-source-registry.schema.json'],
        domain_count: REQUIRED_DOMAINS.length,
        source_count: readJson(path.join(rootDir, 'registry/knowledge-sources.json')).sources.length,
        knowledge_record_count: knowledgeCatalog.records.length
      },
      recipe_layer: {
        canonical_paths: ['registry/recipe-catalog.json', 'schemas/recipe-record.schema.json', 'docs/recipes/'],
        recipe_count: recipeCatalog.recipes.length,
        scenario_recipes: ['docs/recipes/cyberpunk-shoe-hero.md']
      },
      runtime_production_layer: {
        status: 'external-boundary-only',
        paths_supported: [
          'Path 1: Official Blender Lab MCP (Blender 5.1+ Lab add-on + server)',
          'Path 2: Community mcp-for-blender (Blender 3.0+)',
          'CLI Appendix: blender --background --python'
        ],
        capability_policy_path: 'registry/runtime-capability-policy.json'
      },
      evaluation_and_evidence_layer: {
        canonical_paths: ['evals/suites/*.eval.json', 'evals/catalog-retrieval-evals.json', 'docs/evals/', 'docs/audits/'],
        runtime_execution_truth_state: 'Not Run',
        artifact_production_truth_state: 'Not Produced'
      }
    },
    summary: {
      total_skills_audited: skillAudits.length,
      total_skill_references_classified: allReferenceClassifications.length,
      reference_classification_breakdown: classificationCounts,
      skills_with_linked_knowledge: skillAudits.filter((s) => s.linked_knowledge_ids.length > 0).length,
      skills_with_linked_recipes: skillAudits.filter((s) => s.linked_recipe_ids.length > 0).length
    },
    skills: skillAudits,
    reference_classifications: allReferenceClassifications
  };
}

export function renderSkillArchitectureAuditMarkdown(auditData) {
  const lines = [
    '# BlendOps Phase 0 & Phase 1 — Skill Architecture & Reference Classification Audit',
    '',
    '> Generated deterministically by `scripts/build-knowledge-catalog.mjs`. Maps all 48 canonical skills and classifies all 151 `skills/*/references/*.md` files across the 5-layer architecture.',
    '',
    '## 1. Five-Layer Architecture Summary',
    '',
    '| Layer | Canonical Artifacts | Count / Status | Responsibility |',
    '| :--- | :--- | :--- | :--- |',
    `| **A. Skill Layer** | \`skills/*/SKILL.md\`, \`registry/skills.json\`, \`registry/workflow-graph.json\` | ${auditData.five_layer_architecture.skill_layer.skill_count} skills, ${auditData.five_layer_architecture.skill_layer.workflow_edge_count} workflow edges | Single-responsibility agent task units, contracts, capability tiers (\`L0\`–\`L3\`), and handoffs |`,
    `| **B. Knowledge Layer** | \`registry/knowledge-sources.json\`, \`registry/knowledge-catalog.json\` | ${auditData.five_layer_architecture.knowledge_layer.knowledge_record_count} records across ${auditData.five_layer_architecture.knowledge_layer.domain_count} domains (${auditData.five_layer_architecture.knowledge_layer.source_count} sources) | Reusable, source-traceable 3D/Blender domain rules, parameters, tradeoffs, and validation checks |`,
    `| **C. Recipe Layer** | \`registry/recipe-catalog.json\`, \`docs/recipes/cyberpunk-shoe-hero.md\` | ${auditData.five_layer_architecture.recipe_layer.recipe_count} canonical recipes + 1 golden-path scenario doc | Multi-stage asset/scene construction plans composing skills, knowledge records, and checkpoints |`,
    `| **D. Runtime / Production Layer** | \`registry/runtime-capability-policy.json\`, \`docs/runtime-stack-strategy.md\` | External boundary (Path 1 Lab MCP 5.1+, Path 2 \`mcp-for-blender\` 3.0+, CLI appendix) | External execution bridges; BlendOps owns zero runtime servers or add-ons |`,
    `| **E. Evaluation & Evidence Layer** | \`evals/suites/\`, \`evals/catalog-retrieval-evals.json\`, \`docs/evals/\` | Offline contract + retrieval evals passing; runtime = \`${auditData.five_layer_architecture.evaluation_and_evidence_layer.runtime_execution_truth_state}\`, artifacts = \`${auditData.five_layer_architecture.evaluation_and_evidence_layer.artifact_production_truth_state}\` | Separates schema validity, source backing, version checks, runtime execution, and visual critique |`,
    '',
    '## 2. Skill Reference Classification Summary (151 Files)',
    '',
    '| Classification Category | File Count | Description |',
    '| :--- | ---: | :--- |',
    `| \`reusable_cross_skill_knowledge\` | ${auditData.summary.reference_classification_breakdown.reusable_cross_skill_knowledge} | Domain rules promoted to canonical \`knowledge.*\` records in \`registry/knowledge-catalog.json\` |`,
    `| \`skill_specific_operating_instructions\` | ${auditData.summary.reference_classification_breakdown.skill_specific_operating_instructions} | Skill-local checklists, report templates, and step-by-step operating instructions |`,
    `| \`workflow_or_pack_governance\` | ${auditData.summary.reference_classification_breakdown.workflow_or_pack_governance} | Stage routing, intake clarification, pack prerequisite, checkpoint, and rollback governance |`,
    `| \`recipe_specific_procedure\` | ${auditData.summary.reference_classification_breakdown.recipe_specific_procedure} | Recipe discovery catalog and recipe decomposition rules synchronized with \`registry/recipe-catalog.json\` |`,
    `| \`historical_or_eval_evidence\` | ${auditData.summary.reference_classification_breakdown.historical_or_eval_evidence} | Historical evaluation or runtime evidence records (stored under \`docs/evals/\` and \`docs/audits/\`) |`,
    `| \`outdated_or_duplicated\` | ${auditData.summary.reference_classification_breakdown.outdated_or_duplicated} | Unreconciled duplicate or stale skill reference files |`,
    `| **Total** | **${auditData.summary.total_skill_references_classified}** | **100% of \`skills/*/references/*.md\` accounted for** |`,
    '',
    '## 3. Complete 48-Skill Architecture Matrix',
    '',
    '| # | Skill ID | Stage | Capability Tier | Role Classification | Disposition | Linked Knowledge | Linked Recipes | Refs |',
    '| ---: | :--- | :--- | :--- | :--- | :--- | ---: | ---: | ---: |'
  ];

  auditData.skills.forEach((s, idx) => {
    lines.push(
      `| ${idx + 1} | \`${s.skill_id}\` | \`${s.workflow_stage}\` | \`${s.capability_tier}\` | \`${s.current_role_classification}\` | \`${s.recommended_disposition}\` | ${s.linked_knowledge_ids.length} | ${s.linked_recipe_ids.length} | ${s.reference_files_count} |`
    );
  });

  lines.push(
    '',
    '## 4. Promoted Cross-Skill Reference Files -> Canonical Knowledge Records',
    '',
    '| Reference File Path | Classification | Promoted To Canonical `knowledge.*` ID(s) |',
    '| :--- | :--- | :--- |'
  );

  for (const ref of auditData.reference_classifications) {
    if (ref.promoted_to_knowledge_ids.length > 0 || ref.classification === 'recipe_specific_procedure') {
      const targets = ref.promoted_to_knowledge_ids.length > 0
        ? ref.promoted_to_knowledge_ids.map((id) => `\`${id}\``).join(', ')
        : 'Synchronized with `registry/recipe-catalog.json`';
      lines.push(`| \`${ref.path}\` | \`${ref.classification}\` | ${targets} |`);
    }
  }

  lines.push('');
  return lines.join('\n');
}

export const generateSkillArchitectureAuditData = buildSkillArchitectureAuditData;

function matchesJsonType(val, expectedType) {
  if (expectedType === 'null') return val === null;
  if (expectedType === 'array') return Array.isArray(val);
  if (expectedType === 'object') return typeof val === 'object' && val !== null && !Array.isArray(val);
  if (expectedType === 'integer') return typeof val === 'number' && Number.isInteger(val);
  if (expectedType === 'number') return typeof val === 'number' && Number.isFinite(val);
  if (expectedType === 'boolean') return typeof val === 'boolean';
  if (expectedType === 'string') return typeof val === 'string';
  return true;
}

function resolveSchemaRef(rootSchema, refStr) {
  if (typeof refStr !== 'string' || !refStr.startsWith('#/')) return null;
  const parts = refStr.slice(2).split('/');
  let cur = rootSchema;
  for (const p of parts) {
    if (!cur || typeof cur !== 'object') return null;
    cur = cur[p];
  }
  return cur || null;
}

function validateNodeAgainstSchema(val, schemaNode, rootSchema, instancePath, outErrors) {
  if (!schemaNode || typeof schemaNode !== 'object') return;

  if (schemaNode.$ref) {
    const resolved = resolveSchemaRef(rootSchema, schemaNode.$ref);
    if (resolved) {
      validateNodeAgainstSchema(val, resolved, rootSchema, instancePath, outErrors);
    }
    return;
  }

  if (schemaNode.type !== undefined) {
    const allowed = Array.isArray(schemaNode.type) ? schemaNode.type : [schemaNode.type];
    if (!allowed.some((t) => matchesJsonType(val, t))) {
      outErrors.push({ instancePath, message: `must be ${allowed.join(' or ')}` });
      return;
    }
  }

  if (schemaNode.const !== undefined && val !== schemaNode.const) {
    outErrors.push({ instancePath, message: `must be equal to constant ${JSON.stringify(schemaNode.const)}` });
  }

  if (Array.isArray(schemaNode.enum) && !schemaNode.enum.includes(val)) {
    outErrors.push({ instancePath, message: 'must be equal to one of the allowed values' });
  }

  if (Array.isArray(schemaNode.oneOf)) {
    const anyMatch = schemaNode.oneOf.some((sub) => {
      const subErrs = [];
      validateNodeAgainstSchema(val, sub, rootSchema, instancePath, subErrs);
      return subErrs.length === 0;
    });
    if (!anyMatch) {
      outErrors.push({ instancePath, message: 'must match exactly one schema in oneOf' });
    }
  }

  if (Array.isArray(schemaNode.allOf)) {
    for (const sub of schemaNode.allOf) {
      if (sub.if && sub.then) {
        const condErrs = [];
        validateNodeAgainstSchema(val, sub.if, rootSchema, instancePath, condErrs);
        if (condErrs.length === 0) {
          validateNodeAgainstSchema(val, sub.then, rootSchema, instancePath, outErrors);
        }
      } else {
        validateNodeAgainstSchema(val, sub, rootSchema, instancePath, outErrors);
      }
    }
  }

  if (typeof val === 'string') {
    if (typeof schemaNode.minLength === 'number' && val.length < schemaNode.minLength) {
      outErrors.push({ instancePath, message: `must NOT have fewer than ${schemaNode.minLength} characters` });
    }
    if (typeof schemaNode.maxLength === 'number' && val.length > schemaNode.maxLength) {
      outErrors.push({ instancePath, message: `must NOT have more than ${schemaNode.maxLength} characters` });
    }
    if (typeof schemaNode.pattern === 'string') {
      const re = new RegExp(schemaNode.pattern);
      if (!re.test(val)) {
        outErrors.push({ instancePath, message: `must match pattern "${schemaNode.pattern}"` });
      }
    }
  }

  if (typeof val === 'number' && Number.isFinite(val)) {
    if (typeof schemaNode.minimum === 'number' && val < schemaNode.minimum) {
      outErrors.push({ instancePath, message: `must be >= ${schemaNode.minimum}` });
    }
    if (typeof schemaNode.maximum === 'number' && val > schemaNode.maximum) {
      outErrors.push({ instancePath, message: `must be <= ${schemaNode.maximum}` });
    }
  }

  if (Array.isArray(val)) {
    if (typeof schemaNode.minItems === 'number' && val.length < schemaNode.minItems) {
      outErrors.push({ instancePath, message: `must NOT have fewer than ${schemaNode.minItems} items` });
    }
    if (typeof schemaNode.maxItems === 'number' && val.length > schemaNode.maxItems) {
      outErrors.push({ instancePath, message: `must NOT have more than ${schemaNode.maxItems} items` });
    }
    if (schemaNode.uniqueItems === true) {
      const seen = new Set();
      for (const item of val) {
        const key = typeof item === 'object' ? JSON.stringify(item) : String(item);
        if (seen.has(key)) {
          outErrors.push({ instancePath, message: 'must NOT have duplicate items' });
          break;
        }
        seen.add(key);
      }
    }
    if (schemaNode.items && typeof schemaNode.items === 'object') {
      for (let i = 0; i < val.length; i += 1) {
        validateNodeAgainstSchema(val[i], schemaNode.items, rootSchema, `${instancePath}/${i}`, outErrors);
      }
    }
  }

  if (val && typeof val === 'object' && !Array.isArray(val)) {
    const keys = Object.keys(val);
    if (typeof schemaNode.minProperties === 'number' && keys.length < schemaNode.minProperties) {
      outErrors.push({ instancePath, message: `must NOT have fewer than ${schemaNode.minProperties} properties` });
    }
    const props = schemaNode.properties && typeof schemaNode.properties === 'object' ? schemaNode.properties : {};
    if (Array.isArray(schemaNode.required)) {
      for (const reqKey of schemaNode.required) {
        if (!Object.prototype.hasOwnProperty.call(val, reqKey) || val[reqKey] === undefined) {
          outErrors.push({ instancePath, message: `must have required property '${reqKey}'` });
        }
      }
    }
    if (schemaNode.additionalProperties === false) {
      for (const key of keys) {
        if (!Object.prototype.hasOwnProperty.call(props, key)) {
          outErrors.push({ instancePath, message: `must NOT have additional properties ('${key}')` });
        }
      }
    } else if (schemaNode.additionalProperties && typeof schemaNode.additionalProperties === 'object') {
      for (const key of keys) {
        if (!Object.prototype.hasOwnProperty.call(props, key)) {
          validateNodeAgainstSchema(val[key], schemaNode.additionalProperties, rootSchema, `${instancePath}/${key}`, outErrors);
        }
      }
    }
    for (const [propKey, propSchema] of Object.entries(props)) {
      if (Object.prototype.hasOwnProperty.call(val, propKey) && val[propKey] !== undefined) {
        validateNodeAgainstSchema(val[propKey], propSchema, rootSchema, `${instancePath}/${propKey}`, outErrors);
      }
    }
  }
}

export function compileSchemaValidator(rootSchema) {
  const validate = (data) => {
    const collected = [];
    validateNodeAgainstSchema(data, rootSchema, rootSchema, '', collected);
    validate.errors = collected;
    return collected.length === 0;
  };
  validate.errors = [];
  return validate;
}

export function validateKnowledgeAndRecipeCatalogs(rootDir = DEFAULT_ROOT) {
  const errors = [];
  const warnings = [];

  const sourcesSchemaPath = path.join(rootDir, 'schemas/knowledge-source-registry.schema.json');
  const knowledgeSchemaPath = path.join(rootDir, 'schemas/knowledge-record.schema.json');
  const recipeSchemaPath = path.join(rootDir, 'schemas/recipe-record.schema.json');

  const sourcesPath = path.join(rootDir, 'registry/knowledge-sources.json');
  const knowledgePath = path.join(rootDir, 'registry/knowledge-catalog.json');
  const recipesPath = path.join(rootDir, 'registry/recipe-catalog.json');
  const skillsPath = path.join(rootDir, 'registry/skills.json');

  for (const p of [sourcesSchemaPath, knowledgeSchemaPath, recipeSchemaPath, sourcesPath, knowledgePath, recipesPath, skillsPath]) {
    if (!fs.existsSync(p)) {
      errors.push(`Missing required file: ${path.relative(rootDir, p)}`);
    }
  }
  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  const validateSources = compileSchemaValidator(readJson(sourcesSchemaPath));
  const validateKnowledge = compileSchemaValidator(readJson(knowledgeSchemaPath));
  const validateRecipes = compileSchemaValidator(readJson(recipeSchemaPath));

  const sourcesData = readJson(sourcesPath);
  const knowledgeData = readJson(knowledgePath);
  const recipesData = readJson(recipesPath);
  const skillsData = readJson(skillsPath);

  if (!validateSources(sourcesData)) {
    for (const err of validateSources.errors || []) {
      errors.push(`registry/knowledge-sources.json ${err.instancePath}: ${err.message}`);
    }
  }
  if (!validateKnowledge(knowledgeData)) {
    for (const err of validateKnowledge.errors || []) {
      errors.push(`registry/knowledge-catalog.json ${err.instancePath}: ${err.message}`);
    }
  }
  if (!validateRecipes(recipesData)) {
    for (const err of validateRecipes.errors || []) {
      errors.push(`registry/recipe-catalog.json ${err.instancePath}: ${err.message}`);
    }
  }

  const sourceIds = new Set();
  for (const src of sourcesData.sources || []) {
    if (sourceIds.has(src.id)) {
      errors.push(`Duplicate source ID: ${src.id}`);
    }
    sourceIds.add(src.id);
  }

  const skillIds = new Set((skillsData.skills || []).map((s) => s.id));
  const knowledgeIds = new Set();
  const domainCounts = new Map(REQUIRED_DOMAINS.map((d) => [d, 0]));

  for (const rec of knowledgeData.records || []) {
    if (knowledgeIds.has(rec.id)) {
      errors.push(`Duplicate knowledge ID: ${rec.id}`);
    }
    knowledgeIds.add(rec.id);
    domainCounts.set(rec.domain, (domainCounts.get(rec.domain) || 0) + 1);
  }

  for (const domain of REQUIRED_DOMAINS) {
    const count = domainCounts.get(domain) || 0;
    if (count < 2) {
      errors.push(`Domain "${domain}" has ${count} knowledge records; at least 2 are required.`);
    }
  }

  const recipeIds = new Set();
  for (const rec of recipesData.recipes || []) {
    if (recipeIds.has(rec.id)) {
      errors.push(`Duplicate recipe ID: ${rec.id}`);
    }
    recipeIds.add(rec.id);
  }

  for (const reqRecipeId of REQUIRED_RECIPE_IDS) {
    if (!recipeIds.has(reqRecipeId)) {
      errors.push(`Missing required canonical recipe ID: ${reqRecipeId}`);
    }
  }

  const placeholderRegex = /\b(TODO|TBD|FIXME|lorem ipsum)\b/i;

  // Cross-reference validation for knowledge records
  for (const rec of knowledgeData.records || []) {
    if (placeholderRegex.test(JSON.stringify(rec))) {
      errors.push(`Knowledge record ${rec.id} contains placeholder text (TODO/TBD/FIXME).`);
    }
    if (rec.evidence_status === 'runtime-tested') {
      errors.push(`Knowledge record ${rec.id} claims runtime-tested without verified runtime execution evidence.`);
    }
    for (const sr of rec.source_refs || []) {
      if (!sourceIds.has(sr.source_id)) {
        errors.push(`Knowledge record ${rec.id} references unknown source_id "${sr.source_id}".`);
      }
    }
    for (const claim of rec.claims || []) {
      for (const sr of claim.source_refs || []) {
        if (!sourceIds.has(sr.source_id)) {
          errors.push(`Knowledge record ${rec.id} claim ${claim.id} references unknown source_id "${sr.source_id}".`);
        }
      }
    }
    for (const kid of rec.related_ids?.knowledge_ids || []) {
      if (!knowledgeIds.has(kid)) {
        errors.push(`Knowledge record ${rec.id} references unknown related knowledge_id "${kid}".`);
      }
      if (kid === rec.id) {
        errors.push(`Knowledge record ${rec.id} self-references "${kid}" in related_ids.knowledge_ids.`);
      }
    }
    for (const sid of rec.related_ids?.skill_ids || []) {
      if (!skillIds.has(sid)) {
        errors.push(`Knowledge record ${rec.id} references unknown skill_id "${sid}".`);
      }
    }
    for (const rid of rec.related_ids?.recipe_ids || []) {
      if (!recipeIds.has(rid)) {
        errors.push(`Knowledge record ${rec.id} references unknown recipe_id "${rid}".`);
      }
    }
    for (const refPath of rec.promoted_from_skill_refs || []) {
      const fullPath = path.join(rootDir, refPath);
      if (fs.existsSync(path.join(rootDir, 'skills')) && !fs.existsSync(fullPath)) {
        errors.push(`Knowledge record ${rec.id} promoted_from_skill_refs path does not exist: ${refPath}`);
      }
    }
  }

  // Cross-reference validation for recipes
  for (const recipe of recipesData.recipes || []) {
    if (placeholderRegex.test(JSON.stringify(recipe))) {
      errors.push(`Recipe ${recipe.id} contains placeholder text (TODO/TBD/FIXME).`);
    }
    if (recipe.evidence_status === 'runtime-tested') {
      errors.push(`Recipe ${recipe.id} claims runtime-tested without verified runtime execution evidence.`);
    }
    for (const sid of [...(recipe.required_skill_ids || []), ...(recipe.optional_skills || [])]) {
      if (!skillIds.has(sid)) {
        errors.push(`Recipe ${recipe.id} references unknown skill_id "${sid}".`);
      }
    }
    for (const kid of recipe.required_knowledge_ids || []) {
      if (!knowledgeIds.has(kid)) {
        errors.push(`Recipe ${recipe.id} references unknown knowledge_id "${kid}" in required_knowledge_ids.`);
      }
    }
    for (const stage of recipe.stages || []) {
      for (const sid of stage.skill_ids || []) {
        if (!skillIds.has(sid)) {
          errors.push(`Recipe ${recipe.id} stage ${stage.id} references unknown skill_id "${sid}".`);
        }
      }
      for (const kid of stage.knowledge_ids || []) {
        if (!knowledgeIds.has(kid)) {
          errors.push(`Recipe ${recipe.id} stage ${stage.id} references unknown knowledge_id "${kid}".`);
        }
      }
    }
    for (const fm of recipe.failure_modes || []) {
      if (fm.fallback_skill_id && !skillIds.has(fm.fallback_skill_id)) {
        errors.push(`Recipe ${recipe.id} failure_mode references unknown fallback_skill_id "${fm.fallback_skill_id}".`);
      }
    }
    for (const relRec of recipe.related_recipes || []) {
      if (!recipeIds.has(relRec)) {
        errors.push(`Recipe ${recipe.id} references unknown related_recipe "${relRec}".`);
      }
    }
    for (const sr of recipe.source_refs || []) {
      if (!sourceIds.has(sr.source_id)) {
        errors.push(`Recipe ${recipe.id} references unknown source_id "${sr.source_id}".`);
      }
    }
    if (recipe.documentation_path) {
      const fullPath = path.join(rootDir, recipe.documentation_path);
      if (fs.existsSync(path.join(rootDir, 'docs/recipes')) && !fs.existsSync(fullPath)) {
        errors.push(`Recipe ${recipe.id} references missing documentation_path: ${recipe.documentation_path}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    counts: {
      sources: sourceIds.size,
      knowledge_records: knowledgeIds.size,
      recipes: recipeIds.size,
      domains: domainCounts.size,
      skills: skillIds.size
    }
  };
}

export function generateCatalogIndexData(rootDir = DEFAULT_ROOT) {
  const sourcesData = readJson(path.join(rootDir, 'registry/knowledge-sources.json'));
  const knowledgeData = readJson(path.join(rootDir, 'registry/knowledge-catalog.json'));
  const recipesData = readJson(path.join(rootDir, 'registry/recipe-catalog.json'));
  const skillsData = readJson(path.join(rootDir, 'registry/skills.json'));

  const byDomain = {};
  const byKind = {};
  const bySkillId = {};
  const byRecipeId = {};
  const bySourceId = {};
  const byBlenderVersion = {};
  const byEvidenceStatus = {};

  for (const d of REQUIRED_DOMAINS) {
    byDomain[d] = { knowledge_ids: [], recipe_ids: [] };
  }

  const entries = [];

  for (const rec of knowledgeData.records) {
    byDomain[rec.domain] = byDomain[rec.domain] || { knowledge_ids: [], recipe_ids: [] };
    byDomain[rec.domain].knowledge_ids.push(rec.id);

    byKind[rec.kind] = byKind[rec.kind] || [];
    byKind[rec.kind].push(rec.id);

    byEvidenceStatus[rec.evidence_status] = byEvidenceStatus[rec.evidence_status] || [];
    byEvidenceStatus[rec.evidence_status].push(rec.id);

    for (const ver of rec.blender_versions.tested_or_targeted) {
      byBlenderVersion[ver] = byBlenderVersion[ver] || [];
      byBlenderVersion[ver].push(rec.id);
    }

    for (const sid of rec.related_ids.skill_ids) {
      bySkillId[sid] = bySkillId[sid] || { knowledge_ids: [], recipe_ids: [] };
      if (!bySkillId[sid].knowledge_ids.includes(rec.id)) {
        bySkillId[sid].knowledge_ids.push(rec.id);
      }
    }

    for (const rid of rec.related_ids.recipe_ids) {
      byRecipeId[rid] = byRecipeId[rid] || { knowledge_ids: [], skill_ids: [] };
      if (!byRecipeId[rid].knowledge_ids.includes(rec.id)) {
        byRecipeId[rid].knowledge_ids.push(rec.id);
      }
    }

    for (const sr of rec.source_refs) {
      bySourceId[sr.source_id] = bySourceId[sr.source_id] || { knowledge_ids: [], recipe_ids: [] };
      if (!bySourceId[sr.source_id].knowledge_ids.includes(rec.id)) {
        bySourceId[sr.source_id].knowledge_ids.push(rec.id);
      }
    }

    const bodyText = [
      ...(rec.aliases || []),
      ...(rec.intent_signals || []),
      ...(rec.applicability?.when_to_apply || []),
      ...(rec.principles || []),
      ...(rec.implementation_guidance?.workflow_steps || []),
      JSON.stringify(rec.implementation_guidance?.recommended_parameters || {}),
      rec.implementation_guidance?.blender_context || '',
      ...(rec.observable_checks || []).map((c) => `${c.id} ${c.check} ${c.pass_condition}`),
      ...(rec.claims || []).map((c) => c.statement)
    ].join(' ');

    entries.push({
      id: rec.id,
      type: 'knowledge',
      title: rec.title,
      domain: rec.domain,
      kind: rec.kind,
      summary: rec.summary,
      evidence_status: rec.evidence_status,
      blender_minimum: rec.blender_versions.minimum,
      blender_versions: rec.blender_versions.tested_or_targeted,
      skill_ids: rec.related_ids.skill_ids,
      recipe_ids: rec.related_ids.recipe_ids,
      source_ids: rec.source_refs.map((s) => s.source_id),
      tokens: {
        id: tokenize(`${rec.id.replace(/^knowledge\./, '')} ${(rec.aliases || []).join(' ')}`),
        title: tokenize(`${rec.title} ${(rec.intent_signals || []).join(' ')}`),
        domain: tokenize(`${rec.domain} ${rec.kind}`),
        summary: tokenize(rec.summary),
        body: Array.from(new Set(tokenize(bodyText)))
      }
    });
  }

  for (const recipe of recipesData.recipes) {
    const recipeDomains = [recipe.domain];
    for (const d of recipeDomains) {
      byDomain[d] = byDomain[d] || { knowledge_ids: [], recipe_ids: [] };
      if (!byDomain[d].recipe_ids.includes(recipe.id)) {
        byDomain[d].recipe_ids.push(recipe.id);
      }
    }

    byEvidenceStatus[recipe.evidence_status] = byEvidenceStatus[recipe.evidence_status] || [];
    byEvidenceStatus[recipe.evidence_status].push(recipe.id);

    const recipeVersions = Array.from(
      new Set([recipe.blender_versions.minimum, recipe.blender_versions.recommended].filter(Boolean))
    );
    for (const ver of recipeVersions) {
      byBlenderVersion[ver] = byBlenderVersion[ver] || [];
      byBlenderVersion[ver].push(recipe.id);
    }

    const allSkills = Array.from(new Set(recipe.required_skill_ids || []));
    byRecipeId[recipe.id] = byRecipeId[recipe.id] || { knowledge_ids: [], skill_ids: [] };
    byRecipeId[recipe.id].skill_ids = allSkills;
    for (const kid of recipe.required_knowledge_ids || []) {
      if (!byRecipeId[recipe.id].knowledge_ids.includes(kid)) {
        byRecipeId[recipe.id].knowledge_ids.push(kid);
      }
    }

    for (const sid of allSkills) {
      bySkillId[sid] = bySkillId[sid] || { knowledge_ids: [], recipe_ids: [] };
      if (!bySkillId[sid].recipe_ids.includes(recipe.id)) {
        bySkillId[sid].recipe_ids.push(recipe.id);
      }
    }

    for (const sr of recipe.source_refs) {
      bySourceId[sr.source_id] = bySourceId[sr.source_id] || { knowledge_ids: [], recipe_ids: [] };
      if (!bySourceId[sr.source_id].recipe_ids.includes(recipe.id)) {
        bySourceId[sr.source_id].recipe_ids.push(recipe.id);
      }
    }

    const bodyText = [
      recipe.intent,
      ...(recipe.aliases || []),
      ...(recipe.intent_signals || []),
      ...(recipe.applicable_scenarios?.use_when || []),
      ...(recipe.stages || []).map((st) => `${st.title} ${st.objective} ${(st.actions || []).join(' ')}`),
      ...(recipe.failure_modes || []).map((f) => `${f.symptom} ${f.root_cause} ${f.recovery_action}`),
      recipe.documentation_path || ''
    ].join(' ');

    entries.push({
      id: recipe.id,
      type: 'recipe',
      title: recipe.title,
      domain: recipe.domain,
      domains: recipeDomains,
      kind: 'recipe-record',
      summary: recipe.summary,
      evidence_status: recipe.evidence_status,
      blender_minimum: recipe.blender_versions.minimum,
      blender_versions: recipeVersions,
      skill_ids: allSkills,
      knowledge_ids: recipe.required_knowledge_ids,
      source_ids: recipe.source_refs.map((s) => s.source_id),
      tokens: {
        id: tokenize(`${recipe.id.replace(/^recipe\./, '')} ${(recipe.aliases || []).join(' ')}`),
        title: tokenize(`${recipe.title} ${(recipe.intent_signals || []).join(' ')}`),
        domain: tokenize(recipe.domain),
        summary: tokenize(`${recipe.summary} ${recipe.intent}`),
        body: Array.from(new Set(tokenize(bodyText)))
      }
    });
  }

  return {
    schema_version: '1.0.0',
    description: 'Deterministic local lookup and lexical/field-weighted retrieval index for BlendOps knowledge records, recipes, sources, and skills.',
    retrieval_architecture: 'deterministic-lexical-and-field-weighted-index',
    counts: {
      knowledge_records: knowledgeData.records.length,
      recipes: recipesData.recipes.length,
      sources: sourcesData.sources.length,
      domains: REQUIRED_DOMAINS.length,
      skills: skillsData.skills.length
    },
    by_domain: byDomain,
    by_kind: byKind,
    by_skill_id: bySkillId,
    by_recipe_id: byRecipeId,
    by_source_id: bySourceId,
    by_blender_version: byBlenderVersion,
    by_evidence_status: byEvidenceStatus,
    entries
  };
}

export function renderKnowledgeAndRecipeCatalogMarkdown(rootDir = DEFAULT_ROOT) {
  const sourcesData = readJson(path.join(rootDir, 'registry/knowledge-sources.json'));
  const knowledgeData = readJson(path.join(rootDir, 'registry/knowledge-catalog.json'));
  const recipesData = readJson(path.join(rootDir, 'registry/recipe-catalog.json'));

  const lines = [
    '# BlendOps Knowledge & Recipe Catalog',
    '',
    '> Generated deterministically from `registry/knowledge-sources.json`, `registry/knowledge-catalog.json`, and `registry/recipe-catalog.json` via `npm run catalog:build`. Do not edit by hand.',
    '',
    '## Overview & Retrieval CLI',
    '',
    'BlendOps separates **atomic agent workflow skills** (`skills/*/SKILL.md`) from **reusable 3D/Blender domain knowledge** (`knowledge.*`) and **multi-stage construction recipes** (`recipe.*`).',
    '',
    '- **Deterministic Local Search**: `npx blendops catalog-search "<query>" [--type knowledge|recipe] [--domain <domain>]`',
    '- **Deterministic Record Resolution**: `npx blendops catalog-resolve <knowledge.id | recipe.id | source.id>`',
    '- **Catalog Schema & Cross-Reference Validation**: `npx blendops catalog-validate`',
    '',
    '| Metric | Count | Canonical Source |',
    '| :--- | ---: | :--- |',
    `| Knowledge Domains | ${REQUIRED_DOMAINS.length} | \`registry/knowledge-sources.json\` |`,
    `| Canonical Knowledge Records (\`knowledge.*\`) | ${knowledgeData.records.length} | \`registry/knowledge-catalog.json\` |`,
    `| Canonical Recipes (\`recipe.*\`) | ${recipesData.recipes.length} | \`registry/recipe-catalog.json\` |`,
    `| Authoritative Sources (\`source.*\`) | ${sourcesData.sources.length} | \`registry/knowledge-sources.json\` |`,
    '',
    '---',
    '',
    '## 1. Canonical Recipes (`recipe.*`)',
    '',
    '| Recipe ID | Title | Primary Domain | Stages | Required Skills | Linked Knowledge | Min Blender | Evidence Status |',
    '| :--- | :--- | :--- | ---: | ---: | ---: | :--- | :--- |'
  ];

  for (const r of recipesData.recipes) {
    lines.push(
      `| \`${r.id}\` | ${r.title} | \`${r.domain}\` | ${r.stages.length} | ${r.required_skill_ids.length} | ${r.required_knowledge_ids.length} | \`${r.blender_versions.minimum}\` | \`${r.evidence_status}\` |`
    );
  }

  lines.push(
    '',
    '### Recipe Details & Scenario Linkages',
    ''
  );

  for (const r of recipesData.recipes) {
    lines.push(
      `#### \`${r.id}\` — ${r.title}`,
      '',
      `- **Intent**: ${r.intent}`,
      `- **Domain**: \`${r.domain}\``,
      `- **Required Skills**: ${r.required_skill_ids.map((s) => `\`${s}\``).join(', ')}`,
      `- **Knowledge Records**: ${r.required_knowledge_ids.map((k) => `\`${k}\``).join(', ')}`,
      `- **Stages**: ${r.stages.map((st) => `\`${st.id}\` (Stage ${st.stage_number})`).join(' → ')}`
    );
    if (r.documentation_path) {
      lines.push(`- **Scenario Reference Doc**: \`${r.documentation_path}\``);
    }
    lines.push('');
  }

  lines.push(
    '---',
    '',
    '## 2. Canonical Knowledge Records by Domain (`knowledge.*`)',
    ''
  );

  for (const domainId of REQUIRED_DOMAINS) {
    const domRecords = knowledgeData.records.filter((k) => k.domain === domainId);
    lines.push(
      `### Domain: \`${domainId}\` (${domRecords.length} records)`,
      '',
      '| Knowledge ID | Title | Kind | Min Blender | Evidence Status | Linked Skills | Linked Recipes |',
      '| :--- | :--- | :--- | :--- | :--- | :--- | :--- |'
    );
    for (const rec of domRecords) {
      lines.push(
        `| \`${rec.id}\` | ${rec.title} | \`${rec.kind}\` | \`${rec.blender_versions.minimum}\` | \`${rec.evidence_status}\` | ${rec.related_ids.skill_ids.map((s) => `\`${s}\``).join(', ')} | ${rec.related_ids.recipe_ids.map((r) => `\`${r}\``).join(', ')} |`
      );
    }
    lines.push('');
  }

  lines.push(
    '---',
    '',
    '## 3. Authoritative Source Registry (`source.*`)',
    '',
    '| Source ID | Title | Authority | Upstream URL | License / Usage |',
    '| :--- | :--- | :--- | :--- | :--- |'
  );

  for (const src of sourcesData.sources) {
    lines.push(
      `| \`${src.id}\` | ${src.title} | \`${src.authority}\` | \`${src.url}\` | ${src.license_note} |`
    );
  }

  lines.push('');
  return lines.join('\n');
}

export function searchCatalog(rootDir = DEFAULT_ROOT, query = '', options = {}) {
  const indexPath = path.join(rootDir, 'registry/catalog-index.json');
  const indexData = fs.existsSync(indexPath)
    ? readJson(indexPath)
    : generateCatalogIndexData(rootDir);

  const queryTokens = tokenize(query);
  const typeFilter = options.type && options.type !== 'all' ? options.type : null;
  const domainFilter = options.domain || null;
  const kindFilter = options.kind || null;
  const skillFilter = options.skill_id || null;
  const versionFilter = options.blender_version || null;
  const evidenceFilter = options.evidence_status || null;
  const limit = Number(options.limit) > 0 ? Number(options.limit) : 10;

  if (queryTokens.length === 0 && !typeFilter && !domainFilter && !kindFilter && !skillFilter) {
    return {
      query,
      retrieval_method: 'deterministic-lexical-and-field-weighted-index',
      status: 'no_relevant_match',
      coverage_gap: true,
      coverage_gap_reason: 'Empty query and no metadata filters supplied.',
      results: []
    };
  }

  const outOfScopeHits = queryTokens.filter((t) => OUT_OF_SCOPE_TOKENS.has(t));

  const scored = [];
  for (const entry of indexData.entries) {
    if (typeFilter && entry.type !== typeFilter) continue;
    if (domainFilter) {
      const entryDomains = entry.domains || [entry.domain];
      if (!entryDomains.includes(domainFilter)) continue;
    }
    if (kindFilter && entry.kind !== kindFilter) continue;
    if (skillFilter && !(entry.skill_ids || []).includes(skillFilter)) continue;
    if (versionFilter && !(entry.blender_versions || []).includes(versionFilter)) continue;
    if (evidenceFilter && entry.evidence_status !== evidenceFilter) continue;

    if (queryTokens.length === 0) {
      scored.push({
        id: entry.id,
        type: entry.type,
        title: entry.title,
        domain: entry.domain,
        kind: entry.kind,
        summary: entry.summary,
        evidence_status: entry.evidence_status,
        blender_minimum: entry.blender_minimum,
        score: 1.0,
        matched_tokens: [],
        matched_fields: ['filter']
      });
      continue;
    }

    const idSet = new Set(entry.tokens.id);
    const titleSet = new Set(entry.tokens.title);
    const domainSet = new Set(entry.tokens.domain);
    const summarySet = new Set(entry.tokens.summary);
    const bodySet = new Set(entry.tokens.body);

    let score = 0;
    const matchedTokens = [];
    const matchedFields = new Set();

    for (const qToken of queryTokens) {
      let tokenMatched = false;
      if (idSet.has(qToken)) {
        score += 6.0;
        matchedFields.add('id');
        tokenMatched = true;
      }
      if (titleSet.has(qToken)) {
        score += 5.0;
        matchedFields.add('title');
        tokenMatched = true;
      }
      if (domainSet.has(qToken)) {
        score += 3.5;
        matchedFields.add('domain');
        tokenMatched = true;
      }
      if (summarySet.has(qToken)) {
        score += 3.0;
        matchedFields.add('summary');
        tokenMatched = true;
      }
      if (bodySet.has(qToken)) {
        score += 1.5;
        matchedFields.add('body');
        tokenMatched = true;
      }

      if (!tokenMatched) {
        if (qToken.length >= 4) {
          const prefixHitIdOrTitle = [...idSet, ...titleSet].some(
            (t) => t.startsWith(qToken) || qToken.startsWith(t)
          );
          const prefixHitSummaryOrBody = [...summarySet, ...bodySet].some(
            (t) => t.length >= 4 && (t.startsWith(qToken) || qToken.startsWith(t))
          );
          if (prefixHitIdOrTitle) {
            score += 2.5;
            matchedFields.add('title_prefix');
            tokenMatched = true;
          } else if (prefixHitSummaryOrBody) {
            score += 1.0;
            matchedFields.add('body_prefix');
            tokenMatched = true;
          }
        }
      }

      if (tokenMatched) {
        matchedTokens.push(qToken);
      }
    }

    if (matchedTokens.length > 0) {
      const coverageRatio = matchedTokens.length / queryTokens.length;
      score = Number((score * (0.6 + 0.4 * coverageRatio)).toFixed(3));
      scored.push({
        id: entry.id,
        type: entry.type,
        title: entry.title,
        domain: entry.domain,
        kind: entry.kind,
        summary: entry.summary,
        evidence_status: entry.evidence_status,
        blender_minimum: entry.blender_minimum,
        score,
        matched_tokens: matchedTokens,
        matched_fields: Array.from(matchedFields)
      });
    }
  }

  scored.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));

  const topScore = scored[0]?.score || 0;
  const topCoverage = queryTokens.length > 0 ? (scored[0]?.matched_tokens.length || 0) / queryTokens.length : 1;

  if (
    scored.length === 0 ||
    (outOfScopeHits.length >= 2 && topCoverage < 0.35) ||
    (queryTokens.length >= 3 && topScore < 3.0)
  ) {
    return {
      query,
      retrieval_method: 'deterministic-lexical-and-field-weighted-index',
      status: 'no_relevant_match',
      coverage_gap: true,
      coverage_gap_reason:
        outOfScopeHits.length > 0
          ? `Query references out-of-scope DCC/engine tools (${outOfScopeHits.join(', ')}) not covered by BlendOps Blender/glTF catalogs.`
          : 'No knowledge or recipe record met the deterministic relevance threshold.',
      results: []
    };
  }

  return {
    query,
    retrieval_method: 'deterministic-lexical-and-field-weighted-index',
    status: 'matched',
    coverage_gap: false,
    results: scored.slice(0, limit)
  };
}

export function resolveCatalogRecord(rootDir = DEFAULT_ROOT, recordId = '') {
  const sourcesData = readJson(path.join(rootDir, 'registry/knowledge-sources.json'));
  const knowledgeData = readJson(path.join(rootDir, 'registry/knowledge-catalog.json'));
  const recipesData = readJson(path.join(rootDir, 'registry/recipe-catalog.json'));
  const skillsData = readJson(path.join(rootDir, 'registry/skills.json'));

  const sourceMap = new Map(sourcesData.sources.map((s) => [s.id, s]));
  const knowledgeMap = new Map(knowledgeData.records.map((k) => [k.id, k]));
  const recipeMap = new Map(recipesData.recipes.map((r) => [r.id, r]));
  const skillMap = new Map(skillsData.skills.map((s) => [s.id, s]));

  if (knowledgeMap.has(recordId)) {
    const record = knowledgeMap.get(recordId);
    return {
      found: true,
      id: record.id,
      type: 'knowledge',
      record,
      resolved_links: {
        sources: (record.source_refs || []).map((sr) => ({
          ...sr,
          source: sourceMap.get(sr.source_id) || null
        })),
        related_knowledge: (record.related_ids?.knowledge_ids || []).map((id) => {
          const k = knowledgeMap.get(id);
          return k ? { id: k.id, title: k.title, domain: k.domain, kind: k.kind } : { id, missing: true };
        }),
        related_recipes: (record.related_ids?.recipe_ids || []).map((id) => {
          const r = recipeMap.get(id);
          return r ? { id: r.id, title: r.title, domain: r.domain } : { id, missing: true };
        }),
        related_skills: (record.related_ids?.skill_ids || []).map((id) => {
          const s = skillMap.get(id);
          return s
            ? { id: s.id, display_name: s.display_name || s.name, workflow_stage: s.workflow_stage, capability_tier: s.capability_tier }
            : { id, missing: true };
        })
      }
    };
  }

  if (recipeMap.has(recordId)) {
    const record = recipeMap.get(recordId);
    return {
      found: true,
      id: record.id,
      type: 'recipe',
      record,
      resolved_links: {
        sources: (record.source_refs || []).map((sr) => ({
          ...sr,
          source: sourceMap.get(sr.source_id) || null
        })),
        knowledge_records: (record.required_knowledge_ids || []).map((id) => {
          const k = knowledgeMap.get(id);
          return k ? { id: k.id, title: k.title, domain: k.domain, kind: k.kind } : { id, missing: true };
        }),
        required_skills: (record.required_skill_ids || []).map((id) => {
          const s = skillMap.get(id);
          return s
            ? { id: s.id, display_name: s.display_name || s.name, workflow_stage: s.workflow_stage, capability_tier: s.capability_tier }
            : { id, missing: true };
        })
      }
    };
  }

  if (sourceMap.has(recordId)) {
    const record = sourceMap.get(recordId);
    const linkedKnowledge = knowledgeData.records
      .filter((k) => (k.source_refs || []).some((sr) => sr.source_id === recordId))
      .map((k) => ({ id: k.id, title: k.title, domain: k.domain }));
    const linkedRecipes = recipesData.recipes
      .filter((r) => (r.source_refs || []).some((sr) => sr.source_id === recordId))
      .map((r) => ({ id: r.id, title: r.title, category: r.category }));
    return {
      found: true,
      id: record.id,
      type: 'source',
      record,
      resolved_links: {
        knowledge_records: linkedKnowledge,
        recipes: linkedRecipes
      }
    };
  }

  if (skillMap.has(recordId)) {
    const record = skillMap.get(recordId);
    const linkedKnowledge = knowledgeData.records
      .filter((k) => (k.related_ids?.skill_ids || []).includes(recordId))
      .map((k) => ({ id: k.id, title: k.title, domain: k.domain, kind: k.kind }));
    const linkedRecipes = recipesData.recipes
      .filter((r) => (r.required_skill_ids || []).includes(recordId))
      .map((r) => ({ id: r.id, title: r.title, domain: r.domain }));
    return {
      found: true,
      id: record.id,
      type: 'skill',
      record,
      resolved_links: {
        knowledge_records: linkedKnowledge,
        recipes: linkedRecipes
      }
    };
  }

  return {
    found: false,
    id: recordId,
    error: `Unknown catalog ID "${recordId}". Expected knowledge.<slug>, recipe.<slug>, source.<slug>, or a canonical skill ID.`
  };
}

export function runCatalogRetrievalEvals(rootDir = DEFAULT_ROOT) {
  const evalsPath = path.join(rootDir, 'evals/catalog-retrieval-evals.json');
  if (!fs.existsSync(evalsPath)) {
    return {
      passed: false,
      total: 0,
      passed_count: 0,
      failures: [`Missing evaluation suite: ${evalsPath}`]
    };
  }
  const suite = readJson(evalsPath);
  const failures = [];
  let passedCount = 0;

  for (const testCase of suite.cases || []) {
    const response = searchCatalog(rootDir, testCase.query, testCase.filters || {});
    if (testCase.expect_no_match) {
      if (response.status === 'no_relevant_match' && response.coverage_gap === true && response.results.length === 0) {
        passedCount += 1;
      } else {
        failures.push(
          `Case ${testCase.id}: expected no_relevant_match / coverage_gap=true, got status=${response.status} with top result ${response.results[0]?.id || 'none'}`
        );
      }
      continue;
    }

    if (response.status !== 'matched' || response.results.length === 0) {
      failures.push(`Case ${testCase.id}: expected match for "${testCase.query}", got status=${response.status}`);
      continue;
    }

    const topSlice = response.results.slice(0, testCase.max_rank || 3).map((r) => r.id);
    const missingExpected = (testCase.expected_top_ids || []).filter((expId) => !topSlice.includes(expId));
    if (missingExpected.length > 0) {
      failures.push(
        `Case ${testCase.id}: expected [${testCase.expected_top_ids.join(', ')}] within top ${testCase.max_rank || 3}, got [${topSlice.join(', ')}]`
      );
    } else {
      passedCount += 1;
    }
  }

  return {
    passed: failures.length === 0,
    total: (suite.cases || []).length,
    passed_count: passedCount,
    failures
  };
}

export function buildAllCatalogArtifacts(rootDir = DEFAULT_ROOT, options = {}) {
  const validation = validateKnowledgeAndRecipeCatalogs(rootDir);
  if (!validation.valid) {
    throw new Error(`Catalog validation failed:\n- ${validation.errors.join('\n- ')}`);
  }

  const indexData = generateCatalogIndexData(rootDir);
  const catalogMd = renderKnowledgeAndRecipeCatalogMarkdown(rootDir);
  const auditsDir = path.join(rootDir, 'docs/audits');

  if (options.checkOnly) {
    const indexPath = path.join(rootDir, 'registry/catalog-index.json');
    const docPath = path.join(rootDir, 'docs/knowledge-and-recipe-catalog.md');
    const expectedIndex = JSON.stringify(indexData, null, 2) + '\n';
    const actualIndex = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf8') : '';
    const expectedDoc = catalogMd;
    const actualDoc = fs.existsSync(docPath) ? fs.readFileSync(docPath, 'utf8') : '';
    let auditInSync = true;
    if (fs.existsSync(auditsDir)) {
      const auditData = buildSkillArchitectureAuditData(rootDir);
      const expectedAuditJson = JSON.stringify(auditData, null, 2) + '\n';
      const actualAuditJson = fs.existsSync(path.join(auditsDir, 'skill-architecture-audit.json'))
        ? fs.readFileSync(path.join(auditsDir, 'skill-architecture-audit.json'), 'utf8')
        : '';
      const expectedAuditMd = renderSkillArchitectureAuditMarkdown(auditData);
      const actualAuditMd = fs.existsSync(path.join(auditsDir, 'skill-architecture-audit.md'))
        ? fs.readFileSync(path.join(auditsDir, 'skill-architecture-audit.md'), 'utf8')
        : '';
      auditInSync = actualAuditJson === expectedAuditJson && actualAuditMd === expectedAuditMd;
    }
    return {
      ok: actualIndex === expectedIndex && actualDoc === expectedDoc && auditInSync,
      validation,
      index_entries: indexData.entries.length
    };
  }

  writeJsonStable(path.join(rootDir, 'registry/catalog-index.json'), indexData);
  fs.writeFileSync(path.join(rootDir, 'docs/knowledge-and-recipe-catalog.md'), catalogMd, 'utf8');

  // If in full repo checkout where docs/audits exists, also build the skill architecture audit artifacts
  if (fs.existsSync(auditsDir)) {
    const auditData = buildSkillArchitectureAuditData(rootDir);
    writeJsonStable(path.join(auditsDir, 'skill-architecture-audit.json'), auditData);
    const auditMd = renderSkillArchitectureAuditMarkdown(auditData);
    fs.writeFileSync(path.join(auditsDir, 'skill-architecture-audit.md'), auditMd, 'utf8');
  }

  return {
    ok: true,
    validation,
    index_entries: indexData.entries.length
  };
}

function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || '--build';

  if (mode === '--build') {
    const result = buildAllCatalogArtifacts(DEFAULT_ROOT);
    const evalResult = fs.existsSync(path.join(DEFAULT_ROOT, 'evals/catalog-retrieval-evals.json'))
      ? runCatalogRetrievalEvals(DEFAULT_ROOT)
      : { passed: true, total: 0, passed_count: 0, failures: [] };
    if (!evalResult.passed) {
      console.error('Catalog retrieval evals failed:', evalResult.failures);
      process.exit(1);
    }
    console.log(
      `Built knowledge & recipe catalog artifacts (${result.validation.counts.knowledge_records} knowledge records, ${result.validation.counts.recipes} recipes, ${result.validation.counts.sources} sources; ${evalResult.passed_count}/${evalResult.total} retrieval evals passed).`
    );
    return;
  }

  if (mode === '--check' || mode === '--validate') {
    const validation = validateKnowledgeAndRecipeCatalogs(DEFAULT_ROOT);
    if (!validation.valid) {
      console.error('Catalog validation errors:\n- ' + validation.errors.join('\n- '));
      process.exit(1);
    }
    const indexPath = path.join(DEFAULT_ROOT, 'registry/catalog-index.json');
    const docPath = path.join(DEFAULT_ROOT, 'docs/knowledge-and-recipe-catalog.md');
    if (!fs.existsSync(indexPath) || !fs.existsSync(docPath)) {
      console.error('Missing generated catalog artifacts (registry/catalog-index.json or docs/knowledge-and-recipe-catalog.md).');
      process.exit(1);
    }
    const expectedIndex = JSON.stringify(generateCatalogIndexData(DEFAULT_ROOT), null, 2) + '\n';
    const actualIndex = fs.readFileSync(indexPath, 'utf8');
    if (actualIndex !== expectedIndex) {
      console.error('registry/catalog-index.json is out of sync. Run `npm run catalog:build`.');
      process.exit(1);
    }
    const expectedDoc = renderKnowledgeAndRecipeCatalogMarkdown(DEFAULT_ROOT);
    const actualDoc = fs.readFileSync(docPath, 'utf8');
    if (actualDoc !== expectedDoc) {
      console.error('docs/knowledge-and-recipe-catalog.md is out of sync. Run `npm run catalog:build`.');
      process.exit(1);
    }
    if (fs.existsSync(path.join(DEFAULT_ROOT, 'evals/catalog-retrieval-evals.json'))) {
      const evalResult = runCatalogRetrievalEvals(DEFAULT_ROOT);
      if (!evalResult.passed) {
        console.error('Catalog retrieval eval failures:\n- ' + evalResult.failures.join('\n- '));
        process.exit(1);
      }
    }
    console.log(
      `Catalog check passed (${validation.counts.knowledge_records} knowledge records, ${validation.counts.recipes} recipes, ${validation.counts.sources} sources).`
    );
    return;
  }

  if (mode === '--eval') {
    const evalResult = runCatalogRetrievalEvals(DEFAULT_ROOT);
    if (!evalResult.passed) {
      console.error(JSON.stringify(evalResult, null, 2));
      process.exit(1);
    }
    console.log(JSON.stringify(evalResult, null, 2));
    return;
  }

  if (mode === '--search') {
    const query = args.slice(1).join(' ');
    console.log(JSON.stringify(searchCatalog(DEFAULT_ROOT, query), null, 2));
    return;
  }

  if (mode === '--resolve') {
    const id = args[1] || '';
    const res = resolveCatalogRecord(DEFAULT_ROOT, id);
    console.log(JSON.stringify(res, null, 2));
    if (!res.found) process.exit(1);
    return;
  }

  console.error(`Unknown option: ${mode}`);
  process.exit(1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  main();
}
