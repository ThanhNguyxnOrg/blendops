import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCliFallbackEval } from './runtime-orchestrator.mjs';
import { buildMinimalValidGlbBuffer } from './inspect-glb.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function fixture(t, mode = 'success') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'blendops-cli-eval-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const blender = path.join(dir, 'blender.cjs');
  const baseline = 'BLENDER baseline scene';
  const glb = buildMinimalValidGlbBuffer().toString('base64');
  fs.writeFileSync(blender, `#!${process.execPath}
const fs = require('node:fs');
const path = require('node:path');
const script = process.argv.at(-1);
const dir = path.dirname(script);
const blend = path.join(dir, 'scene.blend');
if (script.endsWith('baseline.py')) fs.writeFileSync(blend, ${JSON.stringify(baseline)});
if (script.endsWith('recipe.py')) {
  if (fs.readFileSync(path.join(dir, 'checkpoint.blend'), 'utf8') !== ${JSON.stringify(baseline)}) process.exit(3);
  fs.writeFileSync(blend, 'MUTATED');
  if (${JSON.stringify(mode)} === 'failure') process.exit(7);
  if (${JSON.stringify(mode)} === 'delete-scene') { fs.rmSync(blend); process.exit(7); }
  if (${JSON.stringify(mode)} === 'missing-glb') process.exit(0);
  if (${JSON.stringify(mode)} === 'empty-glb') { fs.writeFileSync(path.join(dir, 'actuator.glb'), ''); process.exit(0); }
  fs.writeFileSync(path.join(dir, 'actuator.glb'), ${JSON.stringify(mode)} === 'bad-glb' ? Buffer.from('broken') : Buffer.from(${JSON.stringify(glb)}, 'base64'));
}
if (script.endsWith('readback.py') && fs.readFileSync(blend, 'utf8') !== ${JSON.stringify(baseline)}) process.exit(4);
`, { mode: 0o755 });
  return { blender: process.execPath, blenderArgs: [blender], sceneSpecPath: path.join(root, 'evals/scene-specs/hard-surface-mech-prop.scene-spec.json'), recipePath: path.join(dir, 'unused.py'), workDir: path.join(dir, 'run') };
}

test('invalid SceneSpec is rejected before launching Blender or creating a workspace', (t) => {
  const options = fixture(t);
  options.sceneSpecPath = path.join(root, 'evals/scene-specs/invalid-missing-required-fields.scene-spec.json');
  assert.throws(() => runCliFallbackEval(options), /rejected/);
  assert.equal(fs.existsSync(options.workDir), false);
});

test('checkpoint exists before mutation and a valid GLB is inspected', (t) => {
  const result = runCliFallbackEval(fixture(t));
  assert.equal(result.ok, true, result.error);
  assert.equal(fs.readFileSync(result.checkpointPath, 'utf8'), 'BLENDER baseline scene');
  assert.equal(result.inspection.valid, true);
  assert.equal(result.rollback, null);
});

test('injected Blender failure restores checkpoint bytes and independently reads back', (t) => {
  const result = runCliFallbackEval(fixture(t, 'failure'));
  assert.equal(result.ok, false);
  assert.match(result.error, /recipe failed/);
  assert.deepEqual(fs.readFileSync(result.blendPath), fs.readFileSync(result.checkpointPath));
  assert.equal(result.rollback.verified, true);
  assert.equal(result.commands.at(-1).args.at(-1).endsWith('readback.py'), true);
  assert.equal(fs.existsSync(result.glbPath), false);
});

test('GLB inspection failure rejects output and rolls back', (t) => {
  const result = runCliFallbackEval(fixture(t, 'bad-glb'));
  assert.equal(result.ok, false);
  assert.match(result.error, /GLB inspection failed/);
  assert.equal(result.rollback.verified, true);
  assert.equal(fs.existsSync(result.glbPath), false);
});

for (const mode of ['empty-glb', 'missing-glb']) {
  test(`${mode} rejects output and rolls back`, (t) => {
    const result = runCliFallbackEval(fixture(t, mode));
    assert.equal(result.ok, false);
    assert.equal(result.rollback.verified, true);
    assert.equal(fs.existsSync(result.glbPath), false);
  });
}

test('rollback restores the checkpoint when the failed recipe deleted the scene file', (t) => {
  const result = runCliFallbackEval(fixture(t, 'delete-scene'));
  assert.equal(result.ok, false);
  assert.equal(result.rollback.verified, true, result.rollback.error);
  assert.deepEqual(fs.readFileSync(result.blendPath), fs.readFileSync(result.checkpointPath));
});
