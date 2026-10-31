#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_SCHEMA_PATH = path.resolve(__dirname, '..', 'schemas', 'skill-contract.schema.json');

export const ENUMERATED_GOAL_CLARITIES = Object.freeze(['ambiguous_or_mixed', 'clear']);
const VALID_RUNTIME_GOAL_CLARITIES = new Set(ENUMERATED_GOAL_CLARITIES);
const VALID_GATE_GOAL_CLARITIES = new Set(['ambiguous_or_mixed', 'clear', 'any']);

let cachedValidatorState = null;

function getCompiledValidators(schemaPath = DEFAULT_SCHEMA_PATH) {
  const resolvedPath = path.resolve(schemaPath);
  const rawSchema = fs.readFileSync(resolvedPath, 'utf8');
  const schemaHash = crypto.createHash('sha256').update(rawSchema, 'utf8').digest('hex');

  if (cachedValidatorState && cachedValidatorState.schemaHash === schemaHash) {
    return cachedValidatorState;
  }

  const schemaObj = JSON.parse(rawSchema);
  const ajv = new Ajv2020({
    allErrors: true,
    strict: true,
    verbose: true,
  });

  const validateContract = ajv.compile(schemaObj);
  const schemaId = schemaObj.$id || 'https://github.com/ThanhNguyxnOrg/blendops/schemas/skill-contract.schema.json';
  const validateConditionGroupSchema = ajv.getSchema(`${schemaId}#/$defs/conditionGroup`);

  cachedValidatorState = {
    schemaHash,
    validateContract,
    validateConditionGroupSchema,
  };
  return cachedValidatorState;
}

function pointerToDotPath(instancePath, params = {}) {
  const segments = (instancePath || '')
    .split('/')
    .filter(Boolean)
    .map((s) => s.replace(/~1/g, '/').replace(/~0/g, '~'));

  if (params.missingProperty) {
    segments.push(params.missingProperty);
  } else if (params.additionalProperty) {
    segments.push(params.additionalProperty);
  }

  if (segments.length === 0) return '<root>';

  let out = '';
  for (const seg of segments) {
    if (/^\d+$/.test(seg)) {
      out += `[${seg}]`;
    } else if (out.length === 0) {
      out += seg;
    } else {
      out += `.${seg}`;
    }
  }
  return out;
}

function formatAjvErrors(ajvErrors, prefix) {
  const formatted = [];
  const seen = new Set();

  for (const err of ajvErrors || []) {
    const pointer = err.instancePath || '/';
    const dotPath = pointerToDotPath(err.instancePath, err.params);
    let detail = err.message || 'schema validation error';

    if (err.keyword === 'additionalProperties' && err.params?.additionalProperty) {
      detail = `must NOT have additional property '${err.params.additionalProperty}'`;
    } else if (err.keyword === 'required' && err.params?.missingProperty) {
      if (err.params.missingProperty === 'retryPolicy') {
        detail = `must have required property 'retryPolicy' (handoff of type 'retry' requires a retryPolicy object)`;
      } else {
        detail = `must have required property '${err.params.missingProperty}'`;
      }
    } else if (err.keyword === 'not' && /^\/handoffs\/\d+$/.test(pointer)) {
      detail = `non-retry handoff must NOT include 'retryPolicy'`;
    } else if (err.keyword === 'enum' && Array.isArray(err.params?.allowedValues)) {
      detail = `${detail} [${err.params.allowedValues.join(', ')}]`;
    }

    let dataSuffix = '';
    if (
      err.data !== undefined &&
      (typeof err.data === 'string' || typeof err.data === 'number' || typeof err.data === 'boolean')
    ) {
      dataSuffix = ` (received ${JSON.stringify(err.data)})`;
    }

    const msg = `${prefix} at ${pointer} (${dotPath}): ${detail}${dataSuffix}`;
    if (!seen.has(msg)) {
      seen.add(msg);
      formatted.push(msg);
    }
  }

  return formatted;
}

