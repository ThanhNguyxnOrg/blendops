#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const DEFAULT_SCHEMA_PATH = path.join(REPO_ROOT, 'schemas', 'skill-contract.schema.json');
const DEFAULT_CONTEXT_VOCAB_SCHEMA_PATH = path.join(
  REPO_ROOT,
  'schemas',
  'contract-context-fields.schema.json',
);
const DEFAULT_CONTEXT_VOCAB_PATH = path.join(REPO_ROOT, 'registry', 'contract-context-fields.json');
const DEFAULT_CAPABILITY_POLICY_PATH = path.join(
  REPO_ROOT,
  'registry',
  'runtime-capability-policy.json',
);

export const ROUTING_PARTICIPANT_IDS = Object.freeze([
  'blendops-help',
  'recipe-fit-assessor',
  'pack-prerequisite-checker',
  'workflow-stage-router',
]);
const ROUTING_PARTICIPANT_SET = new Set(ROUTING_PARTICIPANT_IDS);

export const ENUMERATED_GOAL_CLARITIES = Object.freeze(['ambiguous_or_mixed', 'clear']);
const VALID_RUNTIME_GOAL_CLARITIES = new Set(ENUMERATED_GOAL_CLARITIES);
const VALID_GATE_GOAL_CLARITIES = new Set(['ambiguous_or_mixed', 'clear', 'any']);

let cachedValidatorState = null;
let cachedVocabValidatorState = null;

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
  const schemaId =
    schemaObj.$id || 'https://github.com/ThanhNguyxnOrg/blendops/schemas/skill-contract.schema.json';
  const validateConditionGroupSchema = ajv.getSchema(`${schemaId}#/$defs/conditionGroup`);

  cachedValidatorState = {
    schemaHash,
    validateContract,
    validateConditionGroupSchema,
  };
  return cachedValidatorState;
}

function getCompiledVocabValidator(schemaPath = DEFAULT_CONTEXT_VOCAB_SCHEMA_PATH) {
  const resolvedPath = path.resolve(schemaPath);
  const rawSchema = fs.readFileSync(resolvedPath, 'utf8');
  const schemaHash = crypto.createHash('sha256').update(rawSchema, 'utf8').digest('hex');

  if (cachedVocabValidatorState && cachedVocabValidatorState.schemaHash === schemaHash) {
    return cachedVocabValidatorState.validateVocab;
  }

  const schemaObj = JSON.parse(rawSchema);
  const ajv = new Ajv2020({
    allErrors: true,
    strict: true,
    verbose: true,
  });
  const validateVocab = ajv.compile(schemaObj);
  cachedVocabValidatorState = {
    schemaHash,
    validateVocab,
  };
  return validateVocab;
}

export function loadContextFieldVocabulary(rootDir = REPO_ROOT) {
  const candidateVocabPath = path.join(rootDir, 'registry', 'contract-context-fields.json');
  const vocabPath = fs.existsSync(candidateVocabPath)
    ? candidateVocabPath
    : DEFAULT_CONTEXT_VOCAB_PATH;
  const candidateSchemaPath = path.join(
    rootDir,
    'schemas',
    'contract-context-fields.schema.json',
  );
  const vocabSchemaPath = fs.existsSync(candidateSchemaPath)
    ? candidateSchemaPath
    : DEFAULT_CONTEXT_VOCAB_SCHEMA_PATH;

  const errors = [];
  if (!fs.existsSync(vocabPath)) {
    return {
      vocab: null,
      fieldMap: new Map(),
      errors: ['Missing registry/contract-context-fields.json'],
    };
  }

  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(vocabPath, 'utf8'));
  } catch (err) {
    return {
      vocab: null,
      fieldMap: new Map(),
      errors: [`Invalid JSON in registry/contract-context-fields.json: ${err.message}`],
    };
  }

  if (fs.existsSync(vocabSchemaPath)) {
    const validateVocab = getCompiledVocabValidator(vocabSchemaPath);
    if (!validateVocab(parsed)) {
      errors.push(...formatAjvErrors(validateVocab.errors, 'contract-context-fields'));
    }
  }

  const fieldMap = new Map();
  for (let i = 0; i < (parsed.fields || []).length; i += 1) {
    const entry = parsed.fields[i];
    if (!entry || typeof entry.field !== 'string') continue;
    if (fieldMap.has(entry.field)) {
      errors.push(
        `contract-context-fields at /fields/${i}/field: duplicate field '${entry.field}'`,
      );
    } else {
      fieldMap.set(entry.field, entry);
    }
  }

  return {
    vocab: parsed,
    fieldMap,
    errors,
  };
}

