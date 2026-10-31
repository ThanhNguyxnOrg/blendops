#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const VALID_CATEGORIES = new Set([
  'routing-and-governance',
  'process-discipline',
  'asset-and-sourcing',
  'scene-planners',
  'render-and-output-decisions',
  'quality-validators',
  'runtime-and-execution',
  'evidence-and-handoff',
]);

const VALID_EDGE_TYPES = new Set([
  'progression',
  'conditional',
  'alternative',
  'fallback',
  'retry',
  'upstream_reference',
  'boundary_delegation',
]);

const VALID_OPERATORS = new Set(['equals', 'not_equals', 'in', 'not_in', 'exists']);

export function validateConditionGroup(group, ctxPath, errors) {
  if (!group || typeof group !== 'object' || Array.isArray(group)) {
    errors.push(`${ctxPath} must be an object with 'all' or 'any'`);
    return;
  }
  const keys = Object.keys(group);
  if (keys.length !== 1 || (keys[0] !== 'all' && keys[0] !== 'any')) {
    errors.push(`${ctxPath} must have exactly one key: 'all' or 'any'`);
    return;
  }
  const list = group[keys[0]];
  if (!Array.isArray(list) || list.length === 0) {
    errors.push(`${ctxPath}.${keys[0]} must be a non-empty array of predicates`);
    return;
  }
  list.forEach((pred, idx) => {
    const pPath = `${ctxPath}.${keys[0]}[${idx}]`;
    if (!pred || typeof pred !== 'object' || Array.isArray(pred)) {
      errors.push(`${pPath} must be a predicate object`);
      return;
    }
    const pKeys = Object.keys(pred);
    for (const k of pKeys) {
      if (!['field', 'operator', 'value'].includes(k)) {
        errors.push(`${pPath} has unknown key '${k}'`);
      }
    }
    if (typeof pred.field !== 'string' || !/^[a-zA-Z0-9_.]+$/.test(pred.field)) {
      errors.push(`${pPath}.field must be a valid dot-separated identifier`);
    }
    if (!VALID_OPERATORS.has(pred.operator)) {
      errors.push(`${pPath}.operator '${pred.operator}' is not in [${[...VALID_OPERATORS].join(', ')}]`);
    }
    if (pred.value === undefined) {
      errors.push(`${pPath}.value is required`);
    }
  });
}

