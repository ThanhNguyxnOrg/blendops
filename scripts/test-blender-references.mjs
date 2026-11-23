// Runs the bpy examples in the build and look-check skill references inside a real Blender.
// Needs BLENDER=/path/to/blender; skipped without it. CI runs it on each supported Blender (.github/workflows/blender.yml).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inspectGlbFile } from './inspect-glb.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECKS = path.join(ROOT, 'evals', 'blender-checks');
const BUILD_REFS = path.join(ROOT, 'skills', 'blendops-build', 'references');
const SCENE_STATE = path.join(ROOT, 'skills', 'blendops-look-check', 'references', 'scene-state.md');
const BLENDER = process.env.BLENDER;
const skip = BLENDER ? false : 'set BLENDER to a Blender executable to run these checks';
const OUT = process.env.BLENDER_CHECK_OUT || fs.mkdtempSync(path.join(os.tmpdir(), 'blendops-blender-'));

function pythonBlocks(file) {
  const blocks = [];
  const re = /^```python\n([\s\S]*?)^```$/gm;
  for (const m of fs.readFileSync(file, 'utf8').matchAll(re)) blocks.push(m[1]);
  return blocks;
}

function blender(args, label) {
  const r = spawnSync(BLENDER, ['--background', '--factory-startup', '--python-exit-code', '1', ...args], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  assert.equal(r.status, 0, `${label}: Blender exited ${r.status}\n${r.stdout.slice(-4000)}\n${r.stderr.slice(-4000)}`);
  const line = r.stdout.split('\n').reverse().find((l) => l.startsWith('{"step"'));
  assert.ok(line, `${label}: no JSON report in Blender output\n${r.stdout.slice(-4000)}`);
  return JSON.parse(line);
}

function version() {
  const r = spawnSync(BLENDER, ['--background', '--factory-startup', '--version'], { encoding: 'utf8' });
  const m = /Blender (\d+)\.(\d+)/.exec(r.stdout);
  assert.ok(m, `could not read the Blender version:\n${r.stdout}${r.stderr}`);
  return [Number(m[1]), Number(m[2])];
}

// What each build reference must leave behind once all of its examples ran in order.
const BUILD_CHECKS = {
  'api-version-rules.md': 'bpy.context.scene.render.engine = eevee  # fails on an engine id this Blender does not know',
  'build-order.md': '',
  'lighting-camera.md': [
    'assert sorted(o.name for o in bpy.data.objects if o.type == "LIGHT") == ["Fill", "Key", "Rim"]',
    'assert cam.constraints[0].type == "TRACK_TO" and cam.constraints[0].target.name == "Shoe_Upper"',
    'assert d > 0',
  ].join('\n'),
  'materials.md': 'assert bpy.data.objects["Shoe_Upper"].active_material.name == "Leather_Black"',
  'modeling.md': [
    'from mathutils import Vector',
    'bpy.context.view_layer.update()',
    'body = bpy.data.objects["Crate_Body"]',
    'assert tuple(body.scale) == (1, 1, 1)',
    'assert abs(min((body.matrix_world @ Vector(c)).z for c in body.bound_box)) < 1e-6',
    'assert [m.type for m in bpy.data.objects["Plinth"].modifiers] == ["BEVEL", "WEIGHTED_NORMAL"]',
  ].join('\n'),
  'render-export.md': '',
};

test('every build reference with bpy examples is covered', { skip }, () => {
  const withCode = fs.readdirSync(BUILD_REFS).filter((f) => f !== 'scene-state.md' && pythonBlocks(path.join(BUILD_REFS, f)).length);
  assert.deepEqual(withCode.sort(), Object.keys(BUILD_CHECKS).sort());
});

for (const [file, check] of Object.entries(BUILD_CHECKS)) {
  test(`build reference examples run: ${file}`, { skip }, async () => {
    const out = path.join(OUT, 'build', path.basename(file, '.md'));
    fs.mkdirSync(out, { recursive: true });
    const job = path.join(out, 'job.json');
    fs.writeFileSync(job, JSON.stringify({ blocks: pythonBlocks(path.join(BUILD_REFS, file)), check, out_dir: out }));
    blender(['--python', path.join(CHECKS, 'run-snippets.py'), '--', job], file);
    if (file === 'render-export.md') {
      assert.ok(fs.statSync(path.join(out, 'preview.png')).size > 0, 'preview.png was not written');
      const glb = await inspectGlbFile(path.join(out, 'model.glb'));
      assert.equal(glb.valid, true, JSON.stringify(glb, null, 2));
      assert.equal(glb.counts.meshes, 2, 'the GLB should hold only the two planned meshes');
      assert.equal(glb.counts.nodes, 2, 'the GLB should leave out the camera and other objects');
    }
  });
}

// level:check:object for every issue the scene-state script must report on each test scene.
const SCENE1 = ['warn:floating:Floater', 'warn:normals_inward:Inverted', 'warn:empty_material_slot:Inverted', 'warn:floating_parts:Lamp'];
const SCENE_CASES = [
  { scene: 'scene1', plan: null, verdict: 'warn', issues: SCENE1 },
  {
    scene: 'scene1', plan: 'example', verdict: 'fail',
    issues: (v) => [...SCENE1, 'fail:exists:Shoe_Sole', 'fail:exists:Shoe_Upper', 'fail:extra_objects:', 'fail:light:Fill', 'fail:light:Rim',
      // the example plan uses the 5.x EEVEE id
      ...(v[0] < 5 ? ['fail:engine:'] : [])],
  },
  {
    scene: 'scene2', verdict: 'fail',
    plan: { objects: { Ring: [1.1, 1.1, 0.1], Scatter: [1.2, 1.2, 0.2], Heavy: [1, 1, 0] }, grounded: ['Ring', 'Scatter', 'Heavy'] },
    issues: ['warn:below_floor:Scatter', 'warn:floating:Heavy', 'fail:ground_contact:Scatter', 'fail:ground_contact:Heavy'],
    objects: { Ring: { type: 'CURVE', resting: 'floor' }, Scatter: { instances: 4 }, Heavy: { lowest_z_m: 0.3 } },
  },
  {
    scene: 'scene3', verdict: 'pass', plan: { objects: { CmBox: [1, 1, 1] }, grounded: ['CmBox'] }, issues: [],
    objects: { CmBox: { dimensions_m: [1, 1, 1], resting: 'floor' } },
  },
  {
    scene: 'scene4', verdict: 'fail',
    plan: {
      objects: Object.fromEntries(['Pebbles', 'Unshaded', 'Blob', 'Blob.001', 'Bar', 'NodeShaded', 'Foam.Left', 'Foam.Left.001', 'Lone', 'Lone.001']
        .map((n) => [n, n === 'Pebbles' || n === 'Bar' ? [0, 0, 0.2] : [0, 0, 0]])),
      grounded: ['Pebbles', 'Bar'], in_frame: ['Bar'],
    },
    issues: ['warn:floating_parts:Unshaded', 'fail:material:Unshaded', 'fail:geometry:Lone.001', 'fail:material:Lone.001'],
    objects: { Pebbles: { lowest_z_m: 0, resting: 'floor' }, Bar: { in_frame: 'in' } },
  },
  { scene: 'scene5', verdict: 'pass', plan: { objects: { Orb: [2, 2, 2] }, in_frame: ['Orb'] }, issues: [], objects: { Orb: { in_frame: 'in' } } },
];

test('scene-state reports the planted problems and nothing else', { skip }, () => {
  const v = version();
  const scenes = path.join(OUT, 'scene-state');
  blender(['--python', path.join(CHECKS, 'scene-state-scenes.py'), '--', scenes], 'scene-state-scenes.py');
  const blocks = pythonBlocks(SCENE_STATE);
  const [examplePlan, script] = [blocks[0], blocks.at(-1)];
  assert.match(script, /^PLAN = None.*$/m);
  for (const c of SCENE_CASES) {
    const plan = c.plan === 'example' ? examplePlan : c.plan ? `PLAN = ${JSON.stringify(c.plan)}` : 'PLAN = None';
    const name = `${c.scene}-${c.plan === 'example' ? 'example-plan' : c.plan ? 'plan' : 'no-plan'}`;
    const file = path.join(scenes, `${name}.py`);
    fs.writeFileSync(file, script.replace(/^PLAN = None.*$/m, () => plan));
    const report = blender([path.join(scenes, `${c.scene}.blend`), '--python', file], name);
    fs.writeFileSync(path.join(scenes, `${name}.json`), `${JSON.stringify(report, null, 2)}\n`);
    const got = report.issues.map((i) => `${i.level}:${i.check}:${i.object ?? ''}`).sort();
    const want = (typeof c.issues === 'function' ? c.issues(v) : c.issues).slice().sort();
    assert.deepEqual(got, want, `${name} issues`);
    assert.equal(report.verdict, c.verdict, `${name} verdict`);
    assert.equal(report.plan_checked, Boolean(c.plan), `${name} plan_checked`);
    for (const [obj, facts] of Object.entries(c.objects ?? {})) {
      const rec = report.objects.find((o) => o.name === obj);
      assert.ok(rec, `${name}: ${obj} missing from the report`);
      for (const [k, want] of Object.entries(facts)) assert.deepEqual(rec[k], want, `${name}: ${obj}.${k}`);
    }
  }
});

// Recipe walkthroughs: every step block runs in order, then scene-state checks the saved file
// against the walkthrough's own locked plan and the exported GLB is inspected.
const RECIPES = path.join(ROOT, 'docs', 'recipes');
const WALKTHROUGHS = {
  'sci-fi-crate-prop.md': {
    blend: 'crate.blend',
    files: ['preview.png', 'look-r1-camera.png', 'look-r1-front.png', 'look-r1-side.png'],
    glb: { file: 'crate.glb', meshes: 2, maxTriangles: 50000 },
  },
  'dusk-campsite-environment.md': {
    blend: 'campsite.blend',
    files: ['preview.png', 'look-r1-camera.png', 'look-r1-front.png', 'look-r1-side.png', 'campsite.png'],
    check: `import bpy
trees = [o for o in bpy.data.objects if o.name.startswith("Tree_")]
assert len(trees) == 8 and len({o.data.name for o in trees}) == 1, "trees must share one mesh"
`,
  },
  'chair-glb-web-handoff.md': {
    start: 'chair',
    before: { blend: 'chair-start.blend', issues: ['fail:scale_applied:Chair'] },
    blend: 'chair.blend',
    files: ['chair-backup.blend'],
    glb: { file: 'chair.glb', meshes: 2, maxTriangles: 100000 },
    check: `import bpy
assert tuple(bpy.data.objects["Chair"].scale) == (1.0, 1.0, 1.0)
assert not [n for n in bpy.data.objects["Chair"].active_material.node_tree.nodes if n.bl_idname == "ShaderNodeTexNoise"]
noise = lambda o: [n for n in o.active_material.node_tree.nodes if n.bl_idname == "ShaderNodeTexNoise"]
assert noise(bpy.data.objects["Chair_Old"]), "the hidden copy must keep its pattern"
c = bpy.data.objects["Cushion"]
zs = [(c.matrix_world @ v.co).z for v in c.data.vertices]
assert abs(min(zs) - 0.49) < 1e-4 and abs(max(zs) - 0.54) < 1e-4, "the cushion must keep its size and place"
`,
  },
};

function lockedPlan(file) {
  const m = /^## Plan[^\n]*\n[\s\S]*?^```json\n([\s\S]*?)^```$/m.exec(fs.readFileSync(file, 'utf8'));
  assert.ok(m, `${path.basename(file)}: no json block under "## Plan"`);
  return JSON.parse(m[1]);
}

test('every recipe walkthrough with bpy steps is covered', { skip }, () => {
  const withCode = fs.readdirSync(RECIPES).filter((f) => f.endsWith('.md') && pythonBlocks(path.join(RECIPES, f)).length);
  assert.deepEqual(withCode.sort(), Object.keys(WALKTHROUGHS).sort());
});

for (const [doc, want] of Object.entries(WALKTHROUGHS)) {
  test(`recipe walkthrough ${doc} runs and passes its own plan`, { skip }, async () => {
    const name = doc.replace(/\.md$/, '');
    const dir = path.join(OUT, 'recipes', name);
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(RECIPES, doc);
    const job = path.join(dir, 'job.json');
    fs.writeFileSync(job, JSON.stringify({ blocks: pythonBlocks(file), start: want.start ?? 'empty', check: want.check ?? '', out_dir: dir }));
    blender(['--python', path.join(CHECKS, 'run-walkthrough.py'), '--', job], name);
    for (const f of want.files) assert.ok(fs.statSync(path.join(dir, f)).size > 0, `${name}: ${f} missing`);

    const script = pythonBlocks(SCENE_STATE).at(-1);
    const stateFile = (label, plan) => {
      const p = path.join(dir, `scene-state-${label}.py`);
      fs.writeFileSync(p, script.replace(/^PLAN = None.*$/m, () => `PLAN = ${JSON.stringify(plan)}`));
      return p;
    };
    const plan = lockedPlan(file);
    if (want.before) {
      const report = blender([path.join(dir, want.before.blend), '--python', stateFile('before', plan)], `${name} before`);
      fs.writeFileSync(path.join(dir, 'scene-state-before.json'), `${JSON.stringify(report, null, 2)}\n`);
      assert.deepEqual(report.issues.map((i) => `${i.level}:${i.check}:${i.object ?? ''}`).sort(), want.before.issues.slice().sort(), `${name} issues before`);
    }
    const report = blender([path.join(dir, want.blend), '--python', stateFile('after', plan)], `${name} after`);
    fs.writeFileSync(path.join(dir, 'scene-state-after.json'), `${JSON.stringify(report, null, 2)}\n`);
    assert.deepEqual(report.issues.map((i) => `${i.level}:${i.check}:${i.object ?? ''}`), [], `${name} issues after`);
    assert.equal(report.verdict, 'pass', `${name} verdict`);

    if (!want.glb) return;
    const glb = await inspectGlbFile(path.join(dir, want.glb.file));
    assert.equal(glb.valid, true, JSON.stringify(glb, null, 2));
    assert.equal(glb.counts.meshes, want.glb.meshes, `${name}: GLB meshes`);
    if (want.glb.maxTriangles) assert.ok(glb.counts.trianglesEstimate <= want.glb.maxTriangles, `${name}: ${glb.counts.trianglesEstimate} triangles`);
  });
}
