import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCliFallbackEval } from './runtime-orchestrator.mjs';
import { compileExecutionPlan } from './compile-scene-plan.mjs';
import { generateGlbHandoffReportFromFileSync } from './generate-glb-handoff-report.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workDir = process.env.BLENDOPS_EVAL_DIR;
if (!workDir || !process.env.BLENDER_BIN) {
  throw new Error('Set BLENDOPS_EVAL_DIR to a new disposable directory and BLENDER_BIN to upstream Blender');
}
const sceneSpecPath = path.join(root, 'evals/scene-specs/hard-surface-mech-prop.scene-spec.json');
const result = runCliFallbackEval({
  sceneSpecPath,
  recipePath: path.join(root, 'evals/recipes/hard-surface-mech-prop.py'),
  workDir,
  blender: process.env.BLENDER_BIN,
});
fs.writeFileSync(path.join(workDir, 'execution-plan.json'), `${JSON.stringify(compileExecutionPlan(sceneSpecPath).plan, null, 2)}\n`);
fs.writeFileSync(path.join(workDir, 'runtime-result.json'), `${JSON.stringify(result, null, 2)}\n`);
if (result.ok) {
  const handoff = generateGlbHandoffReportFromFileSync(result.glbPath, {
    outDir: path.join(workDir, 'handoff'), strictPositionBounds: true,
    sourceKind: 'blender_export', currentRunProvenanceVerified: true,
    runtimePath: 'cli-appendix', runtimeStatus: 'Verified', artifactStatus: 'Verified',
  });
  if (!handoff.ok) throw new Error('GLB handoff report failed');
}
console.log(JSON.stringify({ ok: result.ok, glbPath: result.glbPath, bytes: result.glbBytes, sha256: result.glbSha256, rollback: result.rollback, error: result.error }, null, 2));
process.exitCode = result.ok ? 0 : 1;