export function validateContractContextFields(contract, expectedId, fieldMap) {
  const errors = [];
  const prefix = `contract(${expectedId})`;
  if (!contract || typeof contract !== 'object' || !Array.isArray(contract.handoffs)) {
    return errors;
  }
  if (!fieldMap || !(fieldMap instanceof Map) || fieldMap.size === 0) {
    return errors;
  }

  function checkConditionGroup(group, basePointer, baseDot) {
    if (!group || typeof group !== 'object' || Array.isArray(group)) return;
    const combinator = Array.isArray(group.all) ? 'all' : Array.isArray(group.any) ? 'any' : null;
    if (!combinator) return;
    const rules = group[combinator];
    rules.forEach((rule, rIdx) => {
      if (!rule || typeof rule !== 'object' || Array.isArray(rule)) return;
      const rPtr = `${basePointer}/${combinator}/${rIdx}`;
      const rDot = `${baseDot}.${combinator}[${rIdx}]`;
      if (typeof rule.field !== 'string') return;

      const fieldDef = fieldMap.get(rule.field);
      if (!fieldDef) {
        errors.push(
          `${prefix} at ${rPtr}/field (${rDot}.field): unknown context field '${rule.field}' not found in registry/contract-context-fields.json`,
        );
        return;
      }

      const op = rule.operator;
      const val = rule.value;
      if (op === 'exists') {
        if (typeof val !== 'boolean') {
          errors.push(
            `${prefix} at ${rPtr}/value (${rDot}.value): operator 'exists' on field '${rule.field}' requires boolean value (received ${typeof val})`,
          );
        }
        return;
      }

      if (op === 'equals' || op === 'not_equals') {
        if (typeof val !== fieldDef.valueType) {
          errors.push(
            `${prefix} at ${rPtr}/value (${rDot}.value): context field '${rule.field}' expects valueType '${fieldDef.valueType}', received ${typeof val}`,
          );
          return;
        }
        if (Array.isArray(fieldDef.allowedValues) && !fieldDef.allowedValues.includes(val)) {
          errors.push(
            `${prefix} at ${rPtr}/value (${rDot}.value): value ${JSON.stringify(val)} for field '${rule.field}' is not in allowedValues [${fieldDef.allowedValues.join(', ')}]`,
          );
        }
        return;
      }

      if (op === 'in' || op === 'not_in') {
        if (!Array.isArray(val)) return;
        val.forEach((item, vIdx) => {
          if (typeof item !== fieldDef.valueType) {
            errors.push(
              `${prefix} at ${rPtr}/value/${vIdx} (${rDot}.value[${vIdx}]): context field '${rule.field}' expects elements of valueType '${fieldDef.valueType}', received ${typeof item}`,
            );
          } else if (
            Array.isArray(fieldDef.allowedValues) &&
            !fieldDef.allowedValues.includes(item)
          ) {
            errors.push(
              `${prefix} at ${rPtr}/value/${vIdx} (${rDot}.value[${vIdx}]): value ${JSON.stringify(item)} for field '${rule.field}' is not in allowedValues [${fieldDef.allowedValues.join(', ')}]`,
            );
          }
        });
      }
    });
  }

  contract.handoffs.forEach((h, hIdx) => {
    if (!h || typeof h !== 'object') return;
    checkConditionGroup(h.when, `/handoffs/${hIdx}/when`, `handoffs[${hIdx}].when`);
    if (h.retryPolicy && typeof h.retryPolicy === 'object' && h.retryPolicy.exitCondition) {
      checkConditionGroup(
        h.retryPolicy.exitCondition,
        `/handoffs/${hIdx}/retryPolicy/exitCondition`,
        `handoffs[${hIdx}].retryPolicy.exitCondition`,
      );
    }
  });

  return errors;
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
    } else if (
      (err.keyword === 'not' && /^\/handoffs\/\d+$/.test(pointer)) ||
      (err.keyword === 'false schema' && /^\/handoffs\/\d+\/retryPolicy$/.test(pointer))
    ) {
      detail = `non-retry handoff must NOT include 'retryPolicy'`;
    } else if (err.keyword === 'false schema' && pointer === '/routingPrecedence') {
      detail = `specialist contract must NOT declare 'routingPrecedence'`;
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

export function validateContractObject(
  contract,
  expectedId,
  catalogSkillSet,
  schemaPath = DEFAULT_SCHEMA_PATH,
  options = {},
) {
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

  // Semantic check 1b: Routing participant vs. specialist separation
  const isRoutingParticipant = ROUTING_PARTICIPANT_SET.has(expectedId);
  const hasRoutingPrecedence =
    Object.prototype.hasOwnProperty.call(contract, 'routingPrecedence') &&
    contract.routingPrecedence !== undefined;

  if (isRoutingParticipant && !hasRoutingPrecedence) {
    errors.push(
      `${prefix} at /routingPrecedence (routingPrecedence): routing participant '${expectedId}' must declare a routingPrecedence object`,
    );
  } else if (!isRoutingParticipant && hasRoutingPrecedence) {
    errors.push(
      `${prefix} at /routingPrecedence (routingPrecedence): specialist contract '${expectedId}' must NOT declare routingPrecedence (only [${ROUTING_PARTICIPANT_IDS.join(', ')}] may participate in global routing precedence)`,
    );
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

  // Semantic check 5: Context field vocabulary validation on condition predicates
  const fieldMap =
    options.contextFieldMap ||
    loadContextFieldVocabulary(options.rootDir || REPO_ROOT).fieldMap;
  errors.push(...validateContractContextFields(contract, expectedId, fieldMap));

  // Semantic check 6: Capability tier alignment against runtime-capability-policy.json
  if (options.capabilityPolicyMap instanceof Map && options.capabilityPolicyMap.has(expectedId)) {
    const policyEntry = options.capabilityPolicyMap.get(expectedId);
    if (contract.capabilityTier !== policyEntry.capabilityTier) {
      errors.push(
        `${prefix} at /capabilityTier (capabilityTier): contract capabilityTier '${contract.capabilityTier}' does not match registry/runtime-capability-policy.json capabilityTier '${policyEntry.capabilityTier}'`,
      );
    }
  } else if (contract.capabilityTier && contract.capabilityTier !== 'L0') {
    errors.push(
      `${prefix} at /capabilityTier (capabilityTier): BlendOps content/governance contracts must declare capabilityTier 'L0' (received '${contract.capabilityTier}')`,
    );
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
  const seenRoutingParticipants = new Set();

  for (const c of contracts) {
    if (!c || typeof c !== 'object') {
      errors.push("Contract '<unknown>' is missing a valid routingPrecedence object");
      continue;
    }

    const isParticipant = ROUTING_PARTICIPANT_SET.has(c.id);
    if (isParticipant) {
      seenRoutingParticipants.add(c.id);
      if (!c.routingPrecedence || typeof c.routingPrecedence !== 'object') {
        errors.push(`Contract '${c.id}' is missing a valid routingPrecedence object`);
        continue;
      }
      const g = c.routingPrecedence.group;
      if (!byGroup.has(g)) byGroup.set(g, []);
      byGroup.get(g).push(c);
    } else if (c.routingPrecedence !== undefined) {
      errors.push(
        `Specialist contract '${c.id || '<unknown>'}' must NOT declare routingPrecedence (only routing participants [${ROUTING_PARTICIPANT_IDS.join(', ')}] may participate in global routing precedence)`,
      );
    }
  }

  if (contracts.length >= 4) {
    for (const requiredId of ROUTING_PARTICIPANT_IDS) {
      if (!seenRoutingParticipants.has(requiredId)) {
        errors.push(
          `Missing required routing participant '${requiredId}' in precedence ladder`,
        );
      }
    }
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

  // Only the 4 routing participants with valid routingPrecedence participate in global precedence resolution
  const routingParticipants = contracts.filter(
    (c) =>
      c &&
      typeof c === 'object' &&
      ROUTING_PARTICIPANT_SET.has(c.id) &&
      c.routingPrecedence &&
      typeof c.routingPrecedence === 'object' &&
      Number.isInteger(c.routingPrecedence.rank),
  );

  const sorted = [...routingParticipants].sort(
    (a, b) => a.routingPrecedence.rank - b.routingPrecedence.rank,
  );
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

function loadCapabilityPolicyMap(rootDir) {
  const candidatePath = path.join(rootDir, 'registry', 'runtime-capability-policy.json');
  const policyPath = fs.existsSync(candidatePath)
    ? candidatePath
    : DEFAULT_CAPABILITY_POLICY_PATH;
  const map = new Map();
  if (!fs.existsSync(policyPath)) return map;
  try {
    const parsed = JSON.parse(fs.readFileSync(policyPath, 'utf8'));
    for (const s of parsed.skills || []) {
      if (s && typeof s.skillId === 'string') {
        map.set(s.skillId, s);
      }
    }
  } catch {
    // Validated separately by validate-capability-policy.mjs
  }
  return map;
}

export function buildRegistryArtifacts(rootDir) {
  const errors = [];
  const skillsDir = path.join(rootDir, 'skills');
  const schemaPath = path.join(rootDir, 'schemas', 'skill-contract.schema.json');
  const vocabSchemaPath = path.join(rootDir, 'schemas', 'contract-context-fields.schema.json');
  const vocabJsonPath = path.join(rootDir, 'registry', 'contract-context-fields.json');

  if (!fs.existsSync(schemaPath)) {
    errors.push('Missing schemas/skill-contract.schema.json');
  }

  const { fieldMap: contextFieldMap, errors: vocabErrors } = loadContextFieldVocabulary(rootDir);
  errors.push(...vocabErrors);

  const capabilityPolicyMap = loadCapabilityPolicyMap(rootDir);

  const catalogSkillIds = fs
    .readdirSync(skillsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== '_template')
    .map((d) => d.name)
    .filter((id) => fs.existsSync(path.join(skillsDir, id, 'SKILL.md')))
    .sort();

  const catalogSkillSet = new Set(catalogSkillIds);

  const contractedSkillIds = [];
  for (const id of catalogSkillIds) {
    const cPath = path.join(skillsDir, id, 'contract.json');
    if (fs.existsSync(cPath)) {
      contractedSkillIds.push(id);
    } else {
      errors.push(`Missing contract.json for catalog skill '${id}' (expected skills/${id}/contract.json)`);
    }
  }

  const contracts = [];
  const validContracts = [];
  const rawInputsForChecksum = [];

  if (fs.existsSync(schemaPath)) {
    rawInputsForChecksum.push(`schema:${fs.readFileSync(schemaPath, 'utf8').replace(/\r\n/g, '\n')}`);
  }
  if (fs.existsSync(vocabSchemaPath)) {
    rawInputsForChecksum.push(`vocabSchema:${fs.readFileSync(vocabSchemaPath, 'utf8').replace(/\r\n/g, '\n')}`);
  }
  if (fs.existsSync(vocabJsonPath)) {
    rawInputsForChecksum.push(`vocab:${fs.readFileSync(vocabJsonPath, 'utf8').replace(/\r\n/g, '\n')}`);
  }
  rawInputsForChecksum.push(`catalog:${catalogSkillIds.join(',')}`);

  for (const id of contractedSkillIds) {
    const cPath = path.join(skillsDir, id, 'contract.json');
    const rawTxt = fs.readFileSync(cPath, 'utf8').replace(/\r\n/g, '\n');
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
      {
        rootDir,
        contextFieldMap,
        capabilityPolicyMap,
      },
    );
    errors.push(...cErrors);
    contracts.push(parsed);
    if (cErrors.length === 0) {
      validContracts.push(parsed);
    }
  }

  // Cross-contract uniqueness checks: canonical role and global trigger uniqueness
  const seenRoles = new Map();
  const seenGlobalTriggers = new Map();
  for (const c of validContracts) {
    if (typeof c.role === 'string') {
      if (seenRoles.has(c.role)) {
        errors.push(
          `Duplicate contract role '${c.role}' between '${seenRoles.get(c.role)}' and '${c.id}'`,
        );
      } else {
        seenRoles.set(c.role, c.id);
      }
    }
    for (const t of c.triggers || []) {
      const norm = String(t).toLowerCase().trim();
      if (seenGlobalTriggers.has(norm) && seenGlobalTriggers.get(norm) !== c.id) {
        errors.push(
          `Duplicate trigger phrase '${t}' across contracts '${seenGlobalTriggers.get(norm)}' and '${c.id}'`,
        );
      } else {
        seenGlobalTriggers.set(norm, c.id);
      }
    }
  }

  errors.push(...validatePrecedenceLadder(validContracts));

  // Deterministic contract ordering: routing participants first by rank (1..4), then specialist skills lexicographically by id
  const sortedValidContracts = [...validContracts].sort((a, b) => {
    const aHasRank = Boolean(a.routingPrecedence && Number.isInteger(a.routingPrecedence.rank));
    const bHasRank = Boolean(b.routingPrecedence && Number.isInteger(b.routingPrecedence.rank));
    if (aHasRank && bHasRank) {
      return a.routingPrecedence.rank - b.routingPrecedence.rank;
    }
    if (aHasRank) return -1;
    if (bHasRank) return 1;
    return a.id.localeCompare(b.id);
  });

  const graphEdges = [];
  for (const c of sortedValidContracts) {
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

  const validContractMap = new Map(sortedValidContracts.map((c) => [c.id, c]));
  const catalogNodes = catalogSkillIds.map((id) => {
    const contract = validContractMap.get(id);
    return {
      id,
      status: contract ? 'contracted' : 'catalog-only',
      category: contract ? contract.category : null,
      role: contract ? contract.role : null,
      capabilityTier: contract?.capabilityTier || 'L0',
      isRoutingParticipant: Boolean(contract?.routingPrecedence),
      precedenceRank: contract?.routingPrecedence?.rank ?? null,
    };
  });

  const routingParticipantContracts = sortedValidContracts.filter((c) =>
    Boolean(c.routingPrecedence),
  );
  const uncontractedCount = catalogSkillIds.length - sortedValidContracts.length;
  const coverageMode =
    uncontractedCount === 0 && catalogSkillIds.length > 0 ? 'full-catalog' : 'routing-pilot';

  const skillsRegistry = {
    schemaVersion: '1.0.0',
    coverage: coverageMode,
    contractStatus: coverageMode,
    contractedSkills: sortedValidContracts.length,
    uncontractedSkills: uncontractedCount,
    catalogSkills: catalogSkillIds.length,
    routingPrecedenceParticipants: routingParticipantContracts.length,
    specialistContracts: sortedValidContracts.length - routingParticipantContracts.length,
    routingPrecedenceOrder: routingParticipantContracts.map((c) => c.id),
    sourceChecksum,
    skills: sortedValidContracts,
  };

  const workflowGraph = {
    schemaVersion: '1.0.0',
    coverage: coverageMode,
    contractedSkills: sortedValidContracts.length,
    uncontractedSkills: uncontractedCount,
    catalogSkills: catalogSkillIds.length,
    sourceChecksum,
    summary: {
      totalNodes: catalogNodes.length,
      contractedNodes: sortedValidContracts.length,
      catalogOnlyNodes: uncontractedCount,
      routingPrecedenceParticipants: routingParticipantContracts.length,
      specialistNodes: sortedValidContracts.length - routingParticipantContracts.length,
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
    const currentMd = fs.readFileSync(skillMdPath, 'utf8').replace(/\r\n/g, '\n');
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
    } else if (fs.readFileSync(skillsJsonPath, 'utf8').replace(/\r\n/g, '\n') !== expectedSkillsJson) {
      errors.push('Stale registry/skills.json does not match current contracts');
    }

    if (!fs.existsSync(graphJsonPath)) {
      errors.push('Missing registry/workflow-graph.json (run node scripts/build-registry.mjs)');
    } else if (fs.readFileSync(graphJsonPath, 'utf8').replace(/\r\n/g, '\n') !== expectedGraphJson) {
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
