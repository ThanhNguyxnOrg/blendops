#!/usr/bin/env node
/**
 * BlendOps — Phase 14 (Phase 0 + Phase 1: Architecture Reconciliation & Knowledge/Recipe Foundation) Test Suite
 *
 * Covers:
 * 1. JSON Schema Draft 2020-12 validation of `registry/knowledge-sources.json` (20 sources),
 *    `registry/knowledge-catalog.json` (30 records across 11 domains, >= 2 per domain),
 *    and `registry/recipe-catalog.json` (10 canonical recipes), plus negative schema tests.
 * 2. Five-layer architecture reconciliation & 48-skill / 151-reference audit
 *    (`docs/audits/skill-architecture-audit.json` & `docs/audits/skill-architecture-audit.md`).
 * 3. Upgrade of existing recipe architecture without creating a competing system
 *    (`skills/recipe-fit-assessor/references/recipe-catalog.md`,
 *     `skills/blender-recipe-decomposer/references/recipe-grouping-rules.md`,
 *     `docs/recipes/cyberpunk-shoe-hero.md`, `packs/product-hero-v0/PACK.md`).
 * 4. Deterministic catalog index (`registry/catalog-index.json`), retrieval accuracy across
 *    all 32 evaluation cases (`evals/catalog-retrieval-evals.json`), disambiguation, and
 *    out-of-scope coverage-gap detection (`expect_no_match: true`).
 * 5. Distributable CLI subcommands (`blendops catalog-search`, `catalog-resolve`,
 *    `catalog-validate`, `catalog-eval`) and project-local bundle guidance.
 * 6. Evidence & truth-state separation (`Not Run` / `Not Produced` defaults; no unbacked
 *    `runtime-tested` claims without an `evidence_packet_path` under `docs/evals/`).
 */

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';

import {
  REQUIRED_DOMAINS,
  REQUIRED_RECIPE_IDS,
  validateKnowledgeAndRecipeCatalogs,
  generateSkillArchitectureAuditData,
  generateCatalogIndexData,
  searchCatalog,
  resolveCatalogRecord,
  runCatalogRetrievalEvals,
  buildAllCatalogArtifacts,
} from './build-knowledge-catalog.mjs';
import { runCatalogCliSubcommand } from './install-skills.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

