#!/usr/bin/env node
/**
 * BlendOps Phase 3.1 (Phase 17) — Independent Adversarial Audit, Cross-Phase Hardening
 * & Production Readiness Verification Suite.
 *
 * Covers all adversarial scenarios from Phase 3.1 Sections 2A–2F, 3.1–3.5, 4, and 5:
 *   - Section 2A: Explicit recipe override integrity & duplicate supporting recipe rejection
 *   - Section 2B: Path-specific Blender version floor enforcement & planning-only vs runtime readiness
 *   - Section 2C: ExecutionPlan cross-layer semantic invariant verification (inspectExecutionPlan)
 *   - Section 2D: Retrieval metric mathematical honesty (dedup, standard vs target Precision@K, empty-result guard)
 *   - Section 2E: Single source of truth for shared catalog map & traceable human review provenance gate
 *   - Section 2F: Safe atomic CLI output path containment & symlink rejection
 *   - Section 3.1: Transport endpoint validation (non-loopback, bad scheme) & stale session detection
 *   - Section 3.2: Indirect bpy/Python/shell injection rejection & L3 escalation prevention
 *   - Section 3.3: Symlinked .blend checkpoint rejection, mutation echo lie detection via independent L0 readback,
 *                  uncertain timeout classification, and rollback_unverified readback detection
 *   - Section 3.4: Idempotency key payload collision rejection vs identical duplicate skipping
 *   - Section 3.5: Deep secret redaction across URLs, query params, JWTs, Basic/Bearer headers, and Error objects
 *   - Section 4: Cross-phase contract compatibility & project-local execution from unrelated working directory
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  validateSceneSpec,
  compileExecutionPlan,
  inspectExecutionPlan,
  validateSafeCliOutFilePath,
  writeFileAtomicallySafe,
  runPlanCliSubcommand,
} from './compile-scene-plan.mjs';

import {
  computeRetrievalMetricsForCase,
  validateHumanReviewProvenance,
  buildSkillArchitectureAuditData,
  buildSharedCatalogFilesMap,
} from './build-knowledge-catalog.mjs';

import {
  redactSensitiveData,
  validateRuntimeTransportEndpoint,
  detectIndirectCodeInjection,
  validateSafeBlendCheckpointPaths,
  createMockMcpRuntime,
  discoverRuntimeSession,
  runExecutionPreflight,
  executeTypedOperationSequence,
  runProductSceneVerticalSlice,
  runRuntimeAndExecutionCliSubcommand,
} from './runtime-orchestrator.mjs';

import { runInstaller } from './install-skills.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

function loadSneakerSceneSpec() {
  return JSON.parse(
    fs.readFileSync(
      path.join(ROOT, 'evals', 'scene-specs', 'product-hero-sneaker.scene-spec.json'),
      'utf8',
    ),
  );
}

describe('Phase 3.1 (Phase 17) — Independent Adversarial Audit & Cross-Phase Hardening', () => {
  let tmpRoot;

  before(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'blendops-phase17-'));
  });

  after(() => {
    if (tmpRoot && fs.existsSync(tmpRoot)) {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    }
  });

  test('1. Section 2A — Explicit recipe override integrity: nonexistent, malformed, or incompatible recipe IDs fail closed in repo and project-local modes', () => {
    const baseSpec = loadSneakerSceneSpec();

    // 1.1 Nonexistent explicit_recipe_override fails validateSceneSpec and compileExecutionPlan
    const badOverrideSpec = structuredClone(baseSpec);
    badOverrideSpec.intent.explicit_recipe_override = 'recipe.nonexistent-shadow-phantom-v99';

    const valRepo = validateSceneSpec(badOverrideSpec, { repoRoot: ROOT });
    assert.equal(valRepo.valid, false, 'Nonexistent explicit_recipe_override must fail validateSceneSpec');
    assert.ok(
      valRepo.errors.some((e) => e.includes('canonical recipe catalog')),
      `Expected canonical catalog error, got: ${valRepo.errors.join('; ')}`,
    );

    const compRepo = compileExecutionPlan(badOverrideSpec, { repoRoot: ROOT });
    assert.equal(compRepo.ok, false, 'Compiler must fail closed on nonexistent explicit_recipe_override');

    // 1.2 Malformed explicit_recipe_override fails schema/pattern check
    const malformedOverrideSpec = structuredClone(baseSpec);
    malformedOverrideSpec.intent.explicit_recipe_override = 'recipe.nonexistent.shadow-phantom.v99';
    const valMalformed = validateSceneSpec(malformedOverrideSpec, { repoRoot: ROOT });
    assert.equal(valMalformed.valid, false, 'Malformed explicit_recipe_override must fail validateSceneSpec');

    // 1.3 Project-local mode enforces identical rule
    const projectDir = path.join(tmpRoot, 'proj-2a');
    fs.mkdirSync(projectDir, { recursive: true });
    runInstaller([
      'install',
      '--dry-run',
      '--target',
      'claude-code',
      '--project',
      projectDir,
    ]);
    runInstaller([
      'install',
      '--write',
      '--target',
      'claude-code',
      '--project',
      projectDir,
    ]);

    const valLocal = validateSceneSpec(badOverrideSpec, { repoRoot: ROOT, projectDir });
    assert.equal(valLocal.valid, false, 'Project-local mode must also reject nonexistent explicit_recipe_override');
    assert.equal(valLocal.catalog_source_mode, 'project-local');

    // 1.4 Valid explicit_recipe_override resolves cleanly and never duplicates supporting recipes
    const validOverrideSpec = structuredClone(baseSpec);
    validOverrideSpec.intent.explicit_recipe_override = 'recipe.product-hero-scene';
    const valGood = validateSceneSpec(validOverrideSpec, { repoRoot: ROOT, projectDir });
    assert.equal(valGood.valid, true, `Expected valid override to pass, got: ${valGood.errors.join('; ')}`);

    const compGood = compileExecutionPlan(validOverrideSpec, { repoRoot: ROOT, projectDir });
    assert.equal(compGood.ok, true);
    assert.equal(
      compGood.plan.recipe_resolution.primary_recipe_id,
      'recipe.product-hero-scene',
    );
    const supportingIds = compGood.plan.recipe_resolution.supporting_recipe_ids;
    assert.equal(
      supportingIds.length,
      new Set(supportingIds).size,
      'Supporting recipes must never contain duplicates',
    );
    assert.ok(
      !supportingIds.includes(compGood.plan.recipe_resolution.primary_recipe_id),
      'Supporting recipes must not repeat the primary recipe ID',
    );
  });

  test('2. Section 2B — Path-specific Blender version floor enforcement & planning-only vs runtime readiness separation', () => {
    const baseSpec = loadSneakerSceneSpec();

    // 2.1 Path 1 with Blender 4.2 target (< 5.1 floor) emits blocking Layer 3 conflict
    const path1OldBlender = structuredClone(baseSpec);
    path1OldBlender.runtime_preference.preferred_path = 'path-1-official-blender-lab-mcp';
    path1OldBlender.blender_version_target = {
      min: '3.6',
      tested_range: '3.6 - 4.2',
      recommended: '4.2',
    };

    const compiledPath1Old = compileExecutionPlan(path1OldBlender, { repoRoot: ROOT });
    assert.equal(compiledPath1Old.ok, true);
    assert.equal(compiledPath1Old.plan.status, 'blocked');
    assert.equal(compiledPath1Old.plan.can_proceed_to_runtime, false);
    assert.ok(
      compiledPath1Old.plan.conflicts.some(
        (c) =>
          c.conflict_id === 'conflict.runtime-path-1-blender-version-floor' &&
          c.severity === 'blocking',
      ),
      'Expected blocking conflict.runtime-path-1-blender-version-floor for Blender 4.2 on Path 1',
    );

    // 2.2 Path 2 with Blender 4.2 target (>= 3.0 floor) succeeds without version-floor block
    const path2Blender42 = structuredClone(path1OldBlender);
    path2Blender42.runtime_preference.preferred_path = 'path-2-community-mcp-for-blender';
    const compiledPath2Ok = compileExecutionPlan(path2Blender42, { repoRoot: ROOT });
    assert.equal(compiledPath2Ok.ok, true);
    assert.notEqual(compiledPath2Ok.plan.status, 'blocked');
    assert.equal(compiledPath2Ok.plan.can_proceed_to_runtime, true);

    // 2.3 Path 2 with Blender 2.93 target (< 3.0 floor) emits blocking Layer 3 conflict
    const path2OldBlender = structuredClone(baseSpec);
    path2OldBlender.runtime_preference.preferred_path = 'path-2-community-mcp-for-blender';
    path2OldBlender.blender_version_target = {
      min: '2.80',
      tested_range: '2.80 - 2.93',
      recommended: '2.93',
    };
    const compiledPath2Old = compileExecutionPlan(path2OldBlender, { repoRoot: ROOT });
    assert.equal(compiledPath2Old.ok, true);
    assert.equal(compiledPath2Old.plan.status, 'blocked');
    assert.equal(compiledPath2Old.plan.can_proceed_to_runtime, false);
    assert.ok(
      compiledPath2Old.plan.conflicts.some(
        (c) =>
          c.conflict_id === 'conflict.runtime-path-2-blender-version-floor' &&
          c.severity === 'blocking',
      ),
    );

    // 2.4 Inverted version range (min > recommended) is rejected by validateSceneSpec
    const invertedVerSpec = structuredClone(baseSpec);
    invertedVerSpec.blender_version_target = {
      min: '5.2',
      tested_range: '5.2 - 5.1',
      recommended: '5.1',
    };
    const invVal = validateSceneSpec(invertedVerSpec, { repoRoot: ROOT });
    assert.equal(invVal.valid, false, 'Inverted version range (min > recommended) must fail validation');

    // 2.5 unconfigured-planning-only is planning-ready (status='ready') but NEVER runtime-executable (can_proceed_to_runtime=false)
    const planningOnlySpec = structuredClone(baseSpec);
    planningOnlySpec.runtime_preference.preferred_path = 'unconfigured-planning-only';
    planningOnlySpec.runtime_preference.allow_cli_fallback = false;
    const compiledPlanningOnly = compileExecutionPlan(planningOnlySpec, { repoRoot: ROOT });
    assert.equal(compiledPlanningOnly.ok, true);
    assert.notEqual(compiledPlanningOnly.plan.status, 'blocked');
    assert.equal(
      compiledPlanningOnly.plan.can_proceed_to_runtime,
      false,
      'Planning-only ExecutionPlan must set can_proceed_to_runtime=false',
    );

    // Passing a planning-only plan to runExecutionPreflight must fail closed even if a healthy mock runtime is attached
    const mockRt = createMockMcpRuntime({ runtimePath: 'path-1-host-a', scenario: 'healthy' });
    const pfPlanningOnly = runExecutionPreflight({
      repoRoot: ROOT,
      executionPlan: compiledPlanningOnly.plan,
      mockRuntime: mockRt,
      operationId: 'op.inspect.blendfile-summary',
    });
    assert.equal(pfPlanningOnly.passed, false, 'Planning-only plan must not proceed to runtime execution');
    assert.equal(pfPlanningOnly.execution_plan_valid, false);
  });

  test('3. Section 2C — ExecutionPlan cross-layer semantic invariant verification (inspectExecutionPlan)', () => {
    const baseSpec = loadSneakerSceneSpec();
    const { plan: validPlan } = compileExecutionPlan(baseSpec, { repoRoot: ROOT });

    const baseInspect = inspectExecutionPlan(validPlan, { repoRoot: ROOT });
    assert.equal(baseInspect.valid, true, `Baseline plan should be valid: ${baseInspect.errors.join('; ')}`);

    // 3.1 Tampered status='ready' while blocking conflict exists
    const tamperedBlocking = structuredClone(validPlan);
    tamperedBlocking.conflicts.push({
      conflict_id: 'conflict.injected.blocking',
      severity: 'blocking',
      rule_id: 'CONFLICT_INJECTED_TEST',
      winning_layer_rank: 2,
      winning_layer_id: 'layer_2_target_delivery_format_and_spec',
      losing_layer_id: 'layer_5_explicit_scene_spec_parameters',
      summary: 'Injected blocking conflict while status remains ready',
      affected_skills: ['glb-web-handoff'],
      knowledge_refs: ['knowledge.glb-binary-chunk-alignment-and-khronos-validation'],
      remediation: 'Fix conflict.',
    });
    tamperedBlocking.conflict_summary.total_count = tamperedBlocking.conflicts.length;
    tamperedBlocking.conflict_summary.blocking_count = 1;
    // Deliberately leave status='ready' and can_proceed_to_runtime=true
    const res1 = inspectExecutionPlan(tamperedBlocking, { repoRoot: ROOT });
    assert.equal(res1.valid, false, 'inspectExecutionPlan must reject ready status when blocking_count > 0');
    assert.ok(res1.errors.some((e) => e.includes('expected status="blocked"')));

    // 3.2 Tampered can_proceed_to_runtime=true on unconfigured-planning-only
    const tamperedPlanningOnly = structuredClone(validPlan);
    tamperedPlanningOnly.runtime_preference.preferred_path = 'unconfigured-planning-only';
    tamperedPlanningOnly.runtime_preference.selected_runtime_skill = 'runtime-setup';
    tamperedPlanningOnly.can_proceed_to_runtime = true;
    const res2 = inspectExecutionPlan(tamperedPlanningOnly, { repoRoot: ROOT });
    assert.equal(res2.valid, false, 'inspectExecutionPlan must reject can_proceed_to_runtime=true on unconfigured-planning-only');

    // 3.3 Tampered unknown primary recipe ID
    const tamperedRecipe = structuredClone(validPlan);
    tamperedRecipe.recipe_resolution.primary_recipe_id = 'recipe.fake-injected-phantom';
    const res3 = inspectExecutionPlan(tamperedRecipe, { repoRoot: ROOT });
    assert.equal(res3.valid, false);
    assert.ok(res3.errors.some((e) => e.includes('Unresolved recipe_resolution.primary_recipe_id')));

    // 3.4 Tampered unknown skill ID
    const tamperedSkill = structuredClone(validPlan);
    tamperedSkill.resolved_skills.push('nonexistent-rogue-skill');
    const res4 = inspectExecutionPlan(tamperedSkill, { repoRoot: ROOT });
    assert.equal(res4.valid, false);
    assert.ok(res4.errors.some((e) => e.includes('Unknown skill ID')));

    // 3.5 Tampered stage sequence order
    const tamperedStages = structuredClone(validPlan);
    const tmpStage = tamperedStages.stages[0];
    tamperedStages.stages[0] = tamperedStages.stages[1];
    tamperedStages.stages[1] = tmpStage;
    const res5 = inspectExecutionPlan(tamperedStages, { repoRoot: ROOT });
    assert.equal(res5.valid, false);
    assert.ok(res5.errors.some((e) => e.includes('stages[0]')));

    // 3.6 Tampered truth states (claiming Verified in static plan)
    const tamperedTruth = structuredClone(validPlan);
    tamperedTruth.truth_states.runtime_status = 'Verified';
    const res6 = inspectExecutionPlan(tamperedTruth, { repoRoot: ROOT });
    assert.equal(res6.valid, false);

    // 3.7 Passing a semantically tampered plan to runExecutionPreflight fails closed
    const mockRt = createMockMcpRuntime({ runtimePath: 'path-1-host-a', scenario: 'healthy' });
    const pfTampered = runExecutionPreflight({
      repoRoot: ROOT,
      executionPlan: tamperedBlocking,
      mockRuntime: mockRt,
    });
    assert.equal(pfTampered.passed, false);
    assert.equal(pfTampered.execution_plan_valid, false);
  });

  test('4. Section 2D — Retrieval metric mathematical honesty: empty results, deduplication, and standard vs target Precision@K', () => {
    // 4.1 Empty results never divide by zero or return NaN
    const emptyMetrics = computeRetrievalMetricsForCase([], ['kb.a', 'kb.b'], 3);
    assert.equal(emptyMetrics.first_rank, 0);
    assert.equal(emptyMetrics.standard_precision_at_k, 0);
    assert.equal(emptyMetrics.target_precision_at_k, 0);
    assert.equal(emptyMetrics.recall_at_k, 0);
    assert.equal(emptyMetrics.reciprocal_rank, 0);
    assert.ok(!Number.isNaN(emptyMetrics.standard_precision_at_k));

    // 4.2 Single expected target matched at rank 1 with k=3:
    // standard_precision_at_k = 1/3 (0.3333), target_precision_at_k = 1/min(3,1) = 1.0
    const singleTargetMetrics = computeRetrievalMetricsForCase(
      [{ id: 'kb.target.1' }, { id: 'kb.other.2' }, { id: 'kb.other.3' }],
      ['kb.target.1'],
      3,
    );
    assert.equal(singleTargetMetrics.first_rank, 1);
    assert.equal(singleTargetMetrics.standard_precision_at_k, Number((1 / 3).toFixed(4)));
    assert.equal(singleTargetMetrics.target_precision_at_k, 1);
    assert.equal(singleTargetMetrics.recall_at_k, 1);

    // 4.3 Short result list (only 1 result returned when 2 targets expected and k=3):
    // Previous bug divided by topSlice.length (1) -> 1/1 = 100%!
    // Fixed target_precision_at_k divides by min(3, 2) = 2 -> 1/2 = 0.5, and standard_precision_at_k = 1/3 = 0.3333
    const shortResultMetrics = computeRetrievalMetricsForCase(
      [{ id: 'kb.target.1' }],
      ['kb.target.1', 'kb.target.2'],
      3,
    );
    assert.equal(shortResultMetrics.standard_precision_at_k, Number((1 / 3).toFixed(4)));
    assert.equal(
      shortResultMetrics.target_precision_at_k,
      0.5,
      'Short result list must never inflate precision to 1.0 by dividing by topSlice.length',
    );
    assert.equal(shortResultMetrics.recall_at_k, 0.5);

    // 4.4 Duplicate IDs in results or expected targets are deduplicated before scoring
    const dupResultMetrics = computeRetrievalMetricsForCase(
      [{ id: 'kb.target.1' }, { id: 'kb.target.1' }, { id: 'kb.target.1' }],
      ['kb.target.1', 'kb.target.2'],
      3,
    );
    assert.equal(
      dupResultMetrics.matched_expected.length,
      1,
      'Duplicate result IDs must not double-count matches',
    );
    assert.equal(dupResultMetrics.duplicate_result_ids_removed, 2);
    assert.equal(dupResultMetrics.recall_at_k, 0.5);
  });

  test('5. Section 2E — Single source of truth for shared catalog map & traceable human review provenance gate', () => {
    // 5.1 Rejects human_semantic_review without provenance metadata
    const unverifiedClaim = validateHumanReviewProvenance({
      classification_method: 'human_semantic_review',
    });
    assert.equal(unverifiedClaim.valid, false);

    const validClaim = validateHumanReviewProvenance({
      classification_method: 'human_semantic_review',
      human_review_evidence: {
        reviewer: 'RealThanhNguyxnn',
        reviewed_at: '2026-11-05T00:00:00Z',
        reviewed_scope: 'skills/camera-composition/references/framing-guides.md',
        review_outcome: 'confirmed_skill_local_framing_reference',
      },
    });
    assert.equal(validClaim.valid, true);

    // 5.2 Audit data has 0 unverified human_semantic_review claims
    const audit = buildSkillArchitectureAuditData(ROOT);
    assert.equal(audit.classification_methodology.methods_breakdown.human_semantic_review, 0);
    assert.equal(
      audit.classification_methodology.methods_breakdown.rule_based_governance_and_recipe_mapping,
      48,
    );

    // 5.3 Shared catalog map has all 20 canonical artifacts including Phase 3 and Phase 3.2 runtime governance files and schemas
    const map = buildSharedCatalogFilesMap(ROOT);
    const mapKeys = Object.keys(map).sort();
    assert.ok(mapKeys.includes('runtime-capability-policy.json'));
    assert.ok(mapKeys.includes('runtime-operations.json'));
    assert.ok(mapKeys.includes('schemas/runtime-session.schema.json'));
    assert.ok(mapKeys.includes('schemas/operation-execution-ledger.schema.json'));
    assert.ok(mapKeys.includes('schemas/runtime-qualification-report.schema.json'));
    assert.equal(mapKeys.length, 20);
  });

  test('6. Section 2F — Safe CLI --out path containment, symlink rejection, and atomic write on plan-compile and execution-report', () => {
    // 6.1 Rejects repo root, .git, skills/*/SKILL.md, laws/*.md, registry/*.json, schemas/*.json
    const forbiddenTargets = [
      ROOT,
      path.join(ROOT, '.git', 'config'),
      path.join(ROOT, 'skills', 'camera-composition', 'SKILL.md'),
      path.join(ROOT, 'laws', 'evidence-before-done.md'),
      path.join(ROOT, 'registry', 'recipe-catalog.json'),
      path.join(ROOT, 'schemas', 'scene-spec.schema.json'),
      path.join(ROOT, 'package.json'),
    ];

    for (const target of forbiddenTargets) {
      const check = validateSafeCliOutFilePath(target, { repoRoot: ROOT });
      assert.equal(
        check.valid,
        false,
        `Expected validateSafeCliOutFilePath to reject protected path: ${target}`,
      );
    }

    // 6.2 Rejects symlink pointing to protected file
    const symlinkOut = path.join(tmpRoot, 'symlink-to-law.json');
    fs.symlinkSync(path.join(ROOT, 'laws', 'evidence-before-done.md'), symlinkOut);
    const symCheck = validateSafeCliOutFilePath(symlinkOut, { repoRoot: ROOT });
    assert.equal(symCheck.valid, false, 'Symlink --out target must be rejected');
    assert.throws(() => {
      writeFileAtomicallySafe(symlinkOut, '{}', { repoRoot: ROOT });
    }, /symbolic link/);

    // 6.3 CLI plan-compile --out and execution-report --out reject protected paths
    const specFile = path.join(
      ROOT,
      'evals',
      'scene-specs',
      'product-hero-sneaker.scene-spec.json',
    );
    const planOutRes = runPlanCliSubcommand(
      ['plan-compile', specFile, '--out', path.join(ROOT, 'registry', 'recipe-catalog.json')],
      { repoRoot: ROOT },
    );
    assert.equal(planOutRes.ok, false);
    assert.equal(planOutRes.exitCode, 1);
    assert.ok(planOutRes.report.includes('protected repository'));

    assert.throws(() => {
      runRuntimeAndExecutionCliSubcommand(
        [
          'execution',
          'report',
          '--spec',
          specFile,
          '--mock-runtime',
          'healthy',
          '--out',
          path.join(ROOT, 'laws', 'evidence-before-done.md'),
        ],
        { repoRoot: ROOT },
      );
    }, /protected repository/);

    // 6.4 Safe output path in tmpRoot writes atomically and leaves no temp file behind
    const safeOut = path.join(tmpRoot, 'safe-output', 'compiled-plan.json');
    const safeRes = runPlanCliSubcommand(['plan-compile', specFile, '--out', safeOut], {
      repoRoot: ROOT,
    });
    assert.equal(safeRes.ok, true);
    assert.equal(fs.existsSync(safeOut), true);
    const dirFiles = fs.readdirSync(path.dirname(safeOut));
    assert.equal(dirFiles.length, 1, 'Atomic write must clean up its .tmp file after rename');
  });

  test('7. Section 3.1 — Runtime session discovery: non-loopback endpoint rejection, bad scheme rejection, stale session detection, and live_runtime_verified honesty', () => {
    // 7.1 Non-loopback endpoint rejected by default
    const remoteCheck = validateRuntimeTransportEndpoint('http://192.168.1.50:9876/mcp');
    assert.equal(remoteCheck.valid, false);
    assert.ok(remoteCheck.reason.includes('Non-loopback'));

    const remoteAllowed = validateRuntimeTransportEndpoint('http://192.168.1.50:9876/mcp', {
      allowRemoteEndpoint: true,
    });
    assert.equal(remoteAllowed.valid, true);

    // 7.2 Unsupported protocol scheme rejected
    const ftpCheck = validateRuntimeTransportEndpoint('ftp://127.0.0.1:9876');
    assert.equal(ftpCheck.valid, false);
    assert.ok(ftpCheck.reason.includes('Unsupported MCP transport protocol'));

    // 7.3 discoverRuntimeSession with remote endpoint in config or options sets connection_status='invalid_endpoint'
    const mockRt = createMockMcpRuntime({ runtimePath: 'path-1-host-a', scenario: 'healthy' });
    const badEndpointSession = discoverRuntimeSession({
      repoRoot: ROOT,
      runtimePath: 'path-1-host-a',
      mockRuntime: mockRt,
      endpoint: 'http://10.0.0.42:9876/mcp',
    });
    assert.equal(badEndpointSession.connection_status, 'invalid_endpoint');
    assert.equal(badEndpointSession.readiness_flags.read_only_available, false);
    assert.equal(badEndpointSession.readiness_flags.live_runtime_verified, false);

    // 7.4 Stale session detection
    const staleMock = createMockMcpRuntime({
      runtimePath: 'path-1-host-a',
      scenario: 'stale_session',
    });
    const staleSession = discoverRuntimeSession({
      repoRoot: ROOT,
      runtimePath: 'path-1-host-a',
      mockRuntime: staleMock,
    });
    assert.equal(staleSession.connection_status, 'stale_session');
    assert.equal(staleSession.readiness_flags.read_only_available, false);
    assert.equal(staleSession.readiness_flags.mutation_available, false);
    assert.equal(staleSession.readiness_flags.live_runtime_verified, false);

    // 7.5 Healthy mock session has live_runtime_verified = false
    const healthySession = discoverRuntimeSession({
      repoRoot: ROOT,
      runtimePath: 'path-1-host-a',
      mockRuntime: mockRt,
    });
    assert.equal(healthySession.connection_status, 'connected');
    assert.equal(
      healthySession.readiness_flags.live_runtime_verified,
      false,
      'Mock runtime session must never set live_runtime_verified=true',
    );
  });

  test('8. Section 3.2 — Typed operation boundary: indirect bpy/Python/shell injection rejection & L3 escalation prevention', () => {
    const mockRt = createMockMcpRuntime({ runtimePath: 'path-1-host-a', scenario: 'healthy' });

    // 8.1 Indirect code injection payloads inside otherwise string-typed operation fields
    const injectionPayloads = [
      { camera_name: "Camera'; import bpy; bpy.ops.wm.read_factory_settings()", location: [0, -2, 1], rotation_euler_deg: [80, 0, 0], focal_length_mm: 50 },
      { camera_name: '__import__("os").system("rm -rf /")', location: [0, -2, 1], rotation_euler_deg: [80, 0, 0], focal_length_mm: 50 },
      { camera_name: 'subprocess.Popen(["sh", "-c", "id"])', location: [0, -2, 1], rotation_euler_deg: [80, 0, 0], focal_length_mm: 50 },
      { camera_name: 'exec(compile("import socket", "<string>", "exec"))', location: [0, -2, 1], rotation_euler_deg: [80, 0, 0], focal_length_mm: 50 },
    ];

    for (const badInput of injectionPayloads) {
      const finding = detectIndirectCodeInjection(badInput);
      assert.ok(finding, `Expected detectIndirectCodeInjection to catch payload: ${JSON.stringify(badInput)}`);

      const pf = runExecutionPreflight({
        repoRoot: ROOT,
        runtimePath: 'path-1-host-a',
        mockRuntime: mockRt,
        operationId: 'op.mutate.camera-transform-and-lens',
        grantedTier: 'L1',
        input: badInput,
      });
      assert.equal(pf.passed, false, 'Preflight must block indirect code injection');
      assert.equal(pf.input_schema_valid, false);
      assert.equal(pf.governed_ceiling_respected, false);
    }

    // 8.2 L3 capability tier escalation is permanently blocked
    const pfL3 = runExecutionPreflight({
      repoRoot: ROOT,
      runtimePath: 'path-1-host-a',
      mockRuntime: mockRt,
      operationId: 'op.inspect.blendfile-summary',
      grantedTier: 'L3',
      input: { include_datablock_counts: true },
    });
    assert.equal(pfL3.passed, false);
    assert.equal(pfL3.governed_ceiling_respected, false);
    assert.equal(pfL3.capability_tier_granted, 'L0');
  });

  test('9. Section 3.3 — Transaction state machine: symlinked .blend checkpoint rejection, mutation echo lie caught by independent L0 readback, uncertain timeout classification, and rollback_unverified detection', () => {
    const spec = loadSneakerSceneSpec();

    // 9.1 Symlinked source .blend file is rejected before any checkpoint or mutation
    const mockSym = createMockMcpRuntime({ runtimePath: 'path-1-host-a', scenario: 'healthy' });
    const symlinkBlend = path.join(tmpRoot, 'symlink-scene.blend');
    fs.symlinkSync(mockSym.blendFilePath, symlinkBlend);

    const pathCheck = validateSafeBlendCheckpointPaths(symlinkBlend);
    assert.equal(pathCheck.valid, false);
    assert.ok(pathCheck.reason.includes('symbolic link'));

    const symExec = executeTypedOperationSequence({
      repoRoot: ROOT,
      sceneSpec: spec,
      runtimePath: 'path-1-host-a',
      mockRuntime: mockSym,
      sourceBlendPath: symlinkBlend,
      grantedTier: 'L1',
      operations: [
        {
          operation_id: 'op.mutate.camera-transform-and-lens',
          skill_id: 'camera-composition',
          input: {
            camera_name: 'Camera',
            location: [0.1, -2.5, 0.5],
            rotation_euler_deg: [80, 0, 0],
            focal_length_mm: 85,
          },
        },
      ],
    });
    assert.equal(symExec.ok, false);
    assert.equal(symExec.ledger.lifecycle_status, 'blocked');
    assert.equal(mockSym.getMutationCallCount(), 0, 'Zero mutations may run when .blend path is a symlink');

    // 9.2 Mutation tool returns status='ok' echoing new values without changing the scene -> caught by independent L0 readback and rolled back
    const mockEchoLie = createMockMcpRuntime({
      runtimePath: 'path-1-host-a',
      scenario: 'mutation_echo_without_scene_change',
    });
    const echoRes = runProductSceneVerticalSlice({
      repoRoot: ROOT,
      runtimePath: 'path-1-host-a',
      mockRuntime: mockEchoLie,
    });
    assert.equal(echoRes.ok, false, 'Echoed mutation response without scene change must fail postcondition readback');
    assert.equal(echoRes.ledger.lifecycle_status, 'rollback_verified');
    const failedStep = echoRes.ledger.operation_attempts.find((a) => a.status === 'failed');
    assert.ok(failedStep, 'Expected a failed mutation step');
    assert.equal(failedStep.failure_classification, 'postcondition_verification_failed');
    assert.equal(failedStep.postcondition_result.verified, false);
    assert.equal(echoRes.ledger.rollback_summary.triggered, true);
    assert.equal(echoRes.ledger.rollback_summary.status, 'rollback_verified');

    // 9.3 Uncertain remote mutation timeout records failure_classification='uncertain_remote_mutation_timeout' and unknown_remote_execution_outcome=true with zero blind retries
    const mockTimeout = createMockMcpRuntime({
      runtimePath: 'path-1-host-a',
      scenario: 'mutation_timeout',
    });
    const timeoutRes = runProductSceneVerticalSlice({
      repoRoot: ROOT,
      runtimePath: 'path-1-host-a',
      mockRuntime: mockTimeout,
    });
    assert.equal(timeoutRes.ok, false);
    assert.equal(mockTimeout.getMutationCallCount(), 1, 'Must never blindly retry a timed-out mutation');
    const attemptedStep = timeoutRes.ledger.operation_attempts.find((a) => a.status === 'attempted');
    assert.ok(attemptedStep);
    assert.equal(attemptedStep.failure_classification, 'uncertain_remote_mutation_timeout');
    assert.equal(attemptedStep.unknown_remote_execution_outcome, true);
    assert.equal(timeoutRes.ledger.rollback_summary.triggered, true);
    assert.equal(timeoutRes.ledger.rollback_summary.status, 'rollback_verified');

    // 9.4 Post-rollback unverified scene readback transitions to rollback_unverified
    const mockUnverifiedRb = createMockMcpRuntime({
      runtimePath: 'path-1-host-a',
      scenario: 'rollback_unverified_readback',
    });
    const unverifiedRbRes = runProductSceneVerticalSlice({
      repoRoot: ROOT,
      runtimePath: 'path-1-host-a',
      mockRuntime: mockUnverifiedRb,
    });
    assert.equal(unverifiedRbRes.ok, false);
    assert.equal(unverifiedRbRes.ledger.lifecycle_status, 'rollback_unverified');
    assert.equal(unverifiedRbRes.ledger.rollback_summary.status, 'rollback_unverified');
    assert.equal(unverifiedRbRes.ledger.rollback_summary.restored_sha256_verified, true);
    assert.equal(unverifiedRbRes.ledger.rollback_summary.scene_readback_verified, false);
  });

  test('10. Section 3.4 — Idempotency key integrity: identical duplicate skipped vs conflicting payload collision rejected', () => {
    const spec = loadSneakerSceneSpec();
    const mockRt = createMockMcpRuntime({ runtimePath: 'path-1-host-a', scenario: 'healthy' });
    const sharedStore = new Map();
    const customIdemKey = 'a1b2c3d4'.repeat(8); // 64-char hex idempotency key

    // 10.1 Identical idempotency key + identical payload -> second call is skipped_duplicate
    const dupRes = executeTypedOperationSequence({
      repoRoot: ROOT,
      sceneSpec: spec,
      runtimePath: 'path-1-host-a',
      mockRuntime: mockRt,
      idempotencyStore: sharedStore,
      grantedTier: 'L1',
      operations: [
        {
          operation_id: 'op.mutate.camera-transform-and-lens',
          skill_id: 'camera-composition',
          idempotency_key: customIdemKey,
          input: {
            camera_name: 'Camera',
            location: [0.15, -2.45, 0.52],
            rotation_euler_deg: [80.5, 0.0, 3.5],
            focal_length_mm: 85,
          },
        },
        {
          operation_id: 'op.mutate.camera-transform-and-lens',
          skill_id: 'camera-composition',
          idempotency_key: customIdemKey,
          input: {
            camera_name: 'Camera',
            location: [0.15, -2.45, 0.52],
            rotation_euler_deg: [80.5, 0.0, 3.5],
            focal_length_mm: 85,
          },
        },
      ],
    });
    assert.equal(dupRes.ok, true);
    assert.equal(dupRes.ledger.operation_attempts[0].status, 'committed');
    assert.equal(dupRes.ledger.operation_attempts[1].status, 'skipped_duplicate');
    assert.equal(mockRt.getMutationCallCount(), 1);

    // 10.2 Reusing the same idempotency_key with a different payload (e.g. focal_length_mm: 35) is rejected as a collision
    const collisionRes = executeTypedOperationSequence({
      repoRoot: ROOT,
      sceneSpec: spec,
      runtimePath: 'path-1-host-a',
      mockRuntime: mockRt,
      idempotencyStore: sharedStore,
      grantedTier: 'L1',
      operations: [
        {
          operation_id: 'op.mutate.camera-transform-and-lens',
          skill_id: 'camera-composition',
          idempotency_key: customIdemKey,
          input: {
            camera_name: 'Camera',
            location: [0.15, -2.45, 0.52],
            rotation_euler_deg: [80.5, 0.0, 3.5],
            focal_length_mm: 35,
          },
        },
      ],
    });
    assert.equal(collisionRes.ok, false);
    assert.equal(collisionRes.ledger.lifecycle_status, 'failed');
    assert.equal(
      collisionRes.ledger.operation_attempts[0].status,
      'rejected_idempotency_collision',
    );
    assert.equal(
      collisionRes.ledger.operation_attempts[0].failure_classification,
      'idempotency_key_payload_collision',
    );
    assert.equal(mockRt.getMutationCallCount(), 1, 'Conflicting idempotency key must not invoke runtime tool');
  });

  test('11. Section 3.5 — Deep secret redaction across URLs, query strings, JWTs, Basic/Bearer headers, and Error messages', () => {
    const rawPayload = {
      camera_name: 'Camera',
      endpoint_with_creds: 'https://admin:superSecretPass999@localhost:9876/mcp?api_key=sk-proj-1234567890abcdef12345&token=tok_live_9876543210abcdef',
      auth_header: 'Basic dXNlcjpwYXNzd29yZDEyMzQ1Ng==',
      jwt_string: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
      inline_assignment: 'connection failed with password = MyUltraSecretPassword2026!',
      nested_error: new Error(
        'Socket error to https://user:topsecret@127.0.0.1:9876/?access_token=ghp_abcdefghijklmnopqrstuvwxyz123456 with Bearer secret_bearer_token_999999',
      ),
    };

    const { redacted, secretsRedacted } = redactSensitiveData(rawPayload);
    assert.equal(secretsRedacted, true);
    const serialized = JSON.stringify(redacted);

    assert.ok(!serialized.includes('superSecretPass999'), 'URL password must be redacted');
    assert.ok(!serialized.includes('sk-proj-1234567890abcdef12345'), 'Query api_key must be redacted');
    assert.ok(!serialized.includes('tok_live_9876543210abcdef'), 'Query token must be redacted');
    assert.ok(!serialized.includes('dXNlcjpwYXNzd29yZDEyMzQ1Ng=='), 'Basic auth token must be redacted');
    assert.ok(!serialized.includes('SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'), 'JWT must be redacted');
    assert.ok(!serialized.includes('MyUltraSecretPassword2026'), 'Inline password assignment must be redacted');
    assert.ok(!serialized.includes('topsecret'), 'Error URL userinfo must be redacted');
    assert.ok(!serialized.includes('ghp_abcdefghijklmnopqrstuvwxyz123456'), 'Error query access_token must be redacted');
    assert.ok(!serialized.includes('secret_bearer_token_999999'), 'Error Bearer token must be redacted');
  });

  test('12. Section 4 — Cross-phase contract compatibility: scene_spec_id preservation & project-local execution from an unrelated working directory', () => {
    const projectDir = path.join(tmpRoot, 'isolated-consumer-project');
    fs.mkdirSync(projectDir, { recursive: true });

    // Install project-local catalog + skills
    runInstaller([
      'install',
      '--dry-run',
      '--target',
      'claude-code',
      '--project',
      projectDir,
    ]);
    const installRes = runInstaller([
      'install',
      '--write',
      '--target',
      'claude-code',
      '--project',
      projectDir,
    ]);
    assert.equal(installRes.globalTouched, false);

    // Copy sneaker SceneSpec into isolated projectDir
    const localSpecPath = path.join(projectDir, 'sneaker.scene-spec.json');
    fs.copyFileSync(
      path.join(ROOT, 'evals', 'scene-specs', 'product-hero-sneaker.scene-spec.json'),
      localSpecPath,
    );

    const prevCwd = process.cwd();
    try {
      process.chdir(projectDir);

      // Run vertical slice in project-local mode from unrelated cwd
      const mockRt = createMockMcpRuntime({ runtimePath: 'path-1-host-a', scenario: 'healthy' });
      const sliceRes = runProductSceneVerticalSlice({
        repoRoot: projectDir,
        projectDir,
        sceneSpecPath: localSpecPath,
        runtimePath: 'path-1-host-a',
        mockRuntime: mockRt,
      });

      assert.equal(sliceRes.ok, true);
      assert.equal(
        sliceRes.ledger.scene_spec_id,
        'scene-spec.product-hero-sneaker',
        'OperationExecutionLedger must preserve SceneSpec.id as scene_spec_id across Phase 2 -> Phase 3 boundary',
      );
      assert.equal(sliceRes.ledger.execution_plan_id, 'plan.product-hero-sneaker');
      assert.equal(sliceRes.ledger.truth_states.runtime_status, 'Attempted');
      assert.equal(sliceRes.ledger.truth_states.artifact_status, 'Not Produced');
      assert.equal(sliceRes.ledger.truth_states.evidence_promotion_allowed, false);
    } finally {
      process.chdir(prevCwd);
    }
  });
});