export function validateContractObject(contract, expectedId, catalogSkillSet) {
  const errors = [];
  const prefix = `contract(${expectedId})`;

  if (!contract || typeof contract !== 'object' || Array.isArray(contract)) {
    return [`${prefix}: root must be a JSON object`];
  }

  const requiredTop = [
    '$schema',
    'id',
    'version',
    'category',
    'role',
    'purpose',
    'routingPrecedence',
    'triggers',
    'exclusions',
    'inputs',
    'outputs',
    'handoffs',
  ];
  for (const req of requiredTop) {
    if (!(req in contract)) errors.push(`${prefix}: missing required property '${req}'`);
  }
  for (const k of Object.keys(contract)) {
    if (!requiredTop.includes(k)) errors.push(`${prefix}: unexpected property '${k}'`);
  }

  if (contract.$schema !== '../../schemas/skill-contract.schema.json') {
    errors.push(`${prefix}: $schema must equal '../../schemas/skill-contract.schema.json'`);
  }
  if (contract.id !== expectedId) {
    errors.push(`${prefix}: id '${contract.id}' does not match directory '${expectedId}'`);
  }
  if (typeof contract.version !== 'string' || !/^\d+\.\d+\.\d+$/.test(contract.version)) {
    errors.push(`${prefix}: version must be semver (e.g., 1.0.0)`);
  }
  if (!VALID_CATEGORIES.has(contract.category)) {
    errors.push(`${prefix}: invalid category '${contract.category}'`);
  }
  if (typeof contract.role !== 'string' || contract.role.length < 3 || contract.role.length > 80) {
    errors.push(`${prefix}: role must be 3..80 chars`);
  }
  if (typeof contract.purpose !== 'string' || contract.purpose.length < 10 || contract.purpose.length > 200) {
    errors.push(`${prefix}: purpose must be 10..200 chars`);
  }

  // routingPrecedence
  const rp = contract.routingPrecedence;
  if (!rp || typeof rp !== 'object') {
    errors.push(`${prefix}: routingPrecedence must be an object`);
  } else {
    if (!['entry-and-stage-routing', 'domain-specialist'].includes(rp.group)) {
      errors.push(`${prefix}: routingPrecedence.group is invalid`);
    }
    if (!Number.isInteger(rp.rank) || rp.rank < 1 || rp.rank > 100) {
      errors.push(`${prefix}: routingPrecedence.rank must be an integer 1..100`);
    }
    const ag = rp.activationGate;
    if (!ag || typeof ag !== 'object') {
      errors.push(`${prefix}: routingPrecedence.activationGate is required`);
    } else {
      if (!['ambiguous_or_mixed', 'clear', 'any'].includes(ag.goalClarity)) {
        errors.push(`${prefix}: activationGate.goalClarity is invalid`);
      }
      for (const boolKey of ['recipeSelected', 'preflightPassed', 'hasStageOrArtifactInventory']) {
        if (typeof ag[boolKey] !== 'boolean') {
          errors.push(`${prefix}: activationGate.${boolKey} must be a boolean`);
        }
      }
    }
  }

  // triggers
  if (!Array.isArray(contract.triggers) || contract.triggers.length < 2) {
    errors.push(`${prefix}: triggers must be an array of at least 2 items`);
  } else {
    const seen = new Set();
    for (const t of contract.triggers) {
      if (typeof t !== 'string' || t.length < 3 || t.length > 120) {
        errors.push(`${prefix}: invalid trigger '${t}'`);
      }
      const norm = String(t).toLowerCase().trim();
      if (seen.has(norm)) errors.push(`${prefix}: duplicate trigger '${t}'`);
      seen.add(norm);
    }
  }

  // exclusions
  if (!Array.isArray(contract.exclusions) || contract.exclusions.length < 2) {
    errors.push(`${prefix}: exclusions must be an array of at least 2 items`);
  } else {
    contract.exclusions.forEach((ex, i) => {
      if (!ex || typeof ex !== 'object') {
        errors.push(`${prefix}: exclusions[${i}] must be an object`);
        return;
      }
      if (typeof ex.condition !== 'string' || ex.condition.length < 5) {
        errors.push(`${prefix}: exclusions[${i}].condition must be >= 5 chars`);
      }
      if (typeof ex.delegateTo !== 'string' || !catalogSkillSet.has(ex.delegateTo)) {
        errors.push(`${prefix}: exclusions[${i}].delegateTo '${ex.delegateTo}' is not a valid catalog skill ID`);
      }
      if (ex.delegateTo === expectedId) {
        errors.push(`${prefix}: exclusions[${i}].delegateTo cannot self-reference '${expectedId}'`);
      }
      if (typeof ex.reason !== 'string' || ex.reason.length < 5) {
        errors.push(`${prefix}: exclusions[${i}].reason must be >= 5 chars`);
      }
    });
  }

  // inputs & outputs
  if (!contract.inputs || !Array.isArray(contract.inputs.required) || contract.inputs.required.length < 1) {
    errors.push(`${prefix}: inputs.required must be a non-empty array`);
  }
  if (!contract.outputs || !Array.isArray(contract.outputs.primary) || contract.outputs.primary.length < 1) {
    errors.push(`${prefix}: outputs.primary must be a non-empty array`);
  } else {
    const tsp = contract.outputs.truthStatePolicy;
    if (
      !tsp ||
      tsp.runtimeDefault !== 'Not Run' ||
      tsp.artifactDefault !== 'Not Produced' ||
      tsp.mutationRule !== 'downgrade_only'
    ) {
      errors.push(`${prefix}: outputs.truthStatePolicy must lock Not Run / Not Produced / downgrade_only`);
    }
  }

  // handoffs
  if (!Array.isArray(contract.handoffs) || contract.handoffs.length < 1) {
    errors.push(`${prefix}: handoffs must be a non-empty array`);
  } else {
    contract.handoffs.forEach((h, i) => {
      const hPath = `${prefix}: handoffs[${i}]`;
      if (!h || typeof h !== 'object') {
        errors.push(`${hPath} must be an object`);
        return;
      }
      if (!catalogSkillSet.has(h.target)) {
        errors.push(`${hPath}.target '${h.target}' does not exist in the 48-skill catalog`);
      }
      if (h.target === expectedId) {
        errors.push(`${hPath}.target cannot self-reference '${expectedId}'`);
      }
      if (!VALID_EDGE_TYPES.has(h.type)) {
        errors.push(`${hPath}.type '${h.type}' is invalid`);
      }
      if (typeof h.label !== 'string' || h.label.length < 5) {
        errors.push(`${hPath}.label must be >= 5 chars`);
      }
      validateConditionGroup(h.when, `${hPath}.when`, errors);

      if (h.type === 'retry') {
        if (!h.retryPolicy || typeof h.retryPolicy !== 'object') {
          errors.push(`${hPath} of type 'retry' requires a retryPolicy object`);
        } else {
          if (
            !Number.isInteger(h.retryPolicy.maxAttempts) ||
            h.retryPolicy.maxAttempts < 1 ||
            h.retryPolicy.maxAttempts > 5
          ) {
            errors.push(`${hPath}.retryPolicy.maxAttempts must be an integer 1..5`);
          }
          validateConditionGroup(h.retryPolicy.exitCondition, `${hPath}.retryPolicy.exitCondition`, errors);
        }
      }
    });
  }

  return errors;
}

