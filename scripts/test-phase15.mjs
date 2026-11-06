#!/usr/bin/env node
/**
 * BlendOps — Phase 15 (Phase 14.1 Hardening + Phase 2A/2B/2C Agent Consumption, SceneSpec & Skill Harmonizer) Test Suite
 *
 * Covers:
 * 1. Phase 14.1 Hardening:
 *    - Reconciled Skill Architecture Audit (48 skills, 151 reference files, 8 needs_semantic_review).
 *    - Real JSON Schema Draft 2020-12 (Ajv2020) enforcement and negative schema rejection tests.
 *    - Evidence-state promotion/demotion gate (`evaluateEvidencePromotionGate`).
 *    - Source authority tier taxonomy + Blender/glTF version applicability across all 30 knowledge records and 10 recipes.
 *    - Bilingual (Vietnamese + English) query normalization & 90-case retrieval evaluation suite (`evals/catalog-retrieval-evals.json`).
 * 2. Phase 2A Shared Catalog Distribution & Project-Local Consumption:
 *    - Deterministic `dist/shared-catalog/blendops-knowledge-and-recipes.zip` generation (zero `SKILL.md` files).
 *    - Project-local `.blendops/catalog/*` installation, manifest SHA-256 tracking, and `--rollback` cleanup.
 *    - `--target claude-desktop --out <dir>` includes `shared-catalog/blendops-knowledge-and-recipes.zip`.
 *    - Standalone `catalog-search --project <dir>`, `catalog-resolve --project <dir>`, and `catalog-validate --project <dir>`.
 * 3. Phase 2B SceneSpec Schema & Fixture Validation:
 *    - `schemas/scene-spec.schema.json` and `schemas/execution-plan.schema.json` compile under Ajv 2020-12.
 *    - All 8 valid fixtures pass `validateSceneSpec()`; `invalid-missing-required-fields.scene-spec.json` fails closed.
 * 4. Phase 2C Skill Harmonizer & Deterministic Conflict Resolution:
 *    - All 8 valid fixtures compile into schema-valid `ExecutionPlan`s (`status: "ready"` or `"ready_with_warnings"`) with 7 canonical stages, recipe decomposition, parameter decisions, stage gates, required evidence packets, and `Not Run` / `Not Produced` truth states.
 *    - All 3 conflicting fixtures compile into `status: "blocked"` plans with exact blocking `conflict_id`s, 8-level precedence citations, knowledge IDs, and remediation steps.
 * 5. Section 5 CLI Integration:
 *    - `blendops scene-spec-validate`, `blendops plan-compile`, and `blendops plan-inspect` (human + `--json`, exit code 2 on blocked plans).
 */

