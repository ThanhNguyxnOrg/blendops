import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DOCS_DIR = path.join(ROOT, "docs");
const EXAMPLES_DIR = path.join(ROOT, "examples");

const REQUIRED_FILES = [
  "README.md",
  "TODO.md",
  "docs/README.md",
  "docs/install.md",
  "docs/ai-agent-usage.md",
  "docs/prior-art.md",
  "docs/implementation-mining.md",
  "docs/manual-test.md",
  "docs/observability.md",
  "docs/evals.md",
  "docs/runtime-smoke-test-export.md",
];

const FORBIDDEN_PHRASES = [
  "background GLB PASS",
  "background GLTF PASS",
  "arbitrary Python supported",
  "Co-authored-by",
  "Sisyphus",
  "Ultraworked",
];

const EXPORT_REQUIRED_PHRASES = [
  "GUI bridge",
  "GLB",
  "Blender 4.2",
  "background",
];

const GENERATED_ARTIFACT_COMMIT_CLAIMS = [
  "exports/test_scene.glb is committed",
  "committed generated export",
  "commit renders/preview.png",
];

const BAD_BADGE_PATTERNS = [
  '">https://img.shields.io',
  '<img alt=',
];

const MARKDOWN_IMAGE_REGEX = /!?\[[^\]]*\]\(([^)]+)\)/g;
const HTML_IMG_SRC_REGEX = /<img\b[^>]*\bsrc\s*=\s*["'][^"']+["'][^>]*>/gi;

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
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
      if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
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
    if (line.trimStart().startsWith("```")) {
      fenceCount += 1;
    }
  }
  return fenceCount % 2 !== 0;
}

function normalizeLinkTarget(rawTarget) {
  const trimmed = rawTarget.trim();
  if (trimmed.length === 0) {
    return null;
  }

  let target = trimmed;
  if (target.startsWith("<") && target.endsWith(">")) {
    target = target.slice(1, -1).trim();
  }

  const spaceIndex = target.search(/\s/);
  if (spaceIndex >= 0) {
    target = target.slice(0, spaceIndex);
  }

  if (target.startsWith("#")) {
    return null;
  }

  if (/^(https?:|mailto:|data:)/i.test(target)) {
    return null;
  }

  if (target.startsWith("javascript:")) {
    return { invalid: true, value: target };
  }

  const hashIndex = target.indexOf("#");
  if (hashIndex >= 0) {
    target = target.slice(0, hashIndex);
  }

  if (target.length === 0) {
    return null;
  }

  return { invalid: false, value: target };
}

function extractMarkdownLinks(content) {
  const links = [];
  const regex = /!?\[[^\]]*\]\(([^)]+)\)/g;
  let match = regex.exec(content);

  while (match) {
    if (typeof match[1] === "string") {
      links.push(match[1]);
    }
    match = regex.exec(content);
  }

  return links;
}

function validateLocalLinks(filePath, content, fail, ok) {
  const rel = toPosix(path.relative(ROOT, filePath));
  const links = extractMarkdownLinks(content);

  for (const linkRaw of links) {
    const normalized = normalizeLinkTarget(linkRaw);
    if (normalized === null) {
      continue;
    }

    if (normalized.invalid) {
      fail(`${rel}: forbidden link target (${normalized.value})`);
      continue;
    }

    const resolved = path.resolve(path.dirname(filePath), normalized.value);
    if (!fs.existsSync(resolved)) {
      fail(`${rel}: broken local link -> ${normalized.value}`);
    }
  }

  ok(`${rel}: local link check passed`);
}

