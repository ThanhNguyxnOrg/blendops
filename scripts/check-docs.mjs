import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DOCS_DIR = path.join(ROOT, 'docs');

const REQUIRED_FILES = [
  'README.md',
  'TODO.md',
  'docs/INDEX.md',
  'docs/prior-art.md',
  'docs/manual-test.md',
  'docs/observability.md',
  'docs/evals.md',
  'docs/runtime-smoke-test-export.md',
];

const FORBIDDEN_PHRASES = [
  'background GLB PASS',
  'background GLTF PASS',
  'arbitrary Python supported',
  'Co-authored-by',
  'Sisyphus',
  'Ultraworked',
];

const EXPORT_REQUIRED_PHRASES = [
  'GUI bridge',
  'GLB',
  'Blender 4.2',
  'background',
];

const GENERATED_ARTIFACT_COMMIT_CLAIMS = [
  'exports/test_scene.glb is committed',
  'committed generated export',
  'commit renders/preview.png',
];


function toPosix(p) {
  return p.split(path.sep).join('/');
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function listMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const results = [];

  function walk(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }
      if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
        results.push(fullPath);
      }
    }
  }

  walk(dir);
  return results;
}

function hasUnclosedCodeFence(content) {
  const lines = content.split(/\r?\n/);
  let fenceCount = 0;
  for (const line of lines) {
    if (line.trimStart().startsWith('```')) {
      fenceCount += 1;
    }
  }
  return fenceCount % 2 !== 0;
}

function main() {
  let failed = false;
  const issues = [];

  function ok(msg) {
    console.log(`✅ ${msg}`);
  }

  function fail(msg) {
    failed = true;
    issues.push(msg);
    console.log(`❌ ${msg}`);
  }

  // 1) Required files
  for (const relPath of REQUIRED_FILES) {
    const absPath = path.join(ROOT, relPath);
    if (fs.existsSync(absPath)) {
      ok(`required file exists: ${relPath}`);
    } else {
      fail(`missing required file: ${relPath}`);
    }
  }

  // Gather markdown docs for checks
  const markdownFiles = [
    path.join(ROOT, 'README.md'),
    path.join(ROOT, 'TODO.md'),
    ...listMarkdownFiles(DOCS_DIR),
  ].filter((p) => fs.existsSync(p));

  // 2) Empty file / merge markers / unclosed fences / forbidden phrases / committed artifact claims
  for (const filePath of markdownFiles) {
    const rel = toPosix(path.relative(ROOT, filePath));
    const content = readText(filePath);

    if (content.trim().length === 0) {
      fail(`${rel}: file is empty`);
      continue;
    }

    if (hasUnclosedCodeFence(content)) {
      fail(`${rel}: unclosed fenced code block detected`);
    }

    if (content.includes('<<<<<<<')) {
      fail(`${rel}: unresolved merge marker found (<<<<<<<)`);
    }

    const separatorMatches = content.match(/^=======\s*$/gm) ?? [];
    if (separatorMatches.length > 0) {
      fail(`${rel}: unresolved merge marker found (======= line)`);
    }

    if (content.includes('>>>>>>>')) {
      fail(`${rel}: unresolved merge marker found (>>>>>>>)`);
    }

    for (const phrase of FORBIDDEN_PHRASES) {
      if (content.includes(phrase)) {
        fail(`${rel}: forbidden phrase found ("${phrase}")`);
      }
    }

    for (const phrase of GENERATED_ARTIFACT_COMMIT_CLAIMS) {
      if (content.includes(phrase)) {
        fail(`${rel}: generated artifact appears committed claim found ("${phrase}")`);
      }
    }

    ok(`${rel}: markdown checks passed`);
  }

  // 3) Export limitation consistency check
  const exportDocRel = 'docs/runtime-smoke-test-export.md';
  const exportDocPath = path.join(ROOT, exportDocRel);
  if (fs.existsSync(exportDocPath)) {
    const exportContent = readText(exportDocPath);
    for (const phrase of EXPORT_REQUIRED_PHRASES) {
      if (!exportContent.includes(phrase)) {
        fail(`${exportDocRel}: missing required export-context phrase ("${phrase}")`);
      }
    }
    ok(`${exportDocRel}: export limitation consistency phrases present`);
  }

  console.log('');
  if (failed) {
    console.log(`❌ docs:check failed with ${issues.length} issue(s)`);
    process.exit(1);
  }

  console.log('✅ docs:check passed');
  process.exit(0);
}

main();
