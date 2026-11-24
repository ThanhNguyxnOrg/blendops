#!/usr/bin/env node
// Skill selection eval: does each request pick the right skill from name + description alone?
// Modes: default scores a deterministic word-overlap baseline; --responses <file> scores an
// agent's picks; --prompt-pack prints the prompt to give an agent for a live run.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const EVALS_REL = 'evals/skill-selection-evals.json';
export const MIN_SCORE = 1.5;

const STOP = new Set(
  ('a an and any are as at be before by can do does for from has have how i if in into is it its me my ' +
    'of on or our should so that the their them then there this to up use used using want we what when ' +
    'where which while who why will with you your blendops skill one too also just now not no all some ' +
    'is are was get got make made need needs go').split(' '),
);

export function tokenize(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 1 && !STOP.has(w))
    .map((w) => (w.length > 4 ? w.replace(/(ing|ed|es|s)$/, '') : w));
}

function frontmatter(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---/);
  const get = (k) => (m?.[1].match(new RegExp(`^${k}:\\s*(.*)$`, 'm')) || [])[1]?.trim() ?? '';
  return { name: get('name'), description: get('description') };
}

export function loadSkills(root = DEFAULT_ROOT) {
  const dir = path.join(root, 'skills');
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== '_template')
    .map((d) => ({ id: d.name, ...frontmatter(fs.readFileSync(path.join(dir, d.name, 'SKILL.md'), 'utf8')) }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function loadCases(root = DEFAULT_ROOT) {
  return JSON.parse(fs.readFileSync(path.join(root, EVALS_REL), 'utf8')).cases;
}

export function validateCases(cases, skillIds) {
  const errors = [];
  const ids = new Set(skillIds);
  const seen = new Set();
  for (const c of cases) {
    if (seen.has(c.id)) errors.push(`${c.id}: duplicate id`);
    seen.add(c.id);
    if (!['en', 'vi'].includes(c.lang)) errors.push(`${c.id}: lang must be en or vi`);
    if (typeof c.prompt !== 'string' || !c.prompt.trim()) errors.push(`${c.id}: empty prompt`);
    if (c.expected !== null && !ids.has(c.expected)) errors.push(`${c.id}: unknown skill ${c.expected}`);
    for (const a of c.acceptable ?? []) if (!ids.has(a) || a === c.expected) errors.push(`${c.id}: bad acceptable ${a}`);
  }
  return errors;
}

function vectors(skills) {
  const docs = skills.map((s) => tokenize(`${s.name.replace(/^blendops-/, '').replace(/-/g, ' ')} ${s.description}`));
  const df = new Map();
  for (const d of docs) for (const t of new Set(d)) df.set(t, (df.get(t) ?? 0) + 1);
  const idf = (t) => Math.log((skills.length + 1) / ((df.get(t) ?? 0) + 0.5));
  return { docs: docs.map((d) => new Set(d)), idf };
}

// Word-overlap baseline: sum of idf weights of request words found in a skill's name + description.
export function baselineRouter(skills) {
  const { docs, idf } = vectors(skills);
  return (prompt) => {
    const words = new Set(tokenize(prompt));
    const scored = skills
      .map((s, i) => ({ id: s.id, score: [...words].filter((w) => docs[i].has(w)).reduce((n, w) => n + idf(w), 0) }))
      .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
    return scored[0].score >= MIN_SCORE ? scored[0].id : null;
  };
}

export function descriptionOverlap(skills) {
  const { docs, idf } = vectors(skills);
  const pairs = [];
  for (let i = 0; i < skills.length; i += 1) {
    for (let j = i + 1; j < skills.length; j += 1) {
      const w = (set) => [...set].reduce((n, t) => n + idf(t), 0);
      const shared = new Set([...docs[i]].filter((t) => docs[j].has(t)));
      const union = new Set([...docs[i], ...docs[j]]);
      pairs.push({ a: skills[i].id, b: skills[j].id, overlap: +(w(shared) / w(union)).toFixed(3), shared: [...shared].sort() });
    }
  }
  return pairs.sort((x, y) => y.overlap - x.overlap);
}

export function scorePicks(cases, picks) {
  const rows = cases.map((c) => {
    const raw = typeof picks[c.id] === 'string' ? picks[c.id].trim() : picks[c.id];
    const pick = raw === '' ? undefined : typeof raw === 'string' && ['null', 'none'].includes(raw.toLowerCase()) ? null : raw;
    const ok = pick !== undefined && (pick === c.expected || (c.acceptable ?? []).includes(pick));
    return { id: c.id, lang: c.lang, expected: c.expected, pick: pick ?? null, answered: pick !== undefined, ok };
  });
  const rate = (rs) => (rs.length ? +(rs.filter((r) => r.ok).length / rs.length).toFixed(3) : null);
  const bySkill = {};
  for (const r of rows) {
    const k = r.expected ?? '(none)';
    bySkill[k] ??= { cases: 0, correct: 0 };
    bySkill[k].cases += 1;
    bySkill[k].correct += r.ok ? 1 : 0;
  }
  return {
    cases: rows.length,
    answered: rows.filter((r) => r.answered).length,
    accuracy: rate(rows),
    accuracyEn: rate(rows.filter((r) => r.lang === 'en')),
    accuracyVi: rate(rows.filter((r) => r.lang === 'vi')),
    falseTriggers: rows.filter((r) => r.expected === null && r.pick !== null).length,
    bySkill,
    misses: rows.filter((r) => !r.ok).map(({ id, expected, pick }) => ({ id, expected, pick })),
  };
}

// Case ids name the expected skill, so a live run sees opaque keys in a hash order instead.
export function packKeys(cases) {
  const hash = (id) => crypto.createHash('sha256').update(id).digest('hex');
  const ordered = [...cases].sort((a, b) => hash(a.id).localeCompare(hash(b.id)));
  const width = String(ordered.length).length;
  return ordered.map((c, i) => ({ key: `r${String(i + 1).padStart(width, '0')}`, case: c }));
}

export function picksFromPackAnswers(cases, answers) {
  return Object.fromEntries(
    packKeys(cases).filter(({ key }) => key in answers).map(({ key, case: c }) => [c.id, answers[key]]),
  );
}

export function promptPack(skills, cases) {
  return [
    'You can load one of these skills. You see only each skill\'s name and description.',
    '',
    ...skills.map((s) => `- ${s.name}: ${s.description}`),
    '',
    'For each request below, answer with the one skill you would load first, or null if none fits.',
    'Reply with JSON only, shaped {"<request key>": "<skill name>"}, using the JSON value null (not a string) when no skill fits.',
    '',
    ...packKeys(cases).map(({ key, case: c }) => `${key}: ${c.prompt}`),
    '',
  ].join('\n');
}

function main(argv) {
  const root = DEFAULT_ROOT;
  const skills = loadSkills(root);
  const cases = loadCases(root);
  const errors = validateCases(cases, skills.map((s) => s.id));
  if (errors.length) {
    console.error(errors.join('\n'));
    return 1;
  }
  if (argv.includes('--prompt-pack')) {
    process.stdout.write(promptPack(skills, cases));
    return 0;
  }
  const ri = argv.indexOf('--responses');
  let picks;
  let mode = 'word-overlap baseline';
  if (ri !== -1) {
    const raw = JSON.parse(fs.readFileSync(argv[ri + 1], 'utf8'));
    picks = picksFromPackAnswers(cases, raw.cases ?? raw);
    mode = `responses from ${argv[ri + 1]}`;
  } else {
    const route = baselineRouter(skills);
    picks = Object.fromEntries(cases.map((c) => [c.id, route(c.prompt)]));
  }
  const result = { mode, ...scorePicks(cases, picks), topOverlap: descriptionOverlap(skills).slice(0, 5) };
  if (argv.includes('--json')) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`Skill selection (${mode}): ${result.cases} cases, accuracy ${result.accuracy} (en ${result.accuracyEn}, vi ${result.accuracyVi}), false triggers ${result.falseTriggers}`);
    for (const m of result.misses) console.log(`  miss ${m.id}: expected ${m.expected}, picked ${m.pick}`);
    console.log('Most similar descriptions:');
    for (const p of result.topOverlap) console.log(`  ${p.overlap} ${p.a} ~ ${p.b} (${p.shared.join(', ')})`);
  }
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