import { describe, test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { unzipSync } from 'fflate';
import Ajv2020 from 'ajv/dist/2020.js';

import {
  validateKnowledgeAndRecipeCatalogs,
  evaluateEvidencePromotionGate,
  foldVietnameseDiacritics,
  detectQueryLanguage,
  tokenize,
  searchCatalog,
  resolveCatalogRecord,
  runCatalogRetrievalEvals,
  generateSkillArchitectureAuditData,
} from './build-knowledge-catalog.mjs';

import {
  exportSharedCatalogArchive,
} from './export-claude-skills.mjs';

import {
  PRECEDENCE_HIERARCHY,
  resolveCatalogPaths,
  validateSceneSpec,
  compileExecutionPlan,
  inspectExecutionPlan,
} from './compile-scene-plan.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const BIN_BLENDOPS = path.join(ROOT, 'bin', 'blendops.mjs');
const INSTALL_SCRIPT = path.join(ROOT, 'scripts', 'install-skills.mjs');

describe('Phase 15 — Phase 14.1 Hardening + Phase 2 (Agent Consumption, SceneSpec & Skill Harmonizer)', () => {
  let tmpRoot;

  before(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'blendops-phase15-'));
  });

  after(() => {
    if (tmpRoot && fs.existsSync(tmpRoot)) {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    }
  });

  test('1. Phase 14.1 Hardening — Reconciled Skill Architecture Audit, honest classification, Ajv2020 validation, evidence gate, provenance, and 90-case bilingual retrieval', () => {
    // 1.1 Reconciled Skill Architecture Audit counts & honest classification metadata
    const audit = generateSkillArchitectureAuditData(ROOT);
    assert.equal(audit.summary.total_skills_audited, 48);
    assert.equal(audit.summary.total_skill_references_classified, 151);
    assert.equal(audit.summary.reference_classification_breakdown.outdated_or_duplicated, 0);
    assert.equal(audit.summary.needs_semantic_review_count, 8);
    assert.equal(audit.classification_methodology.needs_semantic_review_count, 8);
    assert.equal(audit.classification_methodology.methods_breakdown.knowledge_promotion_mapping, 37);
    assert.equal(audit.classification_methodology.methods_breakdown.rule_based_governance_and_recipe_mapping, 48);
    assert.equal(audit.classification_methodology.methods_breakdown.human_semantic_review, 0);
    assert.equal(audit.classification_methodology.methods_breakdown.rule_based_path_and_heading_inspection, 66);

    const needsReviewRefs = audit.reference_classifications.filter(
      (r) => r.review_status === 'needs_semantic_review',
    );
    assert.equal(needsReviewRefs.length, 8, 'Expected 8 cross-skill adjacent reference files flagged needs_semantic_review');

    // 1.2 Source authority tiers and Blender/glTF version applicability
    const sourcesDoc = JSON.parse(fs.readFileSync(path.join(ROOT, 'registry', 'knowledge-sources.json'), 'utf8'));
    const knowledgeDoc = JSON.parse(fs.readFileSync(path.join(ROOT, 'registry', 'knowledge-catalog.json'), 'utf8'));
    const recipesDoc = JSON.parse(fs.readFileSync(path.join(ROOT, 'registry', 'recipe-catalog.json'), 'utf8'));

    assert.equal(sourcesDoc.sources.length, 20);
    for (const src of sourcesDoc.sources) {
      assert.ok(src.authority, `Missing authority on ${src.id}`);
      assert.ok(src.verification_status, `Missing verification_status on ${src.id}`);
      assert.ok(src.claim_verification_scope, `Missing claim_verification_scope on ${src.id}`);
    }

    assert.equal(sourcesDoc.taxonomy.versionBaseline.gltf_specification_version, '2.0.1');
    assert.equal(knowledgeDoc.records.length, 30);
    for (const rec of knowledgeDoc.records) {
      assert.ok(rec.blender_versions, `Missing blender_versions on ${rec.id}`);
      assert.equal(rec.blender_versions.doc_checked_version, '5.2.3 LTS');
      assert.equal(rec.blender_versions.runtime_tested_version, null);
      assert.notEqual(rec.evidence_status, 'runtime-tested', `Record ${rec.id} must not claim runtime-tested without live evidence`);
    }

    assert.equal(recipesDoc.recipes.length, 10);
    for (const rec of recipesDoc.recipes) {
      assert.ok(rec.blender_versions, `Missing blender_versions on ${rec.id}`);
      assert.equal(rec.blender_versions.doc_checked_version, '5.2.3 LTS');
      assert.equal(rec.expected_outputs.truth_state_defaults.runtime_status, 'Not Run');
      assert.equal(rec.expected_outputs.truth_state_defaults.artifact_status, 'Not Produced');
    }

    // 1.3 Evidence-state promotion/demotion gate
    const blockedGate = evaluateEvidencePromotionGate(
      {
        id: 'knowledge.principled-bsdf-v2-energy-conserving-pbr',
        evidence_status: 'runtime-tested',
        evidence_packet_path: 'docs/evals/blender-connector-read-only-smoke-test.md',
        blender_versions: {
          introduced_in: '4.0',
          verified_range: '4.0 - 5.1+',
          runtime_tested_version: '5.1.0',
          breaking_change_notes: 'Principled BSDF v2 introduced in 4.0',
        },
      },
      ROOT,
    );
    assert.equal(blockedGate.allowed, false);
    assert.ok(blockedGate.errors.length > 0);

    // 1.4 Bilingual normalization & 90-case retrieval benchmark
    assert.equal(foldVietnameseDiacritics('giày thể thao ánh sáng đèn chiếu'), 'giay the thao anh sang den chieu');
    assert.equal(detectQueryLanguage('giày thể thao ánh sáng'), 'vi');
    assert.equal(detectQueryLanguage('giày thể thao Blender glTF'), 'mixed_vi_en');
    const expanded = tokenize('giày sneaker ánh sáng ba điểm');
    assert.ok(expanded.includes('sneaker') || expanded.includes('product'));
    assert.ok(expanded.includes('three') && expanded.includes('lighting'));

    const viSearch = searchCatalog(ROOT, 'giày sneaker cyberpunk ánh sáng studio');
    assert.ok(viSearch.results.some((r) => r.id === 'recipe.product-hero-scene'));

    const evalRes = runCatalogRetrievalEvals(ROOT);
    assert.equal(evalRes.passed, true, `Expected 90/90 retrieval evals to pass, failures: ${evalRes.failures.join('; ')}`);
    assert.equal(evalRes.total, 90);
    assert.equal(evalRes.passed_count, 90);
  });

  test('2. Phase 2A — Shared Catalog Distribution (ZIP export, project-local .blendops/catalog/* install & rollback, and standalone --project CLI queries)', () => {
    // 2.1 Verify exportSharedCatalogArchive builds shared-catalog/blendops-knowledge-and-recipes.zip with zero SKILL.md files
    const sharedOutDir = path.join(tmpRoot, 'shared-catalog-out');
    const sharedExportRes = exportSharedCatalogArchive(ROOT, sharedOutDir);
    assert.ok(sharedExportRes, 'Expected exportSharedCatalogArchive to return result');

    const sharedZipPath = path.join(sharedOutDir, 'blendops-knowledge-and-recipes.zip');
    const sharedManifestPath = path.join(sharedOutDir, 'manifest.json');
    const sharedReadmePath = path.join(sharedOutDir, 'README.md');
    assert.ok(fs.existsSync(sharedZipPath), 'Expected shared-catalog/blendops-knowledge-and-recipes.zip');
    assert.ok(fs.existsSync(sharedManifestPath), 'Expected shared-catalog/manifest.json');
    assert.ok(fs.existsSync(sharedReadmePath), 'Expected shared-catalog/README.md');

    const sharedManifest = JSON.parse(fs.readFileSync(sharedManifestPath, 'utf8'));
    assert.equal(sharedManifest.counts.knowledge_records, 30);
    assert.equal(sharedManifest.counts.recipes, 10);
    assert.equal(sharedManifest.counts.sources, 20);
    assert.equal(sharedManifest.truth_state_defaults.runtime_status, 'Not Run');
    assert.equal(sharedManifest.truth_state_defaults.artifact_status, 'Not Produced');

    const unzippedShared = unzipSync(new Uint8Array(fs.readFileSync(sharedZipPath)));
    const entryNames = Object.keys(unzippedShared);
    assert.equal(
      entryNames.some((k) => k.endsWith('SKILL.md')),
      false,
      'Shared catalog archive must contain zero SKILL.md files so it is never confused with a Claude Skill upload ZIP',
    );
    for (const expectedEntry of [
      'blendops-knowledge-and-recipes/README.md',
      'blendops-knowledge-and-recipes/manifest.json',
      'blendops-knowledge-and-recipes/knowledge-sources.json',
      'blendops-knowledge-and-recipes/knowledge-catalog.json',
      'blendops-knowledge-and-recipes/recipe-catalog.json',
      'blendops-knowledge-and-recipes/catalog-index.json',
      'blendops-knowledge-and-recipes/skills-summary.json',
      'blendops-knowledge-and-recipes/schemas/scene-spec.schema.json',
      'blendops-knowledge-and-recipes/schemas/execution-plan.schema.json',
    ]) {
      assert.ok(unzippedShared[expectedEntry], `Missing ${expectedEntry} in blendops-knowledge-and-recipes.zip`);
    }

    // 2.2 Project-local install writes .blendops/catalog/*, tracks hashes in install-manifest.json, and supports standalone --project queries
    const projDir = path.join(tmpRoot, 'consumer-proj');
    const planDir = path.join(tmpRoot, 'plans');
    fs.mkdirSync(projDir, { recursive: true });
    const env = { ...process.env, BLENDOPS_INSTALLER_PLAN_DIR: planDir };

    execFileSync(
      process.execPath,
      [BIN_BLENDOPS, 'install', '--target', 'generic-project', '--project', projDir, '--dry-run'],
      { cwd: ROOT, env, stdio: ['ignore', 'pipe', 'pipe'] },
    );
    execFileSync(
      process.execPath,
      [BIN_BLENDOPS, 'install', '--target', 'generic-project', '--project', projDir, '--write'],
      { cwd: ROOT, env, stdio: ['ignore', 'pipe', 'pipe'] },
    );

    for (const relCatFile of [
      '.blendops/catalog/manifest.json',
      '.blendops/catalog/knowledge-sources.json',
      '.blendops/catalog/knowledge-catalog.json',
      '.blendops/catalog/recipe-catalog.json',
      '.blendops/catalog/catalog-index.json',
      '.blendops/catalog/skills-summary.json',
      '.blendops/catalog/schemas/knowledge-source-registry.schema.json',
      '.blendops/catalog/schemas/knowledge-record.schema.json',
      '.blendops/catalog/schemas/recipe-record.schema.json',
      '.blendops/catalog/schemas/scene-spec.schema.json',
      '.blendops/catalog/schemas/execution-plan.schema.json',
    ]) {
      assert.ok(fs.existsSync(path.join(projDir, relCatFile)), `Expected installed catalog file ${relCatFile}`);
    }

    const installManifest = JSON.parse(
      fs.readFileSync(path.join(projDir, '.blendops', 'install-manifest.json'), 'utf8'),
    );
    assert.ok(installManifest.files_created.includes('.blendops/catalog/knowledge-catalog.json'));
    assert.ok(installManifest.files_created.includes('.blendops/catalog/recipe-catalog.json'));
    assert.ok(installManifest.files_created.includes('.blendops/catalog/schemas/scene-spec.schema.json'));
    assert.ok(installManifest.created_file_hashes['.blendops/catalog/knowledge-catalog.json']);

    // Run catalog-search, catalog-resolve, and catalog-validate from an unrelated directory using --project projDir
    const unrelatedCwd = path.join(tmpRoot, 'unrelated-cwd');
    fs.mkdirSync(unrelatedCwd, { recursive: true });

    const searchJsonRaw = execFileSync(
      process.execPath,
      [BIN_BLENDOPS, 'catalog-search', 'cyberpunk shoe hero', '--project', projDir, '--json'],
      { cwd: unrelatedCwd, encoding: 'utf8' },
    );
    const searchJson = JSON.parse(searchJsonRaw);
    assert.equal(searchJson.coverage_gap, false);
    assert.equal(searchJson.results[0].id, 'recipe.product-hero-scene');

    const resolveJsonRaw = execFileSync(
      process.execPath,
      [BIN_BLENDOPS, 'catalog-resolve', 'knowledge.agx-filmic-color-management-and-cycles-eevee', '--project', projDir, '--json'],
      { cwd: unrelatedCwd, encoding: 'utf8' },
    );
    const resolveJson = JSON.parse(resolveJsonRaw);
    assert.equal(resolveJson.type, 'knowledge');
    assert.equal(resolveJson.record.id, 'knowledge.agx-filmic-color-management-and-cycles-eevee');

    const validateJsonRaw = execFileSync(
      process.execPath,
      [BIN_BLENDOPS, 'catalog-validate', '--project', projDir, '--json'],
      { cwd: unrelatedCwd, encoding: 'utf8' },
    );
    const validateJson = JSON.parse(validateJsonRaw);
    assert.equal(validateJson.valid, true);
    assert.equal(validateJson.counts.knowledge_records, 30);
    assert.equal(validateJson.counts.recipes, 10);

    // Also test standalone compilation against --project projDir
    const specPath = path.join(ROOT, 'evals', 'scene-specs', 'product-hero-sneaker.scene-spec.json');
    const standalonePlan = compileExecutionPlan(specPath, { repoRoot: unrelatedCwd, projectDir: projDir });
    assert.equal(standalonePlan.ok, true);
    assert.equal(standalonePlan.catalog_source_mode, 'project-local');
    assert.equal(standalonePlan.plan.status, 'ready');

    // 2.3 Rollback removes .blendops/catalog/* cleanly
    execFileSync(
      process.execPath,
      [BIN_BLENDOPS, 'rollback', '--project', projDir],
      { cwd: unrelatedCwd, env, stdio: ['ignore', 'pipe', 'pipe'] },
    );
    assert.equal(fs.existsSync(path.join(projDir, '.blendops', 'catalog')), false);
    assert.equal(fs.existsSync(path.join(projDir, 'BLENDOPS.md')), false);

    // 2.4 Claude Desktop target install includes shared-catalog/blendops-knowledge-and-recipes.zip
    const cdOutDir = path.join(tmpRoot, 'claude-desktop-out');
    execFileSync(
      process.execPath,
      [BIN_BLENDOPS, 'install', '--target', 'claude-desktop', '--out', cdOutDir, '--dry-run'],
      { cwd: ROOT, env, stdio: ['ignore', 'pipe', 'pipe'] },
    );
    execFileSync(
      process.execPath,
      [BIN_BLENDOPS, 'install', '--target', 'claude-desktop', '--out', cdOutDir, '--write'],
      { cwd: ROOT, env, stdio: ['ignore', 'pipe', 'pipe'] },
    );
    assert.ok(fs.existsSync(path.join(cdOutDir, 'shared-catalog', 'blendops-knowledge-and-recipes.zip')));
    assert.ok(fs.existsSync(path.join(cdOutDir, 'shared-catalog', 'manifest.json')));
  });

  test('3. Phase 2B — SceneSpec & ExecutionPlan JSON Schema Draft 2020-12 validation across valid and invalid fixtures', () => {
    const ajv = new Ajv2020({ allErrors: true, strict: false });
    const sceneSpecSchema = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'schemas', 'scene-spec.schema.json'), 'utf8'),
    );
    const execPlanSchema = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'schemas', 'execution-plan.schema.json'), 'utf8'),
    );
    assert.doesNotThrow(() => ajv.compile(sceneSpecSchema));
    assert.doesNotThrow(() => ajv.compile(execPlanSchema));

    const validFixtures = [
      'product-hero-sneaker.scene-spec.json',
      'hard-surface-mech-prop.scene-spec.json',
      'mobile-web-glb-compression.scene-spec.json',
      'procedural-gn-foliage-generator.scene-spec.json',
      'rigged-character-turntable.scene-spec.json',
      'scanned-mesh-cleanup-audit.scene-spec.json',
      'stylized-environment-diorama.scene-spec.json',
      'vietnamese-product-studio-glb.scene-spec.json',
    ];

    for (const file of validFixtures) {
      const specPath = path.join(ROOT, 'evals', 'scene-specs', file);
      const res = validateSceneSpec(specPath, { repoRoot: ROOT });
      assert.equal(res.valid, true, `Expected ${file} to pass validateSceneSpec, got: ${res.errors.join('; ')}`);
    }

    const invalidSpecPath = path.join(
      ROOT,
      'evals',
      'scene-specs',
      'invalid-missing-required-fields.scene-spec.json',
    );
    const invalidRes = validateSceneSpec(invalidSpecPath, { repoRoot: ROOT });
    assert.equal(invalidRes.valid, false, 'Expected invalid-missing-required-fields.scene-spec.json to fail validation');
    assert.ok(invalidRes.errors.length >= 2);
  });

  test('4. Phase 2C — Skill Harmonizer & Deterministic Plan Compiler (8 valid plans + 3 conflicting blocked plans)', () => {
    assert.equal(PRECEDENCE_HIERARCHY.length, 8);
    assert.equal(PRECEDENCE_HIERARCHY[0].layer_id, 'layer_1_hard_laws_and_safety');
    assert.equal(PRECEDENCE_HIERARCHY[7].layer_id, 'layer_8_aesthetic_fallbacks');

    // 4.1 All 8 valid fixtures compile into ready / ready_with_warnings ExecutionPlans with 7 canonical stages
    const expectedValidMappings = [
      { file: 'product-hero-sneaker.scene-spec.json', recipe: 'recipe.product-hero-scene', expectedStatus: 'ready' },
      { file: 'hard-surface-mech-prop.scene-spec.json', recipe: 'recipe.hard-surface-prop', expectedStatus: 'ready' },
      { file: 'mobile-web-glb-compression.scene-spec.json', recipe: 'recipe.web-ready-asset-optimization', expectedStatus: 'ready' },
      { file: 'procedural-gn-foliage-generator.scene-spec.json', recipe: 'recipe.procedural-geometry-nodes-asset', expectedStatus: 'ready' },
      { file: 'rigged-character-turntable.scene-spec.json', recipe: 'recipe.rigged-and-animated-asset', expectedStatus: 'ready' },
      { file: 'scanned-mesh-cleanup-audit.scene-spec.json', recipe: 'recipe.scene-quality-inspection-and-correction', expectedStatus: 'ready_with_warnings' },
      { file: 'stylized-environment-diorama.scene-spec.json', recipe: 'recipe.stylized-environment-scene', expectedStatus: 'ready' },
      { file: 'vietnamese-product-studio-glb.scene-spec.json', recipe: 'recipe.product-hero-scene', expectedStatus: 'ready' },
    ];

    for (const { file, recipe, expectedStatus } of expectedValidMappings) {
      const specPath = path.join(ROOT, 'evals', 'scene-specs', file);
      const compiled = compileExecutionPlan(specPath, { repoRoot: ROOT });
      assert.equal(compiled.ok, true, `Expected ${file} compilation ok=true`);
      const plan = compiled.plan;
      assert.equal(plan.status, expectedStatus, `Expected ${file} status=${expectedStatus}, got ${plan.status}`);
      assert.equal(plan.can_proceed_to_runtime, true);
      assert.equal(plan.recipe_resolution.primary_recipe_id, recipe);
      assert.equal(plan.stages.length, 7);
      assert.deepEqual(
        plan.stages.map((s) => s.stage_id),
        ['discover', 'define', 'plan', 'source', 'execute', 'verify', 'deliver'],
      );
      assert.ok(plan.parameter_decisions.length >= 4);
      assert.ok(plan.stage_gates.length >= 4);
      assert.ok(plan.required_evidence_packets.length >= 2);
      assert.equal(plan.truth_states.runtime_status, 'Not Run');
      assert.equal(plan.truth_states.artifact_status, 'Not Produced');

      const inspected = inspectExecutionPlan(plan, { repoRoot: ROOT });
      assert.equal(inspected.valid, true, `Expected compiled plan for ${file} to validate against execution-plan.schema.json`);
      assert.equal(inspected.plan.conflict_summary.blocking_count, 0);
    }

    // 4.2 All 3 conflict fixtures produce status="blocked" with exact conflict_ids and precedence layers
    const conflictCases = [
      {
        file: 'conflict-udim-vs-standard-glb.scene-spec.json',
        expectedConflictIds: ['conflict.udim-vs-standard-glb'],
        expectedWinningLayer: 'layer_2_target_delivery_format_and_spec',
      },
      {
        file: 'conflict-volumetric-fog-glb-only.scene-spec.json',
        expectedConflictIds: ['conflict.volumetric-fog-glb-only'],
        expectedWinningLayer: 'layer_2_target_delivery_format_and_spec',
      },
      {
        file: 'conflict-unapplied-negative-scale-rig.scene-spec.json',
        expectedConflictIds: [
          'conflict.unapplied-or-negative-scale-export',
          'conflict.bone-influences-exceed-gltf-limit',
          'conflict.apply-modifiers-with-shape-keys',
        ],
        expectedWinningLayer: 'layer_1_hard_laws_and_safety',
      },
    ];

    for (const { file, expectedConflictIds, expectedWinningLayer } of conflictCases) {
      const specPath = path.join(ROOT, 'evals', 'scene-specs', file);
      const compiled = compileExecutionPlan(specPath, { repoRoot: ROOT });
      assert.equal(compiled.ok, true);
      const plan = compiled.plan;
      assert.ok(plan, `Expected compiled blocked plan object for ${file}`);
      assert.equal(plan.status, 'blocked');
      assert.equal(plan.can_proceed_to_runtime, false);
      assert.equal(plan.truth_states.runtime_status, 'Not Run');
      assert.equal(plan.truth_states.artifact_status, 'Not Produced');

      const blockingIds = plan.conflicts
        .filter((c) => c.severity === 'blocking')
        .map((c) => c.conflict_id);
      for (const expectedId of expectedConflictIds) {
        assert.ok(
          blockingIds.includes(expectedId),
          `Expected blocking conflict ${expectedId} in ${file}, got ${blockingIds.join(', ')}`,
        );
      }
      const firstConflict = plan.conflicts.find((c) => c.conflict_id === expectedConflictIds[0]);
      assert.equal(firstConflict.winning_layer_id, expectedWinningLayer);
      assert.ok(firstConflict.knowledge_refs.length >= 1);
      assert.ok(firstConflict.remediation.length >= 20);

      const inspected = inspectExecutionPlan(plan, { repoRoot: ROOT });
      assert.equal(inspected.valid, true, `Blocked plan for ${file} must still conform to execution-plan.schema.json`);
      assert.ok(inspected.plan.conflict_summary.blocking_count >= 1);
    }
  });

  test('5. Section 5 — CLI Integration (scene-spec-validate, plan-compile, plan-inspect in human and --json modes)', () => {
    const validSpecPath = path.join(ROOT, 'evals', 'scene-specs', 'product-hero-sneaker.scene-spec.json');
    const conflictSpecPath = path.join(ROOT, 'evals', 'scene-specs', 'conflict-udim-vs-standard-glb.scene-spec.json');
    const outReadyPlanPath = path.join(tmpRoot, 'product-hero-sneaker.plan.json');
    const outBlockedPlanPath = path.join(tmpRoot, 'conflict-udim.plan.json');

    // 5.1 scene-spec-validate --json
    const valJsonRaw = execFileSync(
      process.execPath,
      [BIN_BLENDOPS, 'scene-spec-validate', validSpecPath, '--json'],
      { cwd: ROOT, encoding: 'utf8' },
    );
    const valJson = JSON.parse(valJsonRaw);
    assert.equal(valJson.valid, true);
    assert.equal(valJson.spec_id, 'scene-spec.product-hero-sneaker');
    assert.equal(valJson.runtime_status, 'Not Run');
    assert.equal(valJson.artifact_status, 'Not Produced');

    // 5.2 plan-compile on valid spec writes plan file and exits 0
    const compileHumanOut = execFileSync(
      process.execPath,
      [BIN_BLENDOPS, 'plan-compile', validSpecPath, '--out', outReadyPlanPath],
      { cwd: ROOT, encoding: 'utf8' },
    );
    assert.match(compileHumanOut, /Status: ready/);
    assert.match(compileHumanOut, /Primary Recipe: recipe\.product-hero-scene/);
    assert.match(compileHumanOut, /Runtime status: Not Run/);
    assert.match(compileHumanOut, /Artifact status: Not Produced/);
    assert.ok(fs.existsSync(outReadyPlanPath));

    // 5.3 plan-inspect on ready plan
    const inspectJsonRaw = execFileSync(
      process.execPath,
      [BIN_BLENDOPS, 'plan-inspect', outReadyPlanPath, '--json'],
      { cwd: ROOT, encoding: 'utf8' },
    );
    const inspectJson = JSON.parse(inspectJsonRaw);
    assert.equal(inspectJson.valid, true);
    assert.equal(inspectJson.plan.status, 'ready');
    assert.equal(inspectJson.plan.stages.length, 7);

    // 5.4 plan-compile on conflicting spec exits with code 2 and still writes blocked plan to --out
    const blockedRun = spawnSync(
      process.execPath,
      [INSTALL_SCRIPT, 'plan-compile', conflictSpecPath, '--out', outBlockedPlanPath, '--json'],
      { cwd: ROOT, encoding: 'utf8' },
    );
    assert.equal(blockedRun.status, 2, 'Expected exit code 2 when blocking conflicts are detected');
    assert.ok(fs.existsSync(outBlockedPlanPath), 'Expected blocked plan JSON to be written to --out');
    const blockedPlan = JSON.parse(fs.readFileSync(outBlockedPlanPath, 'utf8'));
    assert.equal(blockedPlan.status, 'blocked');
    assert.ok(blockedPlan.conflicts.some((c) => c.conflict_id === 'conflict.udim-vs-standard-glb'));
  });
});
