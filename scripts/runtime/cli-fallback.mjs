// Part of the runtime orchestrator; scripts/runtime-orchestrator.mjs re-exports the public API.

import { compileExecutionPlan } from '../compile-scene-plan.mjs';
import path from 'node:path';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import { inspectGlbBuffer } from '../inspect-glb.mjs';
import { validateSafeBlendCheckpointPaths } from './qualification.mjs';

export function runCliFallbackEval({ sceneSpecPath, recipePath, workDir, blender = 'blender', blenderArgs = [] }) {
  const compiled = compileExecutionPlan(sceneSpecPath);
  if (!compiled.ok || !compiled.plan.can_proceed_to_runtime) {
    throw new Error(`SceneSpec/ExecutionPlan rejected: ${JSON.stringify(compiled.validation)}`);
  }
  if (!compiled.validation.spec.runtime_preference.allow_cli_fallback) {
    throw new Error('SceneSpec does not permit CLI fallback');
  }
  const dir = path.resolve(workDir);
  fs.mkdirSync(dir, { recursive: false });
  const blendPath = path.join(dir, 'scene.blend');
  const checkpointPath = path.join(dir, 'checkpoint.blend');
  const glbPath = path.join(dir, 'actuator.glb');
  const commands = [];
  const run = (name, source) => {
    const script = path.join(dir, `${name}.py`);
    fs.writeFileSync(script, source);
    const args = [...blenderArgs, '--background', '--factory-startup', '--python-exit-code', '1', '--python', script];
    const result = spawnSync(blender, args, { encoding: 'utf8', timeout: 300000, maxBuffer: 16 * 1024 * 1024 });
    commands.push({ executable: blender, args, status: result.status, stdout: result.stdout, stderr: result.stderr });
    if (result.error || result.status !== 0) throw new Error(`${name} failed: ${result.error?.message || result.stderr || result.stdout}`);
  };
  const isSymlink = (file) => { try { return fs.lstatSync(file).isSymbolicLink(); } catch { return false; } };
  const hash = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  const summaryPath = path.join(dir, 'baseline.json');
  const summaryExpression = "sorted((o.name, o.type) for o in bpy.data.objects)";
  run('baseline', `import bpy, json\nbpy.ops.wm.save_as_mainfile(filepath=${JSON.stringify(blendPath)})\njson.dump(${summaryExpression}, open(${JSON.stringify(summaryPath)}, 'w'))\n`);
  const safe = validateSafeBlendCheckpointPaths(blendPath, checkpointPath);
  if (!safe.valid) throw new Error(safe.reason);
  fs.copyFileSync(blendPath, checkpointPath, fs.constants.COPYFILE_EXCL);
  const checkpointSha256 = hash(checkpointPath);
  if (hash(blendPath) !== checkpointSha256) throw new Error('Checkpoint digest mismatch');
  const report = { ok: false, blendPath, checkpointPath, checkpointSha256, glbPath, commands, rollback: null };
  try {
    run('recipe', `import bpy\nbpy.ops.wm.open_mainfile(filepath=${JSON.stringify(blendPath)})\nGLB_PATH=${JSON.stringify(glbPath)}\nBLEND_PATH=${JSON.stringify(blendPath)}\nexec(compile(open(${JSON.stringify(path.resolve(recipePath))}).read(), ${JSON.stringify(path.resolve(recipePath))}, 'exec'))\n`);
    report.inspection = inspectGlbBuffer(fs.readFileSync(glbPath), { strictPositionBounds: true });
    if (!report.inspection.valid) throw new Error(`GLB inspection failed: ${report.inspection.errors.join('; ')}`);
    report.ok = true;
    report.glbSha256 = hash(glbPath);
    report.glbBytes = fs.statSync(glbPath).size;
  } catch (error) {
    report.error = error.message;
    try {
      const sceneMissing = !fs.existsSync(blendPath) && !isSymlink(blendPath);
      const safeRestore = sceneMissing
        ? validateSafeBlendCheckpointPaths(checkpointPath)
        : validateSafeBlendCheckpointPaths(blendPath, checkpointPath);
      if (!safeRestore.valid) throw new Error(safeRestore.reason);
      if (hash(checkpointPath) !== checkpointSha256) throw new Error('Checkpoint changed after mutation');
      fs.copyFileSync(checkpointPath, blendPath, sceneMissing ? fs.constants.COPYFILE_EXCL : 0);
      if (hash(blendPath) !== checkpointSha256) throw new Error('Restored digest mismatch');
      run('readback', `import bpy, json\nbpy.ops.wm.open_mainfile(filepath=${JSON.stringify(blendPath)})\nassert json.loads(json.dumps(${summaryExpression})) == json.load(open(${JSON.stringify(summaryPath)}))\n`);
      report.rollback = { verified: true, sha256: hash(blendPath) };
    } catch (restoreError) {
      report.rollback = { verified: false, error: restoreError.message, recoveryPath: checkpointPath };
    }
    fs.rmSync(glbPath, { force: true });
  }
  return report;
}
