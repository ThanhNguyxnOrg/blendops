import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DEFAULT_REPO_ROOT } from './constants.mjs';
import { sha256Buffer } from './path-safety.mjs';

export function compareCodeUnitOrder(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function assertCanonicalInsideRepoRoot(realRepoRoot, absPath, relLabel) {
  const realTarget = fs.realpathSync(absPath);
  const rel = path.relative(realRepoRoot, realTarget);
  if (rel === '' || rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error(
      `BlendOps source file escapes canonical repository root (${realRepoRoot}): ${relLabel}`,
    );
  }
}

export function computeBlendOpsSourceFingerprint(repoRoot = DEFAULT_REPO_ROOT) {
  if (!fs.existsSync(repoRoot)) {
    throw new Error(`Missing BlendOps repository root: ${repoRoot}`);
  }
  const realRepoRoot = fs.realpathSync(repoRoot);
  const requiredExactFiles = [
    'bundles/generic-project-local/BLENDOPS.md',
    'bundles/generic-project-local/ROLLBACK.md',
    'bundles/generic-project-local/INSTALL_REPORT_TEMPLATE.md',
    'bundles/generic-project-local/manifest.json',
    'bundles/claude-desktop-manual/manifest.json',
    'scripts/export-claude-skills.mjs',
  ];

  for (const rel of requiredExactFiles) {
    const abs = path.join(realRepoRoot, rel);
    if (!fs.existsSync(abs)) {
      throw new Error(`Missing required BlendOps source file: ${rel}`);
    }
    const lstat = fs.lstatSync(abs);
    if (lstat.isSymbolicLink() || !lstat.isFile()) {
      throw new Error(`Unsafe or non-regular BlendOps source file: ${rel}`);
    }
    assertCanonicalInsideRepoRoot(realRepoRoot, abs, rel);
    const content = fs.readFileSync(abs);
    if (content.length === 0) {
      throw new Error(`Empty required BlendOps source file: ${rel}`);
    }
    if (rel.endsWith('.json')) {
      let parsed;
      try {
        parsed = JSON.parse(content.toString('utf8'));
      } catch {
        throw new Error(`Malformed JSON in BlendOps source manifest: ${rel}`);
      }
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error(`Invalid BlendOps source manifest structure in ${rel}`);
      }
      if (
        rel === 'bundles/generic-project-local/manifest.json' &&
        (typeof parsed.target !== 'string' || !Array.isArray(parsed.files))
      ) {
        throw new Error(`Malformed generic-project-local manifest schema in ${rel}`);
      }
      if (
        rel === 'bundles/claude-desktop-manual/manifest.json' &&
        (typeof parsed.bundle_name !== 'string' ||
          typeof parsed.target !== 'string' ||
          !Array.isArray(parsed.files))
      ) {
        throw new Error(`Malformed claude-desktop-manual manifest schema in ${rel}`);
      }
    }
  }

  const collectedRelFiles = new Set(['scripts/export-claude-skills.mjs']);

  function walkSourceSubtree(relDir, { skipTopChildName = null } = {}) {
    const absDir = path.join(realRepoRoot, relDir);
    if (!fs.existsSync(absDir)) {
      throw new Error(`Missing required BlendOps source directory: ${relDir}`);
    }
    const dirLstat = fs.lstatSync(absDir);
    if (dirLstat.isSymbolicLink() || !dirLstat.isDirectory()) {
      throw new Error(`Unsafe or non-directory BlendOps source path: ${relDir}`);
    }
    assertCanonicalInsideRepoRoot(realRepoRoot, absDir, relDir);

    const entries = fs
      .readdirSync(absDir, { withFileTypes: true })
      .sort((a, b) => compareCodeUnitOrder(a.name, b.name));

    for (const entry of entries) {
      if (skipTopChildName && entry.name === skipTopChildName) {
        continue;
      }
      const childRel = `${relDir.replace(/\\/g, '/')}/${entry.name}`;
      const childAbs = path.join(absDir, entry.name);
      const childLstat = fs.lstatSync(childAbs);
      if (childLstat.isSymbolicLink()) {
        throw new Error(`Unsafe symbolic link in BlendOps source tree: ${childRel}`);
      }
      assertCanonicalInsideRepoRoot(realRepoRoot, childAbs, childRel);

      if (childLstat.isDirectory()) {
        walkSourceSubtree(childRel);
      } else if (childLstat.isFile()) {
        collectedRelFiles.add(childRel);
      } else {
        throw new Error(`Unsupported non-regular file in BlendOps source tree: ${childRel}`);
      }
    }
  }

  walkSourceSubtree('bundles/generic-project-local');
  walkSourceSubtree('bundles/claude-desktop-manual');
  walkSourceSubtree('skills', { skipTopChildName: '_template' });

  if (fs.existsSync(path.join(realRepoRoot, 'registry', 'knowledge-catalog.json'))) {
    walkSourceSubtree('registry');
    if (fs.existsSync(path.join(realRepoRoot, 'schemas'))) {
      walkSourceSubtree('schemas');
    }
    for (const extraScript of [
      'scripts/build-knowledge-catalog.mjs',
      'scripts/compile-scene-plan.mjs',
    ]) {
      const absExtra = path.join(realRepoRoot, extraScript);
      if (fs.existsSync(absExtra)) {
        const extraLstat = fs.lstatSync(absExtra);
        if (extraLstat.isSymbolicLink() || !extraLstat.isFile()) {
          throw new Error(`Unsafe or non-regular BlendOps source file: ${extraScript}`);
        }
        assertCanonicalInsideRepoRoot(realRepoRoot, absExtra, extraScript);
        collectedRelFiles.add(extraScript);
      }
    }
  }

  const skillsDir = path.join(realRepoRoot, 'skills');
  const skillDirs = fs
    .readdirSync(skillsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== '_template')
    .map((d) => d.name)
    .sort(compareCodeUnitOrder);
  if (skillDirs.length === 0) {
    throw new Error(`No canonical skills found in ${skillsDir}`);
  }

  const skillNames = [];
  for (const name of skillDirs) {
    const skillMdRel = `skills/${name}/SKILL.md`;
    const evalMdRel = `skills/${name}/EVAL.md`;
    const skillMdAbs = path.join(realRepoRoot, skillMdRel);
    const evalMdAbs = path.join(realRepoRoot, evalMdRel);
    if (!fs.existsSync(skillMdAbs)) {
      throw new Error(`Missing SKILL.md for canonical skill '${name}' in ${skillsDir}`);
    }
    if (!fs.existsSync(evalMdAbs)) {
      throw new Error(`Missing EVAL.md for canonical skill '${name}' in ${skillsDir}`);
    }
    skillNames.push(name);
  }

  const sortedRelFiles = [...collectedRelFiles].sort(compareCodeUnitOrder);
  const hash = crypto.createHash('sha256');
  for (const relPosix of sortedRelFiles) {
    const absFile = path.join(realRepoRoot, relPosix);
    const content = fs.readFileSync(absFile);
    const fileDigest = sha256Buffer(content);
    hash.update(`file:${relPosix}:${content.length}:${fileDigest}\0`);
  }
  hash.update(`skills:${skillNames.length}:${skillNames.join(',')}\0`);

  return {
    fingerprint: hash.digest('hex'),
    skillCount: skillNames.length,
    skillNames,
    sourceFileCount: sortedRelFiles.length,
  };
}

