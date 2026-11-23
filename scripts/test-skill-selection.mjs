import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  loadSkills,
  loadCases,
  validateCases,
  baselineRouter,
  descriptionOverlap,
  scorePicks,
  promptPack,
  packKeys,
} from './run-skill-selection-eval.mjs';

const skills = loadSkills();
const cases = loadCases();
const ids = skills.map((s) => s.id);

test('skill selection cases are valid and cover every skill in both languages', () => {
  assert.deepEqual(validateCases(cases, ids), []);
  for (const id of ids) {
    const mine = cases.filter((c) => c.expected === id);
    assert.ok(mine.filter((c) => c.lang === 'en').length >= 3, `${id}: needs 3 English cases`);
    assert.ok(mine.some((c) => c.lang === 'vi'), `${id}: needs a Vietnamese case`);
  }
  assert.ok(cases.filter((c) => c.expected === null).length >= 5, 'needs out-of-scope cases');
});

test('validation rejects unknown skills, duplicate ids and bad alternates', () => {
  const bad = [
    { id: 'x', lang: 'en', prompt: 'p', expected: 'blendops-nope' },
    { id: 'x', lang: 'fr', prompt: ' ', expected: null, acceptable: ['blendops-start'] },
    { id: 'y', lang: 'en', prompt: 'p', expected: 'blendops-start', acceptable: ['blendops-start'] },
  ];
  const errors = validateCases(bad, ids).join('\n');
  for (const want of ['unknown skill', 'duplicate id', 'lang must be', 'empty prompt', 'bad acceptable']) assert.match(errors, new RegExp(want));
});

test('word-overlap baseline stays above its floor and no two descriptions read alike', () => {
  const route = baselineRouter(skills);
  const result = scorePicks(cases, Object.fromEntries(cases.map((c) => [c.id, route(c.prompt)])));
  assert.ok(result.accuracy >= 0.6, `baseline accuracy ${result.accuracy}`);
  assert.ok(result.falseTriggers <= 3, `baseline false triggers ${result.falseTriggers}`);
  const top = descriptionOverlap(skills)[0];
  assert.ok(top.overlap < 0.3, `${top.a} and ${top.b} descriptions overlap ${top.overlap}`);
});

test('agent responses are scored, with alternates and unanswered cases', () => {
  const perfect = Object.fromEntries(cases.map((c) => [c.id, c.expected]));
  assert.equal(scorePicks(cases, perfect).accuracy, 1);
  const alt = cases.find((c) => c.acceptable?.length);
  const r = scorePicks([alt], { [alt.id]: alt.acceptable[0] });
  assert.equal(r.accuracy, 1);
  const partial = scorePicks(cases, {});
  assert.equal(partial.answered, 0);
  assert.equal(partial.accuracy, 0);
  const none = cases.find((c) => c.expected === null);
  assert.equal(scorePicks([none], { [none.id]: 'blendops-start' }).falseTriggers, 1);
  const quoted = scorePicks([none], { [none.id]: 'null' });
  assert.equal(quoted.falseTriggers, 0);
  assert.equal(quoted.accuracy, 1);
  const blank = scorePicks([none], { [none.id]: '' });
  assert.equal(blank.answered, 0);
  assert.equal(blank.accuracy, 0);
});

test('prompt pack lists every skill and case, and the CLI scores a responses file', () => {
  const pack = promptPack(skills, cases);
  for (const s of skills) assert.ok(pack.includes(`- ${s.name}: ${s.description}`));
  const keys = packKeys(cases);
  for (const { key, case: c } of keys) assert.ok(pack.includes(`${key}: ${c.prompt}`));
  for (const c of cases) assert.ok(!pack.includes(c.id), `the pack must not show case id ${c.id}`);
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'selection-')), 'picks.json');
  fs.writeFileSync(file, JSON.stringify(Object.fromEntries(keys.map(({ key, case: c }) => [key, c.expected]))));
  const out = JSON.parse(execFileSync(process.execPath, ['scripts/run-skill-selection-eval.mjs', '--responses', file, '--json'], { encoding: 'utf8' }));
  assert.equal(out.accuracy, 1);
  assert.equal(out.cases, cases.length);
});