export function detectProgressionCycles(edges) {
  const progEdges = edges.filter((e) => e.type === 'progression');
  const adj = new Map();
  const nodes = new Set();
  for (const e of progEdges) {
    nodes.add(e.from);
    nodes.add(e.to);
    if (!adj.has(e.from)) adj.set(e.from, []);
    if (!adj.get(e.from).includes(e.to)) adj.get(e.from).push(e.to);
  }

  const cycles = [];
  const visited = new Set();
  const stack = [];
  const onStack = new Set();

  function dfs(u) {
    visited.add(u);
    stack.push(u);
    onStack.add(u);
    for (const v of adj.get(u) || []) {
      if (!visited.has(v)) {
        dfs(v);
      } else if (onStack.has(v)) {
        const idx = stack.indexOf(v);
        cycles.push([...stack.slice(idx), v]);
      }
    }
    stack.pop();
    onStack.delete(u);
  }

  for (const n of [...nodes].sort()) {
    if (!visited.has(n)) dfs(n);
  }
  return cycles;
}

export function validatePrecedenceLadder(contracts) {
  const errors = [];
  const byGroup = new Map();
  for (const c of contracts) {
    const g = c.routingPrecedence.group;
    if (!byGroup.has(g)) byGroup.set(g, []);
    byGroup.get(g).push(c);
  }

  for (const [group, list] of byGroup.entries()) {
    const seenRanks = new Map();
    const seenGateKeys = new Map();
    for (const c of list) {
      const r = c.routingPrecedence.rank;
      if (seenRanks.has(r)) {
        errors.push(
          `Duplicate routingPrecedence.rank ${r} in group '${group}' between '${seenRanks.get(r)}' and '${c.id}'`,
        );
      }
      seenRanks.set(r, c.id);

      const gKey = JSON.stringify(c.routingPrecedence.activationGate);
      if (seenGateKeys.has(gKey)) {
        errors.push(
          `Identical activationGate in group '${group}' between '${seenGateKeys.get(gKey)}' and '${c.id}'`,
        );
      }
      seenGateKeys.set(gKey, c.id);
    }
  }
  return errors;
}

export function resolveRoutingWinner(contracts, state) {
  if (!state || typeof state !== 'object') return null;
  const requiredStateFields = [
    'goalClarity',
    'recipeSelected',
    'preflightPassed',
    'hasStageOrArtifactInventory',
  ];
  for (const field of requiredStateFields) {
    if (!(field in state) || state[field] === undefined || state[field] === null) {
      return null;
    }
  }
  if (
    typeof state.recipeSelected !== 'boolean' ||
    typeof state.preflightPassed !== 'boolean' ||
    typeof state.hasStageOrArtifactInventory !== 'boolean'
  ) {
    return null;
  }

  const sorted = [...contracts].sort((a, b) => a.routingPrecedence.rank - b.routingPrecedence.rank);
  for (const c of sorted) {
    const gate = c.routingPrecedence.activationGate;
    const clarityMatches = gate.goalClarity === 'any' || gate.goalClarity === state.goalClarity;
    const recipeMatches = gate.recipeSelected === state.recipeSelected;
    const preflightMatches = gate.preflightPassed === state.preflightPassed;
    const invMatches = gate.hasStageOrArtifactInventory === state.hasStageOrArtifactInventory;
    if (clarityMatches && recipeMatches && preflightMatches && invMatches) {
      return c.id;
    }
  }
  return null;
}

