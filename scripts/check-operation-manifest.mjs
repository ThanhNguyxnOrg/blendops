import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const EXPECTED_OPERATIONS = [
  'bridge.operations',
  'bridge.start',
  'bridge.stop',
  'bridge.logs',
  'undo.last',
  'batch.plan',
  'batch.execute',
  'scene.inspect',
  'scene.clear',
  'object.create',
  'object.transform',
  'material.create',
  'material.apply',
  'lighting.setup',
  'camera.set',
  'render.preview',
  'validate.scene',
  'export.asset',
];

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function ok(msg) {
  console.log(`✅ ${msg}`);
}

function fail(msg) {
  console.log(`❌ ${msg}`);
  return false;
}

function checkAddonManifest() {
  const addonPath = path.join(ROOT, 'apps/blender-addon/blendops_addon/__init__.py');
  if (!fs.existsSync(addonPath)) {
    return fail('addon __init__.py not found');
  }

  const content = readText(addonPath);
  let allOk = true;

  // Check OPERATION_MANIFEST contains each operation
  for (const op of EXPECTED_OPERATIONS) {
    const manifestPattern = new RegExp(`["']${op.replace('.', '\\.')}["']\\s*:\\s*\\{`, 'm');
    if (!manifestPattern.test(content)) {
      allOk = fail(`addon OPERATION_MANIFEST missing: ${op}`);
    }
  }

  // Check OPERATION_REGISTRY contains each operation (except bridge.status handled specially)
  const registryOps = EXPECTED_OPERATIONS.filter(op => op !== 'bridge.operations');
  for (const op of registryOps) {
    const registryPattern = new RegExp(`OPERATION_REGISTRY\\[["']${op.replace('.', '\\.')}["']\\]`, 'm');
    if (!registryPattern.test(content)) {
      allOk = fail(`addon OPERATION_REGISTRY missing: ${op}`);
    }
  }

  if (allOk) {
    ok('addon: all operations in OPERATION_MANIFEST and OPERATION_REGISTRY');
  }

  return allOk;
}

