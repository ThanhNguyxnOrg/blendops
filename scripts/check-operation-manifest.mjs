import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const EXPECTED_OPERATIONS = [
  'bridge.operations',
  'bridge.start',
  'bridge.stop',
  'bridge.logs',
  'scene.inspect',
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
    { op: 'scene.inspect', pattern: /group === ["']scene["'] && action === ["']inspect["']/ },
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
    'bridge.operations',
    'bridge.start',
    'bridge.stop',
    'bridge.logs',
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
    { op: 'scene.inspect', method: 'inspectScene' },
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

function main() {
  console.log('Checking operation manifest parity...\n');

  const results = [
    checkAddonManifest(),
    checkCLICommands(),
    checkMCPTools(),
    checkSchemas(),
    checkCore(),
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