export function validateConditionGroup(group, ctxPath, errors) {
  const { validateConditionGroupSchema } = getCompiledValidators();
  const valid = validateConditionGroupSchema(group);
  if (!valid) {
    for (const err of validateConditionGroupSchema.errors || []) {
      const subPath = pointerToDotPath(err.instancePath, err.params);
      const fullPath = subPath === '<root>' ? ctxPath : `${ctxPath}.${subPath}`;
      let dataSuffix = '';
      if (
        err.data !== undefined &&
        (typeof err.data === 'string' || typeof err.data === 'number' || typeof err.data === 'boolean')
      ) {
        dataSuffix = ` (received ${JSON.stringify(err.data)})`;
      }
      errors.push(`${fullPath}: ${err.message}${dataSuffix}`);
    }
  }
}

export function validateContractObject(contract, expectedId, catalogSkillSet, schemaPath = DEFAULT_SCHEMA_PATH) {
  const errors = [];
  const prefix = `contract(${expectedId})`;

  if (!contract || typeof contract !== 'object' || Array.isArray(contract)) {
    return [`${prefix} at / (<root>): root must be a JSON object`];
  }

  const { validateContract } = getCompiledValidators(schemaPath);
  const schemaValid = validateContract(contract);
  if (!schemaValid) {
    errors.push(...formatAjvErrors(validateContract.errors, prefix));
  }

  // Semantic check 1: Contract ID must match directory name
  if (typeof contract.id === 'string' && contract.id !== expectedId) {
    errors.push(`${prefix} at /id (id): contract id '${contract.id}' does not match directory '${expectedId}'`);
  }

  // Semantic check 2: Case-insensitive normalized duplicate trigger check
  if (Array.isArray(contract.triggers)) {
    const seenNormalized = new Map();
    contract.triggers.forEach((t, idx) => {
      if (typeof t === 'string') {
        const norm = t.toLowerCase().trim();
        if (seenNormalized.has(norm)) {
          errors.push(
            `${prefix} at /triggers/${idx} (triggers[${idx}]): duplicate trigger '${t}' (conflicts with triggers[${seenNormalized.get(norm)}])`,
          );
        } else {
          seenNormalized.set(norm, idx);
        }
      }
    });
  }

  // Semantic check 3: Exclusions delegateTo must exist in catalog and not self-reference
  if (Array.isArray(contract.exclusions)) {
    contract.exclusions.forEach((ex, i) => {
      if (ex && typeof ex === 'object' && typeof ex.delegateTo === 'string') {
        if (!catalogSkillSet.has(ex.delegateTo)) {
          errors.push(
            `${prefix} at /exclusions/${i}/delegateTo (exclusions[${i}].delegateTo): '${ex.delegateTo}' is not a valid catalog skill ID`,
          );
        }
        if (ex.delegateTo === expectedId) {
          errors.push(
            `${prefix} at /exclusions/${i}/delegateTo (exclusions[${i}].delegateTo): cannot self-reference '${expectedId}'`,
          );
        }
      }
    });
  }

  // Semantic check 4: Handoff targets must exist in catalog and not self-reference
  if (Array.isArray(contract.handoffs)) {
    contract.handoffs.forEach((h, i) => {
      if (h && typeof h === 'object' && typeof h.target === 'string') {
        if (!catalogSkillSet.has(h.target)) {
          errors.push(
            `${prefix} at /handoffs/${i}/target (handoffs[${i}].target): '${h.target}' does not exist in the 48-skill catalog`,
          );
        }
        if (h.target === expectedId) {
          errors.push(
            `${prefix} at /handoffs/${i}/target (handoffs[${i}].target): cannot self-reference '${expectedId}'`,
          );
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

export function isContradictoryRoutingState(state) {
  if (!state || typeof state !== 'object') return true;
  // Preflight cannot pass when no recipe/pack is selected
  if (state.preflightPassed === true && state.recipeSelected !== true) {
    return true;
  }
  // In-flight stage/artifact inventory requires a selected recipe and passed preflight
  if (
    state.hasStageOrArtifactInventory === true &&
    (state.recipeSelected !== true || state.preflightPassed !== true)
  ) {
    return true;
  }
  return false;
}

export function enumerateRoutingStateSpace({ includeContradictory = false } = {}) {
  const states = [];
  for (const goalClarity of ENUMERATED_GOAL_CLARITIES) {
    for (const recipeSelected of [false, true]) {
      for (const preflightPassed of [false, true]) {
        for (const hasStageOrArtifactInventory of [false, true]) {
          const candidate = {
            goalClarity,
            recipeSelected,
            preflightPassed,
            hasStageOrArtifactInventory,
          };
          if (includeContradictory || !isContradictoryRoutingState(candidate)) {
            states.push(candidate);
          }
        }
      }
    }
  }
  return states;
}

export function doesGateMatchState(gate, state) {
  if (!gate || typeof gate !== 'object' || !state || typeof state !== 'object') {
    return false;
  }
  const clarityMatches = gate.goalClarity === 'any' || gate.goalClarity === state.goalClarity;
  const recipeMatches = gate.recipeSelected === state.recipeSelected;
  const preflightMatches = gate.preflightPassed === state.preflightPassed;
  const invMatches = gate.hasStageOrArtifactInventory === state.hasStageOrArtifactInventory;
  return clarityMatches && recipeMatches && preflightMatches && invMatches;
}

export function validatePrecedenceLadder(contracts) {
  const errors = [];
  const byGroup = new Map();

  for (const c of contracts) {
    if (!c || typeof c !== 'object' || !c.routingPrecedence || typeof c.routingPrecedence !== 'object') {
      errors.push(`Contract '${c?.id || '<unknown>'}' is missing a valid routingPrecedence object`);
      continue;
    }
    const g = c.routingPrecedence.group;
    if (!byGroup.has(g)) byGroup.set(g, []);
    byGroup.get(g).push(c);
  }

  const allStates = enumerateRoutingStateSpace({ includeContradictory: true });
  const validStates = enumerateRoutingStateSpace({ includeContradictory: false });

  for (const [group, list] of byGroup.entries()) {
    const seenRanks = new Map();
    const seenGateKeys = new Map();
    const validGateContracts = [];

    for (const c of list) {
      const r = c.routingPrecedence.rank;
      if (!Number.isInteger(r) || r < 1 || r > 100) {
        errors.push(`Invalid routingPrecedence.rank '${r}' on '${c.id}' in group '${group}'`);
      } else if (seenRanks.has(r)) {
        errors.push(
          `Duplicate routingPrecedence.rank ${r} in group '${group}' between '${seenRanks.get(r)}' and '${c.id}'`,
        );
      } else {
        seenRanks.set(r, c.id);
      }

      const gate = c.routingPrecedence.activationGate;
      if (
        !gate ||
        typeof gate !== 'object' ||
        !VALID_GATE_GOAL_CLARITIES.has(gate.goalClarity) ||
        typeof gate.recipeSelected !== 'boolean' ||
        typeof gate.preflightPassed !== 'boolean' ||
        typeof gate.hasStageOrArtifactInventory !== 'boolean'
      ) {
        errors.push(
          `Invalid activationGate in group '${group}' on '${c.id}': ${JSON.stringify(gate)}`,
        );
        continue;
      }

      const gKey = JSON.stringify({
        goalClarity: gate.goalClarity,
        recipeSelected: gate.recipeSelected,
        preflightPassed: gate.preflightPassed,
        hasStageOrArtifactInventory: gate.hasStageOrArtifactInventory,
      });
      if (seenGateKeys.has(gKey)) {
        errors.push(
          `Identical activationGate in group '${group}' between '${seenGateKeys.get(gKey)}' and '${c.id}': ${gKey}`,
        );
      } else {
        seenGateKeys.set(gKey, c.id);
      }

      validGateContracts.push(c);
    }

    const sorted = [...validGateContracts].sort(
      (a, b) => a.routingPrecedence.rank - b.routingPrecedence.rank,
    );

    // 1. Deterministic state-space overlap detection across all state combinations
    for (const state of allStates) {
      const matching = sorted.filter((c) =>
        doesGateMatchState(c.routingPrecedence.activationGate, state),
      );
      if (matching.length > 1) {
        const names = matching
          .map((c) => `'${c.id}' (rank ${c.routingPrecedence.rank})`)
          .join(' and ');
        errors.push(
          `Overlapping activationGate in group '${group}' between ${names} on state vector ${JSON.stringify(state)}`,
        );
      }
    }

    // 2. Unreachable activation gate detection against the valid runtime state space
    const claimedStateKeys = new Map();
    for (const c of sorted) {
      const gate = c.routingPrecedence.activationGate;
      const matchingValidStates = validStates.filter((s) => doesGateMatchState(gate, s));
      if (matchingValidStates.length === 0) {
        errors.push(
          `Unreachable activationGate in group '${group}' for '${c.id}' (rank ${c.routingPrecedence.rank}): gate ${JSON.stringify(gate)} matches 0 valid runtime states (contradictory state requirement)`,
        );
        continue;
      }

      const unshadowedStates = matchingValidStates.filter(
        (s) => !claimedStateKeys.has(JSON.stringify(s)),
      );
      if (unshadowedStates.length === 0) {
        const shadowingOwners = [
          ...new Set(matchingValidStates.map((s) => claimedStateKeys.get(JSON.stringify(s)))),
        ];
        errors.push(
          `Unreachable activationGate in group '${group}' for '${c.id}' (rank ${c.routingPrecedence.rank}): all matching valid states are shadowed by ${shadowingOwners.map((id) => `'${id}'`).join(', ')}`,
        );
      }

      for (const s of matchingValidStates) {
        const sKey = JSON.stringify(s);
        if (!claimedStateKeys.has(sKey)) {
          claimedStateKeys.set(sKey, c.id);
        }
      }
    }
  }

  return errors;
}

export function resolveRoutingWinner(contracts, state) {
  if (!state || typeof state !== 'object' || Array.isArray(state)) return null;
  if (!Array.isArray(contracts) || contracts.length === 0) return null;

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

  // Runtime state goalClarity must be a concrete enumerated value ('ambiguous_or_mixed' or 'clear'), never 'any' or unknown
  if (typeof state.goalClarity !== 'string' || !VALID_RUNTIME_GOAL_CLARITIES.has(state.goalClarity)) {
    return null;
  }

  if (
    typeof state.recipeSelected !== 'boolean' ||
    typeof state.preflightPassed !== 'boolean' ||
    typeof state.hasStageOrArtifactInventory !== 'boolean'
  ) {
    return null;
  }

  if (isContradictoryRoutingState(state)) {
    return null;
  }

  const sorted = [...contracts].sort((a, b) => a.routingPrecedence.rank - b.routingPrecedence.rank);
  for (const c of sorted) {
    const gate = c.routingPrecedence?.activationGate;
    if (doesGateMatchState(gate, state)) {
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
  const validContracts = [];
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
    const cErrors = validateContractObject(
      parsed,
      id,
      catalogSkillSet,
      fs.existsSync(schemaPath) ? schemaPath : DEFAULT_SCHEMA_PATH,
    );
    errors.push(...cErrors);
    contracts.push(parsed);
    if (cErrors.length === 0) {
      validContracts.push(parsed);
    }
  }

  errors.push(...validatePrecedenceLadder(validContracts));

  const graphEdges = [];
  for (const c of validContracts) {
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
    const contract = validContracts.find((c) => c.id === id);
    return {
      id,
      status: contractedSet.has(id) ? 'contracted' : 'catalog-only',
      category: contract ? contract.category : null,
      role: contract ? contract.role : null,
      precedenceRank: contract ? contract.routingPrecedence.rank : null,
    };
  });

  const sortedValidContracts = [...validContracts].sort(
    (a, b) => a.routingPrecedence.rank - b.routingPrecedence.rank,
  );

  const skillsRegistry = {
    schemaVersion: '1.0.0',
    coverage: 'routing-pilot',
    contractedSkills: sortedValidContracts.length,
    catalogSkills: catalogSkillIds.length,
    sourceChecksum,
    skills: sortedValidContracts,
  };

  const workflowGraph = {
    schemaVersion: '1.0.0',
    coverage: 'routing-pilot',
    contractedSkills: sortedValidContracts.length,
    catalogSkills: catalogSkillIds.length,
    sourceChecksum,
    summary: {
      totalNodes: catalogNodes.length,
      contractedNodes: sortedValidContracts.length,
      catalogOnlyNodes: catalogNodes.length - sortedValidContracts.length,
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
    contracts: sortedValidContracts,
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

  // If contract/schema/precedence/cycle validation already failed in build mode, abort before writing any file
  if (!checkOnly && errors.length > 0) {
    console.error('build-registry validation failed:');
    for (const e of errors) console.error(`- ${e}`);
    process.exit(1);
  }

  // Check or sync SKILL.md managed sections for validated contracts
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