function validateBadgeSyntax(filePath, content, fail, ok) {
  const rel = toPosix(path.relative(ROOT, filePath));

  for (const pattern of BAD_BADGE_PATTERNS) {
    if (content.includes(pattern)) {
      fail(`${rel}: malformed badge/image syntax found (${pattern})`);
    }
  }

  const htmlWithoutSrc = content.match(/<img\b(?![^>]*\bsrc\s*=)[^>]*>/gi) ?? [];
  if (htmlWithoutSrc.length > 0) {
    fail(`${rel}: <img> tag without src attribute found`);
  }

  const markdownImageTargets = [];
  let markdownMatch = MARKDOWN_IMAGE_REGEX.exec(content);
  while (markdownMatch) {
    if (typeof markdownMatch[1] === "string") {
      markdownImageTargets.push(markdownMatch[1].trim());
    }
    markdownMatch = MARKDOWN_IMAGE_REGEX.exec(content);
  }
  MARKDOWN_IMAGE_REGEX.lastIndex = 0;

  const htmlImageTargets = [];
  let htmlMatch = HTML_IMG_SRC_REGEX.exec(content);
  while (htmlMatch) {
    const srcMatch = htmlMatch[0].match(/\bsrc\s*=\s*["']([^"']+)["']/i);
    if (srcMatch && typeof srcMatch[1] === "string") {
      htmlImageTargets.push(srcMatch[1].trim());
    }
    htmlMatch = HTML_IMG_SRC_REGEX.exec(content);
  }
  HTML_IMG_SRC_REGEX.lastIndex = 0;

  const shieldTargets = [...markdownImageTargets, ...htmlImageTargets].filter((target) => target.includes("img.shields.io"));
  const bareShieldUrlPattern = /(^|\s)(https?:\/\/img\.shields\.io\/[\S]+)/g;
  let bareMatch = bareShieldUrlPattern.exec(content);
  while (bareMatch) {
    const bareUrl = (bareMatch[2] ?? "").trim();
    if (!shieldTargets.includes(bareUrl)) {
      fail(`${rel}: bare shields URL outside Markdown image/HTML src (${bareUrl})`);
    }
    bareMatch = bareShieldUrlPattern.exec(content);
  }

  ok(`${rel}: badge syntax check passed`);
}

function main() {
  let failed = false;
  const issues = [];

  function ok(message) {
    console.log(`✅ ${message}`);
  }

  function fail(message) {
    failed = true;
    issues.push(message);
    console.log(`❌ ${message}`);
  }

  for (const relPath of REQUIRED_FILES) {
    const absPath = path.join(ROOT, relPath);
    if (fs.existsSync(absPath)) {
      ok(`required file exists: ${relPath}`);
    } else {
      fail(`missing required file: ${relPath}`);
    }
  }

  const markdownFiles = [
    path.join(ROOT, "README.md"),
    path.join(ROOT, "TODO.md"),
    ...listMarkdownFiles(DOCS_DIR),
    ...listMarkdownFiles(EXAMPLES_DIR),
  ].filter((filePath) => fs.existsSync(filePath));

  const seen = new Set();
  const uniqueMarkdownFiles = markdownFiles.filter((filePath) => {
    const normalized = path.resolve(filePath);
    if (seen.has(normalized)) {
      return false;
    }
    seen.add(normalized);
    return true;
  });

  for (const filePath of uniqueMarkdownFiles) {
    const rel = toPosix(path.relative(ROOT, filePath));
    const content = readText(filePath);

    if (content.trim().length === 0) {
      fail(`${rel}: file is empty`);
      continue;
    }

    if (hasUnclosedCodeFence(content)) {
      fail(`${rel}: unclosed fenced code block detected`);
    }

    if (content.includes("<<<<<<<")) {
      fail(`${rel}: unresolved merge marker found (<<<<<<<)`);
    }

    const separatorMatches = content.match(/^=======\s*$/gm) ?? [];
    if (separatorMatches.length > 0) {
      fail(`${rel}: unresolved merge marker found (======= line)`);
    }

    if (content.includes(">>>>>>>")) {
      fail(`${rel}: unresolved merge marker found (>>>>>>>)`);
    }

    for (const phrase of FORBIDDEN_PHRASES) {
      if (content.includes(phrase)) {
        fail(`${rel}: forbidden phrase found (\"${phrase}\")`);
      }
    }

    for (const phrase of GENERATED_ARTIFACT_COMMIT_CLAIMS) {
      if (content.includes(phrase)) {
        fail(`${rel}: generated artifact appears committed claim found (\"${phrase}\")`);
      }
    }

    ok(`${rel}: markdown checks passed`);
    validateBadgeSyntax(filePath, content, fail, ok);
    validateLocalLinks(filePath, content, fail, ok);
  }

  const exportDocRel = "docs/runtime-smoke-test-export.md";
  const exportDocPath = path.join(ROOT, exportDocRel);
  if (fs.existsSync(exportDocPath)) {
    const exportContent = readText(exportDocPath);
    for (const phrase of EXPORT_REQUIRED_PHRASES) {
      if (!exportContent.includes(phrase)) {
        fail(`${exportDocRel}: missing required export-context phrase (\"${phrase}\")`);
      }
    }
    ok(`${exportDocRel}: export limitation consistency phrases present`);
  }

  console.log("");
  if (failed) {
    console.log(`❌ docs:check failed with ${issues.length} issue(s)`);
    process.exit(1);
  }

  console.log("✅ docs:check passed");
  process.exit(0);
}

main();
