import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  ROUTING_PARTICIPANT_IDS,
  loadContextFieldVocabulary,
  validateContractContextFields,
  validateContractObject,
  validatePrecedenceLadder,
  detectProgressionCycles,
  enumerateRoutingStateSpace,
  resolveRoutingWinner,
  renderManagedSections,
  applyManagedSectionsToSkillMd,
  buildRegistryArtifacts,
} from './build-registry.mjs';
import { runDocsCheck } from './check-docs.mjs';
import { runEvalSuites } from './run-evals.mjs';
import {
  generateCurrentAuditArtifacts,
  scanSkillMarkdown,
  resolveAuditedInputFiles,
  computeAuditedInputsDigest,
  AUDITED_INPUTS_MANIFEST_REL,
} from './generate-current-audit.mjs';

const root = process.cwd();
const skillsDir = path.join(root, 'skills');

function listRealCatalogSkills(rootDir = root) {
  const dir = path.join(rootDir, 'skills');
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== '_template')
    .map((d) => d.name)
    .filter((name) => fs.existsSync(path.join(dir, name, 'SKILL.md')))
    .sort();
}

describe('Phase 5 — Full Catalog Contract Coverage & F-03 Resolution (30 Scenarios)', () => {
  const catalogSkillIds = listRealCatalogSkills(root);
  const catalogSkillSet = new Set(catalogSkillIds);
  const { vocab, fieldMap: contextFieldMap, errors: vocabLoadErrors } = loadContextFieldVocabulary(root);

  it('Scenario 1: all 48 real catalog skills have skills/<id>/contract.json on disk and _template is excluded', () => {
    assert.equal(catalogSkillIds.length, 48, 'Expected exactly 48 real catalog skills');
    assert.equal(catalogSkillIds.includes('_template'), false);

    for (const skillId of catalogSkillIds) {
      const contractPath = path.join(skillsDir, skillId, 'contract.json');
      assert.equal(
        fs.existsSync(contractPath),
        true,
        `Missing contract.json for skill '${skillId}'`,
      );
    }
    assert.equal(
      fs.existsSync(path.join(skillsDir, '_template', 'contract.json')),
      false,
      'skills/_template must not contain a real skill contract.json',
    );
  });

  it('Scenario 2: all 48 contract.json files validate cleanly against schemas/skill-contract.schema.json with Ajv2020 strict mode', () => {
    for (const skillId of catalogSkillIds) {
      const raw = fs.readFileSync(path.join(skillsDir, skillId, 'contract.json'), 'utf8');
      const parsed = JSON.parse(raw);
      const errs = validateContractObject(parsed, skillId, catalogSkillSet, undefined, {
        rootDir: root,
        contextFieldMap,
      });
      assert.deepEqual(
        errs,
        [],
        `Expected 0 validation errors for skills/${skillId}/contract.json, got: ${errs.join('; ')}`,
      );
    }
  });

  it('Scenario 3: enforces strict separation between the 4 routing participants and 44 specialist contracts', () => {
    assert.deepEqual(ROUTING_PARTICIPANT_IDS, [
      'blendops-help',
      'recipe-fit-assessor',
      'pack-prerequisite-checker',
      'workflow-stage-router',
    ]);

    let routingCount = 0;
    let specialistCount = 0;
    for (const skillId of catalogSkillIds) {
      const contract = JSON.parse(
        fs.readFileSync(path.join(skillsDir, skillId, 'contract.json'), 'utf8'),
      );
      if (ROUTING_PARTICIPANT_IDS.includes(skillId)) {
        routingCount += 1;
        assert.ok(contract.routingPrecedence, `${skillId} must declare routingPrecedence`);
        assert.equal(contract.category, 'routing-and-governance');
      } else {
        specialistCount += 1;
        assert.equal(
          Object.hasOwn(contract, 'routingPrecedence'),
          false,
          `Specialist skill ${skillId} must not declare routingPrecedence`,
        );
      }
    }
    assert.equal(routingCount, 4);
    assert.equal(specialistCount, 44);
  });

  it('Scenario 4: adding routingPrecedence to a specialist contract fails schema validation and precedence ladder validation', () => {
    const specialist = JSON.parse(
      fs.readFileSync(path.join(skillsDir, 'blender-composition-camera-planner', 'contract.json'), 'utf8'),
    );
    const mutated = {
      ...specialist,
      routingPrecedence: {
        group: 'blendops-entry-and-stage-routing',
        rank: 5,
        activationGate: {
          goalClarity: 'clear',
          recipeSelected: true,
          preflightPassed: true,
          hasStageOrArtifactInventory: true,
        },
        reason: 'Illegal specialist routing precedence injection for negative testing.',
      },
    };
    const errs = validateContractObject(
      mutated,
      'blender-composition-camera-planner',
      catalogSkillSet,
      undefined,
      { rootDir: root, contextFieldMap },
    );
    assert.equal(
      errs.some((e) => e.includes('routingPrecedence')),
      true,
      `Expected routingPrecedence error on specialist contract, got: ${errs.join('; ')}`,
    );

    const ladderErrs = validatePrecedenceLadder([mutated]);
    assert.equal(
      ladderErrs.some((e) => e.includes('Specialist contract') && e.includes('must NOT declare routingPrecedence')),
      true,
    );
  });

  it('Scenario 5: removing routingPrecedence from a routing participant fails schema validation and precedence ladder validation', () => {
    const participant = JSON.parse(
      fs.readFileSync(path.join(skillsDir, 'blendops-help', 'contract.json'), 'utf8'),
    );
    const mutated = { ...participant };
    delete mutated.routingPrecedence;

    const errs = validateContractObject(mutated, 'blendops-help', catalogSkillSet, undefined, {
      rootDir: root,
      contextFieldMap,
    });
    assert.equal(
      errs.some((e) => e.includes('routingPrecedence')),
      true,
      `Expected missing routingPrecedence error on blendops-help, got: ${errs.join('; ')}`,
    );

    const ladderErrs = validatePrecedenceLadder([mutated]);
    assert.equal(
      ladderErrs.some((e) => e.includes("Contract 'blendops-help' is missing a valid routingPrecedence object")),
      true,
    );
  });

  it('Scenario 6: removing a contract.json file from an isolated catalog causes buildRegistryArtifacts to fail', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'blendops-phase5-missing-contract-'));
    try {
      for (const rel of ['schemas', 'registry', 'skills']) {
        fs.cpSync(path.join(root, rel), path.join(tempDir, rel), { recursive: true });
      }
      fs.unlinkSync(path.join(tempDir, 'skills', 'polycount-budget-checker', 'contract.json'));

      const res = buildRegistryArtifacts(tempDir);
      assert.equal(
        res.errors.some((e) =>
          e.includes("Missing contract.json for catalog skill 'polycount-budget-checker'"),
        ),
        true,
        `Expected missing contract error, got: ${res.errors.join('; ')}`,
      );
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('Scenario 7: all 48 contracts declare capabilityTier L0 aligned with runtime-capability-policy.json and reject mismatches', () => {
    const policy = JSON.parse(
      fs.readFileSync(path.join(root, 'registry', 'runtime-capability-policy.json'), 'utf8'),
    );
    const policyMap = new Map(policy.skills.map((s) => [s.skillId, s]));
    assert.equal(policyMap.size, 48);

    for (const skillId of catalogSkillIds) {
      const contract = JSON.parse(
        fs.readFileSync(path.join(skillsDir, skillId, 'contract.json'), 'utf8'),
      );
      assert.equal(contract.capabilityTier, 'L0');
      assert.equal(contract.capabilityTier, policyMap.get(skillId).capabilityTier);
    }

    const sample = JSON.parse(
      fs.readFileSync(path.join(skillsDir, 'blender-lighting-material-planner', 'contract.json'), 'utf8'),
    );
    const escalated = { ...sample, capabilityTier: 'L1' };
    const errs = validateContractObject(
      escalated,
      'blender-lighting-material-planner',
      catalogSkillSet,
      undefined,
      { rootDir: root, contextFieldMap, capabilityPolicyMap: policyMap },
    );
    assert.equal(
      errs.some((e) => e.includes('capabilityTier')),
      true,
      'Mismatched capabilityTier must be rejected',
    );
  });

  it('Scenario 8: all 48 contracts enforce outputs.truthStatePolicy runtimeDefault="Not Run", artifactDefault="Not Produced", and mutationRule="downgrade_only"', () => {
    for (const skillId of catalogSkillIds) {
      const contract = JSON.parse(
        fs.readFileSync(path.join(skillsDir, skillId, 'contract.json'), 'utf8'),
      );
      assert.equal(contract.outputs.truthStatePolicy.runtimeDefault, 'Not Run');
      assert.equal(contract.outputs.truthStatePolicy.artifactDefault, 'Not Produced');
      assert.equal(contract.outputs.truthStatePolicy.mutationRule, 'downgrade_only');
    }

    const sample = JSON.parse(
      fs.readFileSync(path.join(skillsDir, 'render-export-evidence', 'contract.json'), 'utf8'),
    );
    const badTruth = structuredClone(sample);
    badTruth.outputs.truthStatePolicy.artifactDefault = 'Not Run';
    const errs = validateContractObject(
      badTruth,
      'render-export-evidence',
      catalogSkillSet,
      undefined,
      { rootDir: root, contextFieldMap },
    );
    assert.equal(
      errs.some((e) => e.includes('artifactDefault')),
      true,
      'Assigning Not Run to outputs.truthStatePolicy.artifactDefault must fail schema validation',
    );
  });

  it('Scenario 9: all 48 contracts have globally unique roles and 191 unique normalized trigger phrases, and reject duplicates', () => {
    const roles = new Set();
    const triggers = new Set();
    let totalTriggerCount = 0;

    for (const skillId of catalogSkillIds) {
      const contract = JSON.parse(
        fs.readFileSync(path.join(skillsDir, skillId, 'contract.json'), 'utf8'),
      );
      assert.equal(roles.has(contract.role), false, `Duplicate role: ${contract.role}`);
      roles.add(contract.role);

      for (const t of contract.triggers) {
        totalTriggerCount += 1;
        const norm = t.toLowerCase().trim();
        assert.equal(triggers.has(norm), false, `Duplicate trigger phrase: ${t}`);
        triggers.add(norm);
      }
    }

    assert.equal(roles.size, 48);
    assert.equal(totalTriggerCount, 191);
    assert.equal(triggers.size, 191);

    // Intra-contract case-insensitive duplicate trigger must fail
    const sample = JSON.parse(
      fs.readFileSync(path.join(skillsDir, 'material-quality-checker', 'contract.json'), 'utf8'),
    );
    const dupTriggerContract = {
      ...sample,
      triggers: [...sample.triggers, sample.triggers[0].toUpperCase()],
    };
    const errs = validateContractObject(
      dupTriggerContract,
      'material-quality-checker',
      catalogSkillSet,
      undefined,
      { rootDir: root, contextFieldMap },
    );
    assert.equal(errs.some((e) => e.includes('duplicate trigger')), true);
  });

  it('Scenario 10: every exclusion delegateTo and handoff target across all 48 contracts resolves to a valid catalog skill ID without self-reference', () => {
    for (const skillId of catalogSkillIds) {
      const contract = JSON.parse(
        fs.readFileSync(path.join(skillsDir, skillId, 'contract.json'), 'utf8'),
      );
      for (const ex of contract.exclusions) {
        assert.equal(catalogSkillSet.has(ex.delegateTo), true, `Unknown delegateTo ${ex.delegateTo} in ${skillId}`);
        assert.notEqual(ex.delegateTo, skillId, `Self-referencing delegateTo in ${skillId}`);
      }
      for (const h of contract.handoffs) {
        assert.equal(catalogSkillSet.has(h.target), true, `Unknown handoff target ${h.target} in ${skillId}`);
        assert.notEqual(h.target, skillId, `Self-referencing handoff target in ${skillId}`);
      }
    }
  });

  it('Scenario 11: unknown or self-referencing exclusion delegateTo or handoff target is rejected by validateContractObject', () => {
    const sample = JSON.parse(
      fs.readFileSync(path.join(skillsDir, 'asset-style-consistency-checker', 'contract.json'), 'utf8'),
    );
    const badTargets = structuredClone(sample);
    badTargets.exclusions[0].delegateTo = 'non-existent-skill';
    badTargets.handoffs[0].target = 'asset-style-consistency-checker';

    const errs = validateContractObject(
      badTargets,
      'asset-style-consistency-checker',
      catalogSkillSet,
      undefined,
      { rootDir: root, contextFieldMap },
    );
    assert.equal(errs.some((e) => e.includes("'non-existent-skill' is not a valid catalog skill ID")), true);
    assert.equal(errs.some((e) => e.includes("cannot self-reference 'asset-style-consistency-checker'")), true);
  });

  it('Scenario 12: registry/contract-context-fields.json validates cleanly against schemas/contract-context-fields.schema.json', () => {
    assert.deepEqual(vocabLoadErrors, []);
    assert.ok(vocab);
    assert.equal(vocab.schemaVersion, '1.0.0');
    assert.ok(contextFieldMap.size >= 15);
    assert.equal(contextFieldMap.size, vocab.fields.length);
  });

  it('Scenario 13: every when and retryPolicy.exitCondition predicate across all 371 edges in all 48 contracts conforms to the context field vocabulary', () => {
    let totalCheckedEdges = 0;
    for (const skillId of catalogSkillIds) {
      const contract = JSON.parse(
        fs.readFileSync(path.join(skillsDir, skillId, 'contract.json'), 'utf8'),
      );
      totalCheckedEdges += contract.handoffs.length;
      const fieldErrs = validateContractContextFields(contract, skillId, contextFieldMap);
      assert.deepEqual(
        fieldErrs,
        [],
        `Unexpected context field errors in ${skillId}: ${fieldErrs.join('; ')}`,
      );
    }
    assert.equal(totalCheckedEdges, 371);
  });

  it('Scenario 14: unknown context field in a handoff when or retryPolicy.exitCondition predicate is rejected', () => {
    const sample = JSON.parse(
      fs.readFileSync(path.join(skillsDir, 'blender-composition-camera-planner', 'contract.json'), 'utf8'),
    );
    const mutated = structuredClone(sample);
    mutated.handoffs[0].when = {
      all: [{ field: 'unknown.domainField', operator: 'equals', value: 'passed' }],
    };

    const errs = validateContractContextFields(mutated, 'blender-composition-camera-planner', contextFieldMap);
    assert.equal(
      errs.some((e) => e.includes("unknown context field 'unknown.domainField'")),
      true,
    );
  });

  it('Scenario 15: wrong valueType or disallowed enum value in a context field predicate is rejected', () => {
    const sample = JSON.parse(
      fs.readFileSync(path.join(skillsDir, 'blender-composition-camera-planner', 'contract.json'), 'utf8'),
    );
    const badEnum = structuredClone(sample);
    badEnum.handoffs[0].when = {
      all: [{ field: 'gate.status', operator: 'equals', value: 'invented_gate_status' }],
    };
    const errsEnum = validateContractContextFields(badEnum, 'blender-composition-camera-planner', contextFieldMap);
    assert.equal(
      errsEnum.some((e) => e.includes('not in allowedValues')),
      true,
    );

    const badType = structuredClone(sample);
    badType.handoffs[0].when = {
      all: [{ field: 'brief.locked', operator: 'equals', value: 'yes' }],
    };
    const errsType = validateContractContextFields(badType, 'blender-composition-camera-planner', contextFieldMap);
    assert.equal(
      errsType.some((e) => e.includes("expects valueType 'boolean'")),
      true,
    );
  });

  it('Scenario 16: retry handoff without retryPolicy or non-retry handoff with retryPolicy fails validation', () => {
    const sample = JSON.parse(
      fs.readFileSync(path.join(skillsDir, 'composition-quality-checker', 'contract.json'), 'utf8'),
    );
    const missingPolicy = structuredClone(sample);
    const retryIdx = missingPolicy.handoffs.findIndex((h) => h.type === 'retry');
    assert.ok(retryIdx >= 0, 'composition-quality-checker must have a retry handoff');
    delete missingPolicy.handoffs[retryIdx].retryPolicy;

    const errsMissing = validateContractObject(
      missingPolicy,
      'composition-quality-checker',
      catalogSkillSet,
      undefined,
      { rootDir: root, contextFieldMap },
    );
    assert.equal(errsMissing.some((e) => e.includes('retryPolicy')), true);

    const forbiddenPolicy = structuredClone(sample);
    const progIdx = forbiddenPolicy.handoffs.findIndex((h) => h.type === 'progression');
    assert.ok(progIdx >= 0);
    forbiddenPolicy.handoffs[progIdx].retryPolicy = {
      maxAttempts: 2,
      exitCondition: {
        all: [{ field: 'gate.status', operator: 'equals', value: 'passed' }],
      },
    };
    const errsForbidden = validateContractObject(
      forbiddenPolicy,
      'composition-quality-checker',
      catalogSkillSet,
      undefined,
      { rootDir: root, contextFieldMap },
    );
    assert.equal(
      errsForbidden.some((e) => e.includes("non-retry handoff must NOT include 'retryPolicy'")),
      true,
    );
  });

  it('Scenario 17: compiled registry/skills.json has full-catalog coverage, 48 contracted skills, 0 uncontracted, and deterministic ordering', () => {
    const skillsRegistry = JSON.parse(
      fs.readFileSync(path.join(root, 'registry', 'skills.json'), 'utf8'),
    );
    assert.equal(skillsRegistry.coverage, 'full-catalog');
    assert.equal(skillsRegistry.contractStatus, 'full-catalog');
    assert.equal(skillsRegistry.contractedSkills, 48);
    assert.equal(skillsRegistry.uncontractedSkills, 0);
    assert.equal(skillsRegistry.catalogSkills, 48);
    assert.equal(skillsRegistry.routingPrecedenceParticipants, 4);
    assert.equal(skillsRegistry.specialistContracts, 44);
    assert.deepEqual(skillsRegistry.routingPrecedenceOrder, ROUTING_PARTICIPANT_IDS);
    assert.equal(skillsRegistry.skills.length, 48);

    // First 4 are routing participants in rank order 1..4
    assert.deepEqual(
      skillsRegistry.skills.slice(0, 4).map((s) => s.id),
      ROUTING_PARTICIPANT_IDS,
    );
    // Remaining 44 are sorted lexicographically by id
    const specialistIds = skillsRegistry.skills.slice(4).map((s) => s.id);
    assert.deepEqual(specialistIds, [...specialistIds].sort());
  });

  it('Scenario 18: compiled registry/workflow-graph.json has 48 contracted nodes, 0 catalog-only nodes, 371 edges, and 0 progression cycles', () => {
    const graph = JSON.parse(
      fs.readFileSync(path.join(root, 'registry', 'workflow-graph.json'), 'utf8'),
    );
    assert.equal(graph.coverage, 'full-catalog');
    assert.equal(graph.contractedSkills, 48);
    assert.equal(graph.uncontractedSkills, 0);
    assert.equal(graph.summary.totalNodes, 48);
    assert.equal(graph.summary.contractedNodes, 48);
    assert.equal(graph.summary.catalogOnlyNodes, 0);
    assert.equal(graph.summary.routingPrecedenceParticipants, 4);
    assert.equal(graph.summary.specialistNodes, 44);
    assert.equal(graph.summary.totalContractedEdges, 371);
    assert.equal(graph.summary.progressionCycles, 0);
    assert.equal(graph.nodes.every((n) => n.status === 'contracted'), true);
  });

  it('Scenario 19: detectProgressionCycles catches progression cycles across specialist skills while allowing bounded retry edges', () => {
    const graph = JSON.parse(
      fs.readFileSync(path.join(root, 'registry', 'workflow-graph.json'), 'utf8'),
    );
    assert.deepEqual(detectProgressionCycles(graph.edges), []);

    const firstProgression = graph.edges.find((e) => e.type === 'progression');
    assert.ok(firstProgression);
    const cyclicEdges = [
      ...graph.edges,
      {
        from: firstProgression.to,
        to: firstProgression.from,
        type: 'progression',
        label: 'Illegal progression back-edge creating a cycle',
        when: { all: [{ field: 'gate.status', operator: 'equals', value: 'passed' }] },
      },
    ];
    const cycles = detectProgressionCycles(cyclicEdges);
    assert.ok(cycles.length >= 1, 'Expected progression cycle to be detected');
  });

  it('Scenario 20: all 48 skills are connected in registry/workflow-graph.json with zero isolated nodes and reachable scope-boundary enforcer', () => {
    const graph = JSON.parse(
      fs.readFileSync(path.join(root, 'registry', 'workflow-graph.json'), 'utf8'),
    );
    const inDegree = new Map(catalogSkillIds.map((id) => [id, 0]));
    const outDegree = new Map(catalogSkillIds.map((id) => [id, 0]));

    for (const edge of graph.edges) {
      outDegree.set(edge.from, (outDegree.get(edge.from) || 0) + 1);
      inDegree.set(edge.to, (inDegree.get(edge.to) || 0) + 1);
    }

    for (const skillId of catalogSkillIds) {
      const totalDeg = (inDegree.get(skillId) || 0) + (outDegree.get(skillId) || 0);
      assert.ok(totalDeg > 0, `Skill ${skillId} is isolated in workflow-graph.json`);
      assert.ok((inDegree.get(skillId) || 0) > 0, `Skill ${skillId} has 0 incoming handoff edges`);
    }

    assert.ok(
      (inDegree.get('blender-scope-boundary-enforcer') || 0) >= 2,
      'blender-scope-boundary-enforcer must have incoming handoff edges',
    );
  });

  it('Scenario 21: all 48 SKILL.md files contain synchronized managed sections matching their contract.json', () => {
    for (const skillId of catalogSkillIds) {
      const contract = JSON.parse(
        fs.readFileSync(path.join(skillsDir, skillId, 'contract.json'), 'utf8'),
      );
      const md = fs.readFileSync(path.join(skillsDir, skillId, 'SKILL.md'), 'utf8');
      const rendered = renderManagedSections(contract);

      assert.equal(md.includes(rendered.triggers), true, `Unsynced triggers block in ${skillId}/SKILL.md`);
      assert.equal(md.includes(rendered.exclusions), true, `Unsynced exclusions block in ${skillId}/SKILL.md`);
      assert.equal(md.includes(rendered.handoffs), true, `Unsynced handoffs block in ${skillId}/SKILL.md`);
      assert.equal(applyManagedSectionsToSkillMd(md, contract), md);
    }
  });

  it('Scenario 22: managed section drift in any SKILL.md file is detected and rejected', () => {
    const skillId = 'blender-lighting-material-planner';
    const contract = JSON.parse(
      fs.readFileSync(path.join(skillsDir, skillId, 'contract.json'), 'utf8'),
    );
    const md = fs.readFileSync(path.join(skillsDir, skillId, 'SKILL.md'), 'utf8');
    const driftedMd = md.replace(
      '<!-- blendops:generated:start triggers -->\n',
      '<!-- blendops:generated:start triggers -->\n- "manually injected drifted trigger"\n',
    );
    assert.notEqual(applyManagedSectionsToSkillMd(driftedMd, contract), driftedMd);
  });

  it('Scenario 23: all 48 SKILL.md files use canonical relative-path handoff notation and all 13 Phase 0 bare-ID skills are normalized', () => {
    const phase0Inv = JSON.parse(
      fs.readFileSync(path.join(root, 'docs', 'audits', 'phase-0', 'skill-inventory.json'), 'utf8'),
    );
    const originallyBareIdSkills = phase0Inv.skills
      .filter((s) => s.handoffNotationStyle === 'bare_id')
      .map((s) => s.id);
    assert.equal(originallyBareIdSkills.length, 13);

    for (const skillId of catalogSkillIds) {
      const scan = scanSkillMarkdown(root, skillId);
      assert.equal(scan.hasContract, true);
      assert.equal(scan.hasManagedSections, true);
      assert.equal(
        scan.handoffNotationStyle,
        'relative_path',
        `Expected relative_path handoff notation for ${skillId}, got ${scan.handoffNotationStyle}`,
      );
    }

    for (const formerlyBareId of originallyBareIdSkills) {
      const scan = scanSkillMarkdown(root, formerlyBareId);
      assert.equal(scan.handoffNotationStyle, 'relative_path');
    }
  });

  it('Scenario 24: resolveRoutingWinner resolves the exact same routing winners across all 16 state vectors with 48 contracts vs 4 pilot contracts', () => {
    const skillsRegistry = JSON.parse(
      fs.readFileSync(path.join(root, 'registry', 'skills.json'), 'utf8'),
    );
    const all48Contracts = skillsRegistry.skills;
    const pilot4Contracts = all48Contracts.filter((c) => ROUTING_PARTICIPANT_IDS.includes(c.id));
    assert.equal(all48Contracts.length, 48);
    assert.equal(pilot4Contracts.length, 4);

    const all16States = enumerateRoutingStateSpace({ includeContradictory: true });
    assert.equal(all16States.length, 16);

    for (const state of all16States) {
      const winner48 = resolveRoutingWinner(all48Contracts, state);
      const winner4 = resolveRoutingWinner(pilot4Contracts, state);
      assert.equal(
        winner48,
        winner4,
        `Routing winner mismatch on state ${JSON.stringify(state)}: ${winner48} vs ${winner4}`,
      );
    }
  });

  it('Scenario 25: all 12 pilot evaluation suites (73 deterministic & contract-routing cases) pass against the 48-skill registry', () => {
    const evalRes = runEvalSuites({ rootDir: root, checkOnly: false });
    assert.equal(evalRes.ok, true, `Expected eval suites to pass, got: ${evalRes.errors.join('; ')}`);
    assert.equal(evalRes.summary.suitesExecuted, 12);
    assert.equal(evalRes.summary.totalCasesExecuted, 73);
    assert.equal(evalRes.summary.passedCases, 73);
    assert.equal(evalRes.summary.failedCases, 0);
  });

  it('Scenario 26: docs/audits/current/skill-inventory.json reflects 48/48 contracted skills, 48 relative-path handoffs, 0 bare-ID handoffs, and 48 KEEP skills', () => {
    const skillInv = JSON.parse(
      fs.readFileSync(path.join(root, 'docs', 'audits', 'current', 'skill-inventory.json'), 'utf8'),
    );
    assert.equal(skillInv.summary.totalSkills, 48);
    assert.equal(skillInv.summary.contractStatus, 'full-catalog');
    assert.equal(skillInv.summary.contractedSkillsCount, 48);
    assert.equal(skillInv.summary.uncontractedSkillsCount, 0);
    assert.equal(skillInv.summary.routingPrecedenceParticipantsCount, 4);
    assert.equal(skillInv.summary.specialistContractsCount, 44);
    assert.equal(skillInv.summary.totalWorkflowEdges, 371);
    assert.equal(skillInv.summary.skillsUsingRelativePathHandoffNotation, 48);
    assert.equal(skillInv.summary.skillsUsingBareIdHandoffNotation, 0);
    assert.equal(skillInv.summary.dispositionBreakdown.KEEP, 48);
    assert.equal(skillInv.summary.dispositionBreakdown.IMPROVE, 0);

    for (const s of skillInv.skills) {
      assert.equal(s.hasContract, true);
      assert.equal(s.hasManagedMarkdownSections, true);
      assert.equal(s.handoffNotationStyle, 'relative_path');
      assert.deepEqual(s.issues, []);
      assert.equal(s.auditDisposition, 'KEEP');
    }
  });

  it('Scenario 27: docs/audits/current/findings.json marks F-03 FIXED and F-09 OPEN, and reverts in an isolated repo if a contract is removed', () => {
    const findings = JSON.parse(
      fs.readFileSync(path.join(root, 'docs', 'audits', 'current', 'findings.json'), 'utf8'),
    );
    const f03 = findings.findings.find((f) => f.id === 'F-03');
    const f09 = findings.findings.find((f) => f.id === 'F-09');
    assert.equal(f03?.currentLifecycleStatus, 'FIXED');
    assert.equal(f09?.currentLifecycleStatus, 'OPEN');

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'blendops-phase5-f03-'));
    try {
      for (const relDir of [
        path.join('docs', 'audits', 'phase-0'),
        'registry',
        'evals',
        'schemas',
        'skills',
      ]) {
        fs.cpSync(path.join(root, relDir), path.join(tempDir, relDir), { recursive: true });
      }
      fs.writeFileSync(
        path.join(tempDir, AUDITED_INPUTS_MANIFEST_REL),
        JSON.stringify(
          {
            schemaVersion: '1.0.0',
            requiredFiles: [AUDITED_INPUTS_MANIFEST_REL],
            requiredDirectories: ['docs/audits/phase-0', 'registry', 'evals', 'schemas', 'skills'],
          },
          null,
          2,
        ) + '\n',
        'utf8',
      );
      execFileSync('git', ['init', '-b', 'main'], { cwd: tempDir });
      execFileSync('git', ['config', 'user.name', 'Temp Tester'], { cwd: tempDir });
      execFileSync('git', ['config', 'user.email', 'tester@example.com'], { cwd: tempDir });
      execFileSync('git', ['add', '.'], { cwd: tempDir });
      execFileSync('git', ['commit', '-m', 'Initial temp commit'], { cwd: tempDir });

      // Remove one contract.json in tempDir
      fs.unlinkSync(path.join(tempDir, 'skills', 'polycount-budget-checker', 'contract.json'));

      const generated = generateCurrentAuditArtifacts(tempDir);
      assert.equal(generated.currentSkillInventory.summary.contractedSkillsCount, 47);
      assert.equal(generated.currentSkillInventory.summary.uncontractedSkillsCount, 1);
      const mutatedF03 = generated.findings.findings.find((f) => f.id === 'F-03');
      const mutatedF09 = generated.findings.findings.find((f) => f.id === 'F-09');
      assert.equal(mutatedF03.currentLifecycleStatus, 'PARTIALLY_FIXED');
      assert.equal(mutatedF09.currentLifecycleStatus, 'DEFERRED');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('Scenario 28: docs/audits/current/scorecard.json records 81.0/100 (+26.5) with Pillar 1 = 15.0 and Pillar 2 = 15.0 while Phase 0 baseline stays 54.5/100', () => {
    const scorecard = JSON.parse(
      fs.readFileSync(path.join(root, 'docs', 'audits', 'current', 'scorecard.json'), 'utf8'),
    );
    const baseline = JSON.parse(
      fs.readFileSync(path.join(root, 'docs', 'audits', 'phase-0', 'baseline-scorecard.json'), 'utf8'),
    );
    assert.equal(baseline.totals.measuredScore, 54.5);
    assert.equal(scorecard.totals.historicalBaselineScore, 54.5);
    assert.equal(scorecard.totals.measuredScore, 81.0);
    assert.equal(scorecard.totals.scoreDelta, '+26.5');

    const p1 = scorecard.pillars.find((p) => p.id === 'pillar-1-skill-quality-and-contracts');
    const p2 = scorecard.pillars.find((p) => p.id === 'pillar-2-workflow-architecture-and-routing');
    assert.equal(p1?.measuredScore, 15.0);
    assert.equal(p2?.measuredScore, 15.0);
  });

  it('Scenario 29: audited-inputs.manifest.json covers all Phase 5 schemas, registries, contracts, and test-phase5.mjs', () => {
    const resolved = new Set(resolveAuditedInputFiles(root));
    for (const expectedPath of [
      'schemas/skill-contract.schema.json',
      'schemas/contract-context-fields.schema.json',
      'registry/contract-context-fields.json',
      'registry/skills.json',
      'registry/workflow-graph.json',
      'scripts/test-phase5.mjs',
      'skills/blender-composition-camera-planner/contract.json',
      'skills/workflow-stage-router/contract.json',
    ]) {
      assert.equal(
        resolved.has(expectedPath),
        true,
        `Expected ${expectedPath} to be covered by audited-inputs.manifest.json`,
      );
    }

    const scorecard = JSON.parse(
      fs.readFileSync(path.join(root, 'docs', 'audits', 'current', 'scorecard.json'), 'utf8'),
    );
    assert.equal(scorecard.auditProvenance.auditedInputsSha256, computeAuditedInputsDigest(root));
  });

  it('Scenario 30: docs:check, registry:check, evals:check, and skills:export all pass across the 48-skill catalog', () => {
    const docsRes = runDocsCheck(root);
    assert.equal(docsRes.ok, true, `docs:check failed: ${docsRes.errors.join('; ')}`);
    assert.equal(docsRes.catalogSkillCount, 48);

    const regCheckOut = execFileSync(
      process.execPath,
      [path.join(root, 'scripts', 'build-registry.mjs'), '--check'],
      { cwd: root, encoding: 'utf8' },
    );
    assert.match(regCheckOut, /48 contracted skills, 371 edges/);

    const exportOut = execFileSync(
      process.execPath,
      [path.join(root, 'scripts', 'export-claude-skills.mjs')],
      { cwd: root, encoding: 'utf8' },
    );
    assert.match(exportOut, /Exported 48 Claude skill zips/i);
  });
});