export const SKILLS_LOCK_EXCLUDED_DIRS = new Set(['.git', '__pycache__', '__pypackages__']);

export function computeSkillEntriesLockHash(entries = []) {
  if (!Array.isArray(entries)) {
    throw new Error('computeSkillEntriesLockHash requires an array of { relPath, content } entries');
  }
  const normalized = [];
  for (const item of entries) {
    if (!item || typeof item.relPath !== 'string' || item.relPath.trim() === '') continue;
    const relPosix = item.relPath.replace(/\\/g, '/').replace(/^\/+/, '');
    const segments = relPosix.split('/').filter(Boolean);
    if (segments.length === 0) continue;
    if (segments.some((seg) => SKILLS_LOCK_EXCLUDED_DIRS.has(seg))) continue;
    const baseName = segments[segments.length - 1];
    if (baseName === 'metadata.json') continue;

    const rawBuf = Buffer.isBuffer(item.content)
      ? item.content
      : Buffer.from(String(item.content ?? ''), 'utf8');
    const isBinary = rawBuf.includes(0x00);
    const contentBuf = isBinary
      ? rawBuf
      : Buffer.from(rawBuf.toString('utf8').replace(/\r\n/g, '\n'), 'utf8');
    normalized.push({
      relPath: segments.join('/'),
      content: contentBuf,
    });
  }

  normalized.sort((a, b) => compareCodeUnitOrder(a.relPath, b.relPath));

  const hash = crypto.createHash('sha256');
  for (const file of normalized) {
    hash.update(Buffer.from(file.relPath, 'utf8'));
    hash.update(Buffer.from([0]));
    hash.update(Buffer.from(String(file.content.length), 'ascii'));
    hash.update(Buffer.from([0]));
    hash.update(file.content);
  }
  return hash.digest('hex');
}