export function renderManagedSections(contract) {
  const triggersLines = [
    '<!-- blendops:generated:start triggers -->',
    ...contract.triggers.map((t) => `- "${t}"`),
    '<!-- blendops:generated:end triggers -->',
  ].join('\n');

  const exclusionsLines = [
    '<!-- blendops:generated:start exclusions -->',
    ...contract.exclusions.map(
      (ex) => `- ${ex.condition} → use \`../${ex.delegateTo}/SKILL.md\` (${ex.reason})`,
    ),
    '<!-- blendops:generated:end exclusions -->',
  ].join('\n');

  const handoffsLines = [
    '<!-- blendops:generated:start handoffs -->',
    ...contract.handoffs.map(
      (h) => `- [${h.type}] ${h.label} → \`../${h.target}/SKILL.md\``,
    ),
    '<!-- blendops:generated:end handoffs -->',
  ].join('\n');

  return {
    triggers: triggersLines,
    exclusions: exclusionsLines,
    handoffs: handoffsLines,
  };
}

export function applyManagedSectionsToSkillMd(skillMdText, contract) {
  const rendered = renderManagedSections(contract);
  let updated = skillMdText;

  const sectionSpecs = [
    { heading: 'When not to use', key: 'exclusions', block: rendered.exclusions },
    { heading: 'Trigger phrases', key: 'triggers', block: rendered.triggers },
    { heading: 'Cross-skill handoff', key: 'handoffs', block: rendered.handoffs },
  ];

  for (const spec of sectionSpecs) {
    const markerRe = new RegExp(
      `<!-- blendops:generated:start ${spec.key} -->[\\s\\S]*?<!-- blendops:generated:end ${spec.key} -->`,
    );
    if (markerRe.test(updated)) {
      updated = updated.replace(markerRe, spec.block);
    } else {
      const headingRe = new RegExp(`(## ${spec.heading}\\r?\\n)([\\s\\S]*?)(?=\\r?\\n## |$)`);
      if (headingRe.test(updated)) {
        updated = updated.replace(headingRe, `$1${spec.block}\n`);
      }
    }
  }
  return updated;
}

export function buildRegistryArtifacts(rootDir) {
  const errors = [];
  const skillsDir = path.join(rootDir, 'skills');
  const schemaPath = path.join(rootDir, 'schemas', 'skill-contract.schema.json');

  if (!fs.existsSync(schemaPath)) {
    errors.push('Missing schemas/skill-contract.schema.json');
  }

  const catalogSkillIds = fs
    .readdirSync(skillsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== '_template')
    .map((d) => d.name)
    .filter((id) => fs.existsSync(path.join(skillsDir, id, 'SKILL.md')))
    .sort();

  const catalogSkillSet = new Set(catalogSkillIds);

  const contractedSkillIds = catalogSkillIds.filter((id) =>
    fs.existsSync(path.join(skillsDir, id, 'contract.json')),
  );

  const contracts = [];
  const rawInputsForChecksum = [];

  if (fs.existsSync(schemaPath)) {
    rawInputsForChecksum.push(`schema:${fs.readFileSync(schemaPath, 'utf8')}`);
  }
  rawInputsForChecksum.push(`catalog:${catalogSkillIds.join(',')}`);

  for (const id of contractedSkillIds) {
    const cPath = path.join(skillsDir, id, 'contract.json');
    const rawTxt = fs.readFileSync(cPath, 'utf8');
    rawInputsForChecksum.push(`contract:${id}:${rawTxt}`);
    let parsed;
    try {
      parsed = JSON.parse(rawTxt);
    } catch (err) {
      errors.push(`Invalid JSON in skills/${id}/contract.json: ${err.message}`);
      continue;
    }
    const cErrors = validateContractObject(parsed, id, catalogSkillSet);
    errors.push(...cErrors);
    contracts.push(parsed);
  }

  errors.push(...validatePrecedenceLadder(contracts));

  const graphEdges = [];
  for (const c of contracts) {
    for (const h of c.handoffs || []) {
      const edge = {
        from: c.id,
        to: h.target,
        type: h.type,
        label: h.label,
        when: h.when,
      };
      if (h.retryPolicy) edge.retryPolicy = h.retryPolicy;
      graphEdges.push(edge);
    }
  }

  const progCycles = detectProgressionCycles(graphEdges);
  for (const cyc of progCycles) {
    errors.push(`Illegal cycle detected in progression subgraph: ${cyc.join(' -> ')}`);
  }

  const sourceChecksum = crypto
    .createHash('sha256')
    .update(rawInputsForChecksum.join('\n---\n'), 'utf8')
    .digest('hex');

  const contractedSet = new Set(contractedSkillIds);
  const catalogNodes = catalogSkillIds.map((id) => {
    const contract = contracts.find((c) => c.id === id);
    return {
      id,
      status: contractedSet.has(id) ? 'contracted' : 'catalog-only',
      category: contract ? contract.category : null,
      role: contract ? contract.role : null,
      precedenceRank: contract ? contract.routingPrecedence.rank : null,
    };
  });

  const skillsRegistry = {
    schemaVersion: '1.0.0',
    coverage: 'routing-pilot',
    contractedSkills: contracts.length,
    catalogSkills: catalogSkillIds.length,
    sourceChecksum,
    skills: contracts.sort((a, b) => a.routingPrecedence.rank - b.routingPrecedence.rank),
  };

  const workflowGraph = {
    schemaVersion: '1.0.0',
    coverage: 'routing-pilot',
    contractedSkills: contracts.length,
    catalogSkills: catalogSkillIds.length,
    sourceChecksum,
    summary: {
      totalNodes: catalogNodes.length,
      contractedNodes: contracts.length,
      catalogOnlyNodes: catalogNodes.length - contracts.length,
      totalContractedEdges: graphEdges.length,
      edgesByType: graphEdges.reduce((acc, e) => {
        acc[e.type] = (acc[e.type] || 0) + 1;
        return acc;
      }, {}),
      progressionCycles: progCycles.length,
    },
    nodes: catalogNodes,
    edges: graphEdges,
  };

  return {
    errors,
    contracts,
    skillsRegistry,
    workflowGraph,
  };
}