describe('Phase 14 — Architecture Reconciliation & Knowledge/Recipe Foundation (Phase 0 + Phase 1)', () => {
  test('Scenario 1: Knowledge source registry, 30 knowledge records across 11 domains, and 10 recipes pass strict schema & cross-reference validation (including negative tests)', () => {
    const validation = validateKnowledgeAndRecipeCatalogs(ROOT);
    assert.equal(
      validation.valid,
      true,
      `Expected catalog validation to pass with 0 errors, got:\n${validation.errors.join('\n')}`,
    );
    assert.equal(validation.counts.domains, 11);
    assert.equal(validation.counts.skills, 48);
    assert.ok(validation.counts.sources >= 18, `Expected >= 18 sources, got ${validation.counts.sources}`);
    assert.equal(validation.counts.knowledge_records, 30);
    assert.equal(validation.counts.recipes, 10);

    const knowledgeCatalog = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'registry/knowledge-catalog.json'), 'utf8'),
    );
    const domainCounts = new Map(REQUIRED_DOMAINS.map((d) => [d, 0]));
    for (const rec of knowledgeCatalog.records) {
      assert.ok(domainCounts.has(rec.domain), `Unknown domain ${rec.domain} on ${rec.id}`);
      domainCounts.set(rec.domain, domainCounts.get(rec.domain) + 1);
      // Verify evidence separation: no record may claim runtime-tested without an existing evidence_packet_path
      if (rec.evidence_status === 'runtime-tested') {
        assert.ok(rec.evidence_packet_path, `${rec.id} claims runtime-tested without evidence_packet_path`);
        assert.ok(
          fs.existsSync(path.join(ROOT, rec.evidence_packet_path)),
          `Missing evidence file ${rec.evidence_packet_path} for ${rec.id}`,
        );
      }
    }
    for (const [domain, count] of domainCounts.entries()) {
      assert.ok(count >= 2, `Domain "${domain}" must have at least 2 knowledge records, got ${count}`);
    }

    // Negative schema test: record claiming runtime-tested without evidence_packet_path is rejected by JSON Schema
    const ajv = new Ajv2020({ allErrors: true, strict: false });
    const knowledgeSchema = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'schemas/knowledge-record.schema.json'), 'utf8'),
    );
    const validateKnowledge = ajv.compile(knowledgeSchema);
    const invalidRecord = structuredClone(knowledgeCatalog.records[0]);
    invalidRecord.evidence_status = 'runtime-tested';
    delete invalidRecord.evidence_packet_path;
    const validInvalid = validateKnowledge({
      $schema: '../schemas/knowledge-record.schema.json',
      schemaVersion: '1.0.0',
      records: [invalidRecord, ...knowledgeCatalog.records.slice(1)],
    });
    assert.equal(
      validInvalid,
      false,
      'Schema must reject knowledgeRecord with evidence_status="runtime-tested" when evidence_packet_path is omitted',
    );
  });

  test('Scenario 2: 5-layer architecture reconciliation and 48-skill + 151-reference classification audit are complete and deterministic', () => {
    const auditData = generateSkillArchitectureAuditData(ROOT);
    assert.equal(auditData.five_layer_architecture.skill_layer.skill_count, 48);
    assert.equal(auditData.five_layer_architecture.knowledge_layer.domain_count, 11);
    assert.equal(auditData.five_layer_architecture.knowledge_layer.knowledge_record_count, 30);
    assert.equal(auditData.five_layer_architecture.recipe_layer.recipe_count, 10);
    assert.equal(auditData.five_layer_architecture.runtime_production_layer.status, 'external-boundary-only');
    assert.equal(
      auditData.five_layer_architecture.evaluation_and_evidence_layer.runtime_execution_truth_state,
      'Not Run',
    );
    assert.equal(
      auditData.five_layer_architecture.evaluation_and_evidence_layer.artifact_production_truth_state,
      'Not Produced',
    );

    assert.equal(auditData.summary.total_skills_audited, 48);
    assert.equal(auditData.summary.total_skill_references_classified, 151);

    const sumClassifications = Object.values(
      auditData.summary.reference_classification_breakdown,
    ).reduce((acc, n) => acc + n, 0);
    assert.equal(sumClassifications, 151, 'All 151 skill reference files must be classified');
    assert.ok(
      auditData.summary.reference_classification_breakdown.reusable_cross_skill_knowledge >= 30,
      'Expected >= 30 reusable cross-skill reference files promoted to knowledge records',
    );
    assert.equal(
      auditData.summary.reference_classification_breakdown.recipe_specific_procedure,
      6,
      'Expected 6 recipe-specific reference files synchronized with registry/recipe-catalog.json',
    );

    const checkRes = buildAllCatalogArtifacts(ROOT, { checkOnly: true });
    assert.equal(checkRes.ok, true, 'Generated catalog and skill-architecture-audit artifacts must be in sync');
  });

  test('Scenario 3: Existing recipe architecture is upgraded in place without duplicate or competing truth sources', () => {
    const recipeCatalog = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'registry/recipe-catalog.json'), 'utf8'),
    );
    const recipeIds = recipeCatalog.recipes.map((r) => r.id);
    for (const reqId of REQUIRED_RECIPE_IDS) {
      assert.ok(recipeIds.includes(reqId), `Missing required canonical recipe ${reqId}`);
    }

    const heroRecipe = recipeCatalog.recipes.find((r) => r.id === 'recipe.product-hero-scene');
    assert.ok(heroRecipe);
    assert.equal(heroRecipe.documentation_path, 'docs/recipes/cyberpunk-shoe-hero.md');
    assert.equal(heroRecipe.expected_outputs.truth_state_defaults.runtime_status, 'Not Run');
    assert.equal(heroRecipe.expected_outputs.truth_state_defaults.artifact_status, 'Not Produced');

    // Verify recipe-fit-assessor and blender-recipe-decomposer references list all 10 canonical recipe.* IDs
    const fitCatalogMd = fs.readFileSync(
      path.join(ROOT, 'skills/recipe-fit-assessor/references/recipe-catalog.md'),
      'utf8',
    );
    const decomposerRulesMd = fs.readFileSync(
      path.join(ROOT, 'skills/blender-recipe-decomposer/references/recipe-grouping-rules.md'),
      'utf8',
    );
    const docsRecipesReadme = fs.readFileSync(path.join(ROOT, 'docs/recipes/README.md'), 'utf8');

    for (const reqId of REQUIRED_RECIPE_IDS) {
      assert.ok(
        fitCatalogMd.includes(reqId),
        `skills/recipe-fit-assessor/references/recipe-catalog.md must include ${reqId}`,
      );
      assert.ok(
        decomposerRulesMd.includes(reqId),
        `skills/blender-recipe-decomposer/references/recipe-grouping-rules.md must include ${reqId}`,
      );
      assert.ok(
        docsRecipesReadme.includes(reqId),
        `docs/recipes/README.md must include ${reqId}`,
      );
    }

    // Verify existing pack and scenario recipe entries are preserved
    assert.ok(fitCatalogMd.includes('product-hero-v0'));
    assert.ok(fitCatalogMd.includes('docs/recipes/cyberpunk-shoe-hero.md'));
    assert.ok(fs.existsSync(path.join(ROOT, 'docs/recipes/cyberpunk-shoe-hero.md')));
    assert.ok(fs.existsSync(path.join(ROOT, 'packs/product-hero-v0/PACK.md')));
  });

  test('Scenario 4: Deterministic catalog index, 32-case retrieval evaluation suite, disambiguation, and coverage-gap detection pass', () => {
    const indexData = generateCatalogIndexData(ROOT);
    assert.equal(indexData.counts.knowledge_records, 30);
    assert.equal(indexData.counts.recipes, 10);
    assert.equal(indexData.entries.length, 40);

    const evalRes = runCatalogRetrievalEvals(ROOT);
    assert.equal(
      evalRes.passed,
      true,
      `Expected all catalog retrieval evals to pass, failures:\n${evalRes.failures.join('\n')}`,
    );
    assert.ok(evalRes.total >= 80, `Expected >= 80 eval cases, got ${evalRes.total}`);
    assert.equal(evalRes.passed_count, evalRes.total);

    // Explicit out-of-scope query must trigger coverage_gap: true rather than returning false-confidence hits
    const outOfScope = searchCatalog(ROOT, 'houdini vex pyro solver solaris USD karma LOPs');
    assert.equal(outOfScope.coverage_gap, true);
    assert.equal(outOfScope.results.length, 0);
    assert.match(outOfScope.coverage_gap_reason, /out-of-scope DCC\/engine tools/);

    // Deterministic resolution of knowledge.*, recipe.*, source.*, and canonical skill ID
    const resolvedKnowledge = resolveCatalogRecord(ROOT, 'knowledge.principled-bsdf-v2-energy-conserving-pbr');
    assert.equal(resolvedKnowledge.found, true);
    assert.equal(resolvedKnowledge.type, 'knowledge');

    const resolvedRecipe = resolveCatalogRecord(ROOT, 'recipe.product-hero-scene');
    assert.equal(resolvedRecipe.found, true);
    assert.equal(resolvedRecipe.type, 'recipe');

    const resolvedSource = resolveCatalogRecord(ROOT, 'source.khronos-gltf-2-spec');
    assert.equal(resolvedSource.found, true);
    assert.equal(resolvedSource.type, 'source');

    const resolvedSkill = resolveCatalogRecord(ROOT, 'glb-web-handoff');
    assert.equal(resolvedSkill.found, true);
    assert.equal(resolvedSkill.type, 'skill');

    const missingRecord = resolveCatalogRecord(ROOT, 'knowledge.non-existent-record');
    assert.equal(missingRecord.found, false);
  });

  test('Scenario 5: CLI subcommands (catalog-search, catalog-resolve, catalog-validate, catalog-eval) work via bin/blendops.mjs and preserve truth states', () => {
    const searchRes = runCatalogCliSubcommand(
      ['catalog-search', '--type', 'recipe', 'product hero studio lighting glb', '--json'],
      { repoRoot: ROOT },
    );
    assert.equal(searchRes.ok, true);
    assert.equal(searchRes.runtimeStatus, 'Not Run');
    assert.equal(searchRes.artifactStatus, 'Not Produced');
    const searchJson = JSON.parse(searchRes.report);
    assert.equal(searchJson.coverage_gap, false);
    assert.equal(searchJson.results[0].id, 'recipe.product-hero-scene');

    const resolveRes = runCatalogCliSubcommand(
      ['catalog-resolve', 'knowledge.agx-filmic-color-management-and-cycles-eevee'],
      { repoRoot: ROOT },
    );
    assert.equal(resolveRes.ok, true);
    assert.match(resolveRes.report, /knowledge\.agx-filmic-color-management-and-cycles-eevee/);
    assert.match(resolveRes.report, /Runtime status: Not Run/);
    assert.match(resolveRes.report, /Artifact status: Not Produced/);

    const validateOut = execFileSync(
      process.execPath,
      [path.join(ROOT, 'bin/blendops.mjs'), 'catalog-validate'],
      { cwd: ROOT, encoding: 'utf8' },
    );
    assert.match(validateOut, /Valid: Yes/);
    assert.match(validateOut, /Knowledge records: 30/);
    assert.match(validateOut, /Recipes: 10/);

    const evalOut = execFileSync(
      process.execPath,
      [path.join(ROOT, 'bin/blendops.mjs'), 'catalog-eval'],
      { cwd: ROOT, encoding: 'utf8' },
    );
    assert.match(evalOut, /Passed: Yes \(90\/90\)/);
  });
});