export function computeSkillFolderLockHash(skillDir) {
  if (typeof skillDir !== 'string' || skillDir.trim() === '' || !fs.existsSync(skillDir)) {
    throw new Error(`Missing or invalid skill directory for lockfile hash: ${String(skillDir)}`);
  }
  const realSkillRoot = fs.realpathSync(skillDir);
  const rootStat = fs.lstatSync(realSkillRoot);
  if (!rootStat.isDirectory()) {
    throw new Error(`Skill path is not a directory: ${skillDir}`);
  }

  const entries = [];
  function walk(currDir, relPrefix) {
    const dirItems = fs
      .readdirSync(currDir, { withFileTypes: true })
      .sort((a, b) => compareCodeUnitOrder(a.name, b.name));
    for (const dirent of dirItems) {
      if (SKILLS_LOCK_EXCLUDED_DIRS.has(dirent.name)) continue;
      const childAbs = path.join(currDir, dirent.name);
      const childRel = relPrefix ? `${relPrefix}/${dirent.name}` : dirent.name;
      let lstat;
      try {
        lstat = fs.lstatSync(childAbs);
      } catch {
        continue;
      }
      if (lstat.isSymbolicLink()) {
        let targetReal;
        try {
          targetReal = fs.realpathSync(childAbs);
        } catch {
          // Skip broken symlinks per vercel-labs/skills Lockfile v2 spec
          continue;
        }
        const relToRoot = path.relative(realSkillRoot, targetReal);
        if (relToRoot === '' || relToRoot.startsWith('..') || path.isAbsolute(relToRoot)) {
          // Skip symlinks that escape the skill directory
          continue;
        }
        const targetStat = fs.statSync(targetReal);
        if (targetStat.isDirectory()) {
          walk(targetReal, childRel);
        } else if (targetStat.isFile() && dirent.name !== 'metadata.json') {
          entries.push({ relPath: childRel, content: fs.readFileSync(targetReal) });
        }
        continue;
      }
      if (lstat.isDirectory()) {
        walk(childAbs, childRel);
      } else if (lstat.isFile()) {
        if (dirent.name === 'metadata.json') continue;
        entries.push({ relPath: childRel, content: fs.readFileSync(childAbs) });
      }
    }
  }

  walk(realSkillRoot, '');
  return computeSkillEntriesLockHash(entries);
}