function checkCLICommands() {
  const cliPath = path.join(ROOT, 'apps/cli/src/index.ts');
  if (!fs.existsSync(cliPath)) {
    return fail('CLI index.ts not found');
  }

  const content = readText(cliPath);
  let allOk = true;

  const cliCommands = [
    { op: 'bridge.start', pattern: /group === ["']bridge["'] && action === ["']start["']/ },
    { op: 'bridge.stop', pattern: /group === ["']bridge["'] && action === ["']stop["']/ },
    { op: 'bridge.logs', pattern: /group === ["']bridge["'] && action === ["']logs["']/ },
    { op: 'bridge.status', pattern: /group === ["']bridge["'] && action === ["']status["']/ },
    { op: 'bridge.operations', pattern: /group === ["']bridge["'] && action === ["']operations["']/ },
    { op: 'undo.last', pattern: /group === ["']undo["'] && action === ["']last["']/ },
    { op: 'batch.plan', pattern: /group === ["']batch["'] && action === ["']plan["']/ },
    { op: 'batch.execute', pattern: /group === ["']batch["'] && action === ["']execute["']/ },
    { op: 'scene.inspect', pattern: /group === ["']scene["'] && action === ["']inspect["']/ },
    { op: 'scene.clear', pattern: /group === ["']scene["'] && action === ["']clear["']/ },
    { op: 'object.create', pattern: /group === ["']object["'] && action === ["']create["']/ },
    { op: 'object.transform', pattern: /group === ["']object["'] && action === ["']transform["']/ },
    { op: 'material.create', pattern: /group === ["']material["'] && action === ["']create["']/ },
    { op: 'material.apply', pattern: /group === ["']material["'] && action === ["']apply["']/ },
    { op: 'lighting.setup', pattern: /group === ["']lighting["'] && action === ["']setup["']/ },
    { op: 'camera.set', pattern: /group === ["']camera["'] && action === ["']set["']/ },
    { op: 'render.preview', pattern: /group === ["']render["'] && action === ["']preview["']/ },
    { op: 'validate.scene', pattern: /group === ["']validate["'] && action === ["']scene["']/ },
    { op: 'export.asset', pattern: /group === ["']export["'] && action === ["']asset["']/ },
  ];

  for (const { op, pattern } of cliCommands) {
    if (!pattern.test(content)) {
      allOk = fail(`CLI missing command handler: ${op}`);
    }
  }

  if (!content.includes('commandArgs.includes("--dry-run")')) {
    allOk = fail('CLI scene.clear missing --dry-run flag support');
  }

  if (allOk) {
    ok('CLI: all operation commands present');
  }

  return allOk;
}

function checkMCPTools() {
  const mcpPath = path.join(ROOT, 'apps/mcp-server/src/index.ts');
  if (!fs.existsSync(mcpPath)) {
    return fail('MCP server index.ts not found');
  }

  const content = readText(mcpPath);
  let allOk = true;

  const mcpTools = [
    'inspect_scene',
    'clear_scene',
    'undo_last',
    'plan_batch',
    'execute_batch',
    'list_operations',
    'start_bridge',
    'stop_bridge',
    'get_bridge_logs',
    'create_object',
    'transform_object',
    'create_material',
    'apply_material',
    'setup_lighting',
    'set_camera',
    'render_preview',
    'validate_scene',
    'export_asset',
  ];

  for (const tool of mcpTools) {
    const toolPattern = new RegExp(`name:\\s*["']${tool}["']`, 'm');
    if (!toolPattern.test(content)) {
      allOk = fail(`MCP ListTools missing: ${tool}`);
    }
  }

  // Check CallToolRequestSchema handlers
  for (const tool of mcpTools) {
    const handlerPattern = new RegExp(`name === ["']${tool}["']`, 'm');
    if (!handlerPattern.test(content)) {
      allOk = fail(`MCP CallTool handler missing: ${tool}`);
    }
  }

  const clearSceneDryRunPattern = /name:\s*["']clear_scene["'][\s\S]*?dry_run\s*:\s*\{\s*type:\s*["']boolean["']/m;
  if (!clearSceneDryRunPattern.test(content)) {
    allOk = fail('MCP clear_scene missing dry_run input support');
  }

  const executeBatchDryRunPattern = /name:\s*["']execute_batch["'][\s\S]*?dry_run\s*:\s*\{[\s\S]*?enum:\s*\[true\]/m;
  if (!executeBatchDryRunPattern.test(content)) {
    allOk = fail('MCP execute_batch missing dry_run=true input requirement');
  }

  if (allOk) {
    ok('MCP: all tools in ListTools and CallTool handlers');
  }

  return allOk;
}

function checkSchemas() {
  const schemaPath = path.join(ROOT, 'packages/schemas/src/index.ts');
  if (!fs.existsSync(schemaPath)) {
    return fail('schemas index.ts not found');
  }

  const content = readText(schemaPath);
  let allOk = true;

  const schemaOps = [
    'scene.inspect',
    'scene.clear',
    'bridge.operations',
    'bridge.start',
    'bridge.stop',
    'bridge.logs',
    'undo.last',
    'batch.plan',
    'batch.execute',
    'object.create',
    'object.transform',
    'material.create',
    'material.apply',
    'lighting.setup',
    'camera.set',
    'render.preview',
    'validate.scene',
    'export.asset',
  ];

  // Check BridgeCommandSchema discriminated union
  for (const op of schemaOps) {
    const schemaPattern = new RegExp(`z\\.literal\\(["']${op.replace('.', '\\.')}["']\\)`, 'm');
    if (!schemaPattern.test(content)) {
      allOk = fail(`schemas BridgeCommandSchema missing: ${op}`);
    }
  }

  const sceneClearRequestDryRunPattern = /SceneClearRequestSchema\s*=\s*z\.object\(\{[\s\S]*dry_run:\s*z\.boolean\(\)\.optional\(\)/m;
  if (!sceneClearRequestDryRunPattern.test(content)) {
    allOk = fail('schemas SceneClearRequestSchema missing dry_run');
  }

  const sceneClearDataDryRunPattern = /SceneClearDataSchema\s*=\s*z\.object\(\{[\s\S]*dry_run:\s*z\.boolean\(\)\.optional\(\)/m;
  if (!sceneClearDataDryRunPattern.test(content)) {
    allOk = fail('schemas SceneClearDataSchema missing dry_run');
  }

  const batchExecuteRequestDryRunPattern = /BatchExecuteRequestSchema\s*=\s*z\.object\(\{[\s\S]*operation:\s*z\.literal\(["']batch\.execute["']\)[\s\S]*dry_run:\s*z\.literal\(true\)/m;
  if (!batchExecuteRequestDryRunPattern.test(content)) {
    allOk = fail('schemas BatchExecuteRequestSchema missing dry_run=true requirement');
  }

  const batchExecuteDataPattern = /BatchExecuteDataSchema\s*=\s*z\.object\(\{[\s\S]*dry_run:\s*z\.literal\(true\)[\s\S]*executable:\s*z\.literal\(false\)[\s\S]*would_execute:/m;
  if (!batchExecuteDataPattern.test(content)) {
    allOk = fail('schemas BatchExecuteDataSchema missing dry_run/executable/would_execute fields');
  }

  if (allOk) {
    ok('schemas: all operations in BridgeCommandSchema union');
  }

  return allOk;
}

function checkCore() {
  const corePath = path.join(ROOT, 'packages/core/src/index.ts');
  if (!fs.existsSync(corePath)) {
    return fail('core index.ts not found');
  }

  const content = readText(corePath);
  let allOk = true;

  const coreMethods = [
    { op: 'bridge.status', method: 'status' },
    { op: 'bridge.operations', method: 'operations' },
    { op: 'bridge.start', method: 'startBridge' },
    { op: 'bridge.stop', method: 'stopBridge' },
    { op: 'bridge.logs', method: 'bridgeLogs' },
    { op: 'undo.last', method: 'undoLast' },
    { op: 'batch.plan', method: 'planBatch' },
    { op: 'batch.execute', method: 'executeBatch' },
    { op: 'scene.inspect', method: 'inspectScene' },
    { op: 'scene.clear', method: 'clearScene' },
    { op: 'object.create', method: 'createObject' },
    { op: 'object.transform', method: 'transformObject' },
    { op: 'material.create', method: 'createMaterial' },
    { op: 'material.apply', method: 'applyMaterial' },
    { op: 'lighting.setup', method: 'setupLighting' },
    { op: 'camera.set', method: 'setCamera' },
    { op: 'render.preview', method: 'renderPreview' },
    { op: 'validate.scene', method: 'validateScene' },
    { op: 'export.asset', method: 'exportAsset' },
  ];

  for (const { op, method } of coreMethods) {
    const methodPattern = new RegExp(`async ${method}\\(`, 'm');
    if (!methodPattern.test(content)) {
      allOk = fail(`core BridgeClient missing method: ${method} (${op})`);
    }
  }

  if (allOk) {
    ok('core: all BridgeClient methods present');
  }

  return allOk;
}

function checkBatchPlanStrictValidation() {
  let allOk = true;

  const addonPath = path.join(ROOT, 'apps/blender-addon/blendops_addon/__init__.py');
  const runtimeDocPath = path.join(ROOT, 'docs/runtime-smoke-test-batch-plan.md');
  const runtimeBatchExecuteDocPath = path.join(ROOT, 'docs/runtime-smoke-test-batch-execute-dry-run.md');
  const aiUsagePath = path.join(ROOT, 'docs/ai-agent-usage.md');
  const evalsPath = path.join(ROOT, 'docs/evals.md');
  const readmePath = path.join(ROOT, 'README.md');
  const manualTestPath = path.join(ROOT, 'docs/manual-test.md');
  const docsReadmePath = path.join(ROOT, 'docs/README.md');

  if (!fs.existsSync(addonPath)) {
    return fail('batch.plan strict validation check: addon __init__.py not found');
  }

  const addonContent = readText(addonPath);

  if (!addonContent.includes('BATCH_PLAN_FORBIDDEN_KEYS')) {
    allOk = fail('addon strict validation missing forbidden key list for batch.plan');
  }

  if (!addonContent.includes('def _batch_validate_step')) {
    allOk = fail('addon strict validation missing _batch_validate_step helper');
  }

  if (!addonContent.includes('validation_errors')) {
    allOk = fail('addon strict validation missing validation_errors response payload');
  }

  if (!addonContent.includes('def handle_batch_execute')) {
    allOk = fail('addon missing batch.execute dry-run handler');
  }

  if (!addonContent.includes('batch.execute requires dry_run=true')) {
    allOk = fail('addon batch.execute missing dry_run=true enforcement');
  }

  if (!addonContent.includes('"executable": False')) {
    allOk = fail('addon strict validation missing executable=false guarantee');
  }

  const examples = [
    'examples/batch/basic-scene.json',
    'examples/batch/invalid-arbitrary-code.json',
    'examples/batch/invalid-scene-clear.json',
    'examples/batch/invalid-object-create.json',
  ];

  for (const relativePath of examples) {
    const filePath = path.join(ROOT, relativePath);
    if (!fs.existsSync(filePath)) {
      allOk = fail(`batch.plan example missing: ${relativePath}`);
    }
  }

  if (!fs.existsSync(runtimeDocPath)) {
    allOk = fail('batch.plan runtime evidence doc missing');
  } else {
    const runtimeDoc = readText(runtimeDocPath);
    if (!runtimeDoc.includes('executable:false') && !runtimeDoc.includes('`data.executable: false`')) {
      allOk = fail('runtime doc missing executable:false mention for batch.plan');
    }
    if (!runtimeDoc.includes('No Blender operation execution') && !runtimeDoc.includes('plan-only')) {
      allOk = fail('runtime doc missing no-execution/plan-only statement');
    }
  }

  if (!fs.existsSync(aiUsagePath)) {
    allOk = fail('ai-agent usage doc missing');
  } else {
    const aiUsageDoc = readText(aiUsagePath);
    if (!aiUsageDoc.includes('validation_errors')) {
      allOk = fail('ai-agent usage doc missing validation_errors guidance for batch.plan');
    }
    if (!aiUsageDoc.includes('execute_batch') || !aiUsageDoc.includes('dry_run: true')) {
      allOk = fail('ai-agent usage doc missing execute_batch dry_run:true guidance');
    }
  }

  if (!fs.existsSync(evalsPath)) {
    allOk = fail('evals doc missing');
  } else {
    const evalsDoc = readText(evalsPath);
    if (!evalsDoc.includes('validation_errors')) {
      allOk = fail('evals doc missing strict batch.plan validation assertions');
    }
    if (!evalsDoc.includes('batch.execute dry-run eval')) {
      allOk = fail('evals doc missing batch.execute dry-run eval section');
    }
  }

  if (!fs.existsSync(runtimeBatchExecuteDocPath)) {
    allOk = fail('batch.execute dry-run runtime evidence doc missing');
  } else {
    const runtimeBatchExecuteDoc = readText(runtimeBatchExecuteDocPath);
    if (!runtimeBatchExecuteDoc.includes('Dry-run only') || !runtimeBatchExecuteDoc.includes('Real batch execution is not implemented')) {
      allOk = fail('batch.execute runtime doc missing dry-run only / not implemented statements');
    }
  }

  if (!fs.existsSync(readmePath)) {
    allOk = fail('README.md missing');
  } else {
    const readmeDoc = readText(readmePath);
    if (!readmeDoc.includes('batch.execute --dry-run')) {
      allOk = fail('README missing batch.execute --dry-run support statement');
    }
  }

  if (!fs.existsSync(manualTestPath)) {
    allOk = fail('manual-test doc missing');
  } else {
    const manualTestDoc = readText(manualTestPath);
    if (!manualTestDoc.includes('batch execute --file examples/batch/basic-scene.json --dry-run --verbose')) {
      allOk = fail('manual-test doc missing batch.execute dry-run command');
    }
    if (!manualTestDoc.includes('batch execute --file examples/batch/basic-scene.json --verbose')) {
      allOk = fail('manual-test doc missing batch.execute no-dry-run rejection command');
    }
  }

  if (!fs.existsSync(docsReadmePath)) {
    allOk = fail('docs/README.md missing');
  } else {
    const docsReadmeDoc = readText(docsReadmePath);
    if (!docsReadmeDoc.includes('runtime-smoke-test-batch-execute-dry-run.md')) {
      allOk = fail('docs/README missing batch.execute dry-run runtime evidence link');
    }
  }

  if (allOk) {
    ok('batch.plan/batch.execute strict validation checks passed (addon, examples, docs)');
  }

  return allOk;
}

function main() {
  console.log('Checking operation manifest parity...\n');

  const results = [
    checkAddonManifest(),
    checkCLICommands(),
    checkMCPTools(),
    checkSchemas(),
    checkCore(),
    checkBatchPlanStrictValidation(),
  ];

  console.log('');

  if (results.every(r => r)) {
    console.log('✅ operations:check passed');
    process.exit(0);
  } else {
    console.log('❌ operations:check failed');
    process.exit(1);
  }
}

main();