function main() {
  const args = new Set(process.argv.slice(2));
  const checkOnly = args.has('--check');
  const syncSkills = args.has('--sync-skills');
  const rootDir = process.cwd();

  const { errors, contracts, skillsRegistry, workflowGraph } = buildRegistryArtifacts(rootDir);

  const skillsDir = path.join(rootDir, 'skills');
  const registryDir = path.join(rootDir, 'registry');
  const skillsJsonPath = path.join(registryDir, 'skills.json');
  const graphJsonPath = path.join(registryDir, 'workflow-graph.json');

  // Check or sync SKILL.md managed sections for contracted skills
  for (const contract of contracts) {
    const skillMdPath = path.join(skillsDir, contract.id, 'SKILL.md');
    const currentMd = fs.readFileSync(skillMdPath, 'utf8');
    const expectedMd = applyManagedSectionsToSkillMd(currentMd, contract);

    if (syncSkills && !checkOnly) {
      if (currentMd !== expectedMd) {
        fs.writeFileSync(skillMdPath, expectedMd, 'utf8');
        console.log(`Synced managed sections in skills/${contract.id}/SKILL.md`);
      }
    } else if (currentMd !== expectedMd) {
      errors.push(
        `Managed section drift detected in skills/${contract.id}/SKILL.md (run 'node scripts/build-registry.mjs --sync-skills')`,
      );
    }
  }

  const expectedSkillsJson = `${JSON.stringify(skillsRegistry, null, 2)}\n`;
  const expectedGraphJson = `${JSON.stringify(workflowGraph, null, 2)}\n`;

  if (checkOnly) {
    if (!fs.existsSync(skillsJsonPath)) {
      errors.push('Missing registry/skills.json (run node scripts/build-registry.mjs)');
    } else if (fs.readFileSync(skillsJsonPath, 'utf8') !== expectedSkillsJson) {
      errors.push('Stale registry/skills.json does not match current contracts');
    }

    if (!fs.existsSync(graphJsonPath)) {
      errors.push('Missing registry/workflow-graph.json (run node scripts/build-registry.mjs)');
    } else if (fs.readFileSync(graphJsonPath, 'utf8') !== expectedGraphJson) {
      errors.push('Stale registry/workflow-graph.json does not match current contracts');
    }

    if (errors.length > 0) {
      console.error('build-registry --check failed:');
      for (const e of errors) console.error(`- ${e}`);
      process.exit(1);
    }
    console.log(
      `build-registry --check passed (${contracts.length} contracted skills, ${workflowGraph.summary.totalContractedEdges} edges, checksum ${skillsRegistry.sourceChecksum.slice(0, 12)})`,
    );
    return;
  }

  if (errors.length > 0) {
    console.error('build-registry validation failed:');
    for (const e of errors) console.error(`- ${e}`);
    process.exit(1);
  }

  fs.mkdirSync(registryDir, { recursive: true });
  fs.writeFileSync(skillsJsonPath, expectedSkillsJson, 'utf8');
  fs.writeFileSync(graphJsonPath, expectedGraphJson, 'utf8');
  console.log(
    `Built registry/skills.json and registry/workflow-graph.json (${contracts.length} contracted skills, ${workflowGraph.summary.totalContractedEdges} edges, checksum ${skillsRegistry.sourceChecksum.slice(0, 12)})`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