export function buildSkillsLockJsonV2(
  repoRoot = DEFAULT_REPO_ROOT,
  skillNames = null,
  options = {},
) {
  const realRepoRoot = fs.existsSync(repoRoot) ? fs.realpathSync(repoRoot) : path.resolve(repoRoot);
  const sourceSlug = options.source || 'ThanhNguyxnOrg/blendops';
  const sourceType = options.sourceType || 'github';
  const skillsRoot = path.join(realRepoRoot, 'skills');
  const targetNames =
    Array.isArray(skillNames) && skillNames.length > 0
      ? [...new Set(skillNames)].sort(compareCodeUnitOrder)
      : fs
          .readdirSync(skillsRoot, { withFileTypes: true })
          .filter((d) => d.isDirectory() && d.name !== '_template')
          .map((d) => d.name)
          .sort(compareCodeUnitOrder);

  const skillsObj = {};
  for (const name of targetNames) {
    const skillDirAbs = path.join(skillsRoot, name);
    const skillMdAbs = path.join(skillDirAbs, 'SKILL.md');
    if (!fs.existsSync(skillMdAbs)) {
      throw new Error(`Cannot build skills-lock.json v2: missing skills/${name}/SKILL.md`);
    }
    const computedHash = computeSkillFolderLockHash(skillDirAbs);
    skillsObj[name] = {
      source: sourceSlug,
      sourceType,
      skillPath: `skills/${name}/SKILL.md`,
      computedHash,
    };
  }

  return {
    version: 2,
    skills: skillsObj,
  };
}

export function validateSkillsShConfig(repoRoot = DEFAULT_REPO_ROOT) {
  const realRepoRoot = fs.existsSync(repoRoot) ? fs.realpathSync(repoRoot) : path.resolve(repoRoot);
  const configPath = path.join(realRepoRoot, 'skills.sh.json');
  const errors = [];
  if (!fs.existsSync(configPath)) {
    return {
      valid: false,
      errors: ['Missing skills.sh.json at ' + configPath],
      groupCount: 0,
      skillCount: 0,
      skills: [],
    };
  }

  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (err) {
    return {
      valid: false,
      errors: ['Invalid JSON in skills.sh.json: ' + err.message],
      groupCount: 0,
      skillCount: 0,
      skills: [],
    };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    errors.push('skills.sh.json root must be a JSON object');
    return { valid: false, errors, groupCount: 0, skillCount: 0, skills: [] };
  }

  const allowedRootKeys = new Set(['$schema', 'schema', 'notGrouped', 'groupings', 'paths']);
  for (const key of Object.keys(parsed)) {
    if (!allowedRootKeys.has(key)) errors.push('Unknown top-level property in skills.sh.json: ' + key);
  }

  if (parsed.$schema !== 'https://skills.sh/schemas/skills.sh.schema.json') {
    errors.push(
      "skills.sh.json $schema must be 'https://skills.sh/schemas/skills.sh.schema.json', got '" +
        String(parsed.$schema) + "'",
    );
  }

  // Upstream schema enum is exactly "top" | "bottom"; "hide" is not valid.
  if (
    parsed.notGrouped !== undefined &&
    parsed.notGrouped !== 'top' &&
    parsed.notGrouped !== 'bottom'
  ) {
    errors.push(
      "skills.sh.json notGrouped must be 'top' or 'bottom', got '" + String(parsed.notGrouped) + "'",
    );
  }

  if (
    !Array.isArray(parsed.groupings) ||
    parsed.groupings.length < 1 ||
    parsed.groupings.length > 50
  ) {
    errors.push('skills.sh.json groupings must be a non-empty array with 1..50 groups');
  }

  const skillsRoot = path.join(realRepoRoot, 'skills');
  const canonicalSkillDirs = new Set();
  if (!fs.existsSync(skillsRoot) || !fs.statSync(skillsRoot).isDirectory()) {
    errors.push('Missing canonical skills/ directory');
  } else {
    for (const entry of fs.readdirSync(skillsRoot, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name === '_template') continue;
      canonicalSkillDirs.add(entry.name);
      const skillFile = path.join(skillsRoot, entry.name, 'SKILL.md');
      if (!fs.existsSync(skillFile) || !fs.statSync(skillFile).isFile()) {
        errors.push("Canonical skill directory '" + entry.name + "' is missing SKILL.md");
      }
    }
  }

  const seenSkills = new Set();
  const seenTitles = new Set();
  for (const group of parsed.groupings || []) {
    if (!group || typeof group !== 'object' || Array.isArray(group)) {
      errors.push('Each entry in skills.sh.json groupings must be an object');
      continue;
    }

    for (const key of Object.keys(group)) {
      if (!['title', 'description', 'skills'].includes(key)) {
        errors.push("Unknown property '" + key + "' in skills.sh.json group");
      }
    }

    if (
      typeof group.title !== 'string' ||
      group.title.trim().length === 0 ||
      group.title.length > 120
    ) {
      errors.push('Every group title must be a non-empty string of at most 120 characters');
    } else if (seenTitles.has(group.title.trim())) {
      errors.push("Duplicate group title in skills.sh.json: '" + group.title.trim() + "'");
    } else {
      seenTitles.add(group.title.trim());
    }

    if (
      group.description !== undefined &&
      (typeof group.description !== 'string' || group.description.length > 500)
    ) {
      errors.push("Group '" + String(group.title) + "' description must be a string of at most 500 characters");
    }

    if (!Array.isArray(group.skills) || group.skills.length < 1 || group.skills.length > 500) {
      errors.push("Group '" + String(group.title) + "' must have 1..500 skill slugs");
      continue;
    }

    for (const slug of group.skills) {
      if (
        typeof slug !== 'string' ||
        slug.length < 1 ||
        slug.length > 120 ||
        !/^[a-z0-9-]+$/.test(slug)
      ) {
        errors.push("Invalid skill slug '" + String(slug) + "' in group '" + String(group.title) + "'");
        continue;
      }
      if (seenSkills.has(slug)) errors.push("Duplicate skill slug '" + slug + "' across skills.sh.json groupings");
      seenSkills.add(slug);
      if (!canonicalSkillDirs.has(slug)) {
        errors.push("Skill slug '" + slug + "' in skills.sh.json does not exist under skills/" + slug + "/SKILL.md");
      }
    }
  }

  // BlendOps requires every canonical skill to have an explicit curated group.
  // Do not rely on skills.sh's generic notGrouped fallback for newly added skills.
  for (const canonical of [...canonicalSkillDirs].sort(compareCodeUnitOrder)) {
    if (!seenSkills.has(canonical)) {
      errors.push("Canonical skill '" + canonical + "' is missing from skills.sh.json groupings");
    }
  }

  if (parsed.paths !== undefined) {
    if (!Array.isArray(parsed.paths) || parsed.paths.length < 1) {
      errors.push('skills.sh.json paths must be a non-empty array when specified');
    } else {
      const seenPaths = new Set();
      for (const entry of parsed.paths) {
        if (typeof entry !== 'string' || !/^\.\/[^\\]+$/.test(entry)) {
          errors.push("Invalid skills.sh.json search path '" + String(entry) + "' (expected ./relative/path)");
          continue;
        }
        const segments = entry.slice(2).split('/');
        if (segments.some((segment) => !segment || segment === '.' || segment === '..')) {
          errors.push("Unsafe skills.sh.json search path '" + entry + "'");
          continue;
        }
        if (seenPaths.has(entry)) errors.push("Duplicate skills.sh.json search path '" + entry + "'");
        seenPaths.add(entry);
        const resolved = path.resolve(realRepoRoot, entry.slice(2));
        const relative = path.relative(realRepoRoot, resolved);
        if (relative.startsWith('..') || path.isAbsolute(relative)) {
          errors.push("skills.sh.json search path escapes repository: '" + entry + "'");
        } else if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
          errors.push("skills.sh.json search path is not an existing directory: '" + entry + "'");
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    groupCount: Array.isArray(parsed.groupings) ? parsed.groupings.length : 0,
    skillCount: seenSkills.size,
    skills: [...seenSkills].sort(compareCodeUnitOrder),
  };
}
