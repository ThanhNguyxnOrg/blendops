import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { unzipSync, strFromU8 } from 'fflate';

const root = process.cwd();
const skillsDir = path.join(root, 'skills');
const outRoot = path.join(root, 'dist', 'claude-skills');
const desktopDir = path.join(outRoot, 'desktop-zips');
const codeDir = path.join(outRoot, 'claude-code-skills');

function listCanonicalSkills() {
  return fs
    .readdirSync(skillsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== '_template')
    .map((d) => d.name)
    .filter((name) => fs.existsSync(path.join(skillsDir, name, 'SKILL.md')))
    .sort();
}

test('Phase 1 (F-02): export-claude-skills.mjs does not invoke OS zip or powershell binaries', () => {
  const scriptSrc = fs.readFileSync(path.join(root, 'scripts', 'export-claude-skills.mjs'), 'utf8');
  assert.equal(/execFileSync|spawnSync|child_process/.test(scriptSrc), false, 'Exporter must not use child_process');
  assert.equal(/Compress-Archive/i.test(scriptSrc), false, 'Exporter must not invoke PowerShell Compress-Archive');
  assert.equal(scriptSrc.includes('fflate'), true, 'Exporter must use fflate');
});

test('Phase 1 & 2.1 (F-02 / Workstream C): npm run skills:export generates 48 valid ZIP archives with byte-identical SKILL.md, EVAL.md, and references', () => {
  execFileSync(process.execPath, [path.join(root, 'scripts', 'export-claude-skills.mjs')], {
    cwd: root,
    stdio: 'pipe',
  });

  const expectedSkills = listCanonicalSkills();
  assert.equal(expectedSkills.length, 48, 'Expected exactly 48 canonical skills');

  const manifestPath = path.join(outRoot, 'manifest.json');
  assert.equal(fs.existsSync(manifestPath), true, 'manifest.json must exist');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert.equal(manifest.skillCount, 48);
  assert.deepEqual(manifest.skills, expectedSkills);

  const zipFiles = fs.readdirSync(desktopDir).filter((f) => f.endsWith('.zip')).sort();
  assert.equal(zipFiles.length, 48, 'Expected 48 .zip files in dist/claude-skills/desktop-zips');
  assert.deepEqual(
    zipFiles,
    expectedSkills.map((s) => `${s}.zip`),
    'ZIP filenames must match the 48 canonical skills 1-to-1',
  );

  const codeDirs = fs
    .readdirSync(codeDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
  assert.deepEqual(codeDirs, expectedSkills, 'Claude Code exported directories must match the 48 canonical skills');

  for (const skillName of expectedSkills) {
    const srcSkillDir = path.join(skillsDir, skillName);
    const srcSkillMdPath = path.join(srcSkillDir, 'SKILL.md');
    const srcEvalMdPath = path.join(srcSkillDir, 'EVAL.md');

    assert.equal(fs.existsSync(srcSkillMdPath), true, `Missing source SKILL.md for ${skillName}`);
    assert.equal(fs.existsSync(srcEvalMdPath), true, `Missing source EVAL.md for ${skillName}`);

    const zipPath = path.join(desktopDir, `${skillName}.zip`);
    assert.equal(fs.existsSync(zipPath), true, `Missing ZIP for ${skillName}`);

    const zipBuf = fs.readFileSync(zipPath);
    const entries = unzipSync(new Uint8Array(zipBuf));
    const entryKeys = Object.keys(entries).sort();

    assert.equal(entryKeys.length > 0, true, `Empty ZIP archive for ${skillName}`);

    // Every entry inside <skill>.zip must be rooted under "<skillName>/"
    for (const key of entryKeys) {
      assert.equal(
        key.startsWith(`${skillName}/`),
        true,
        `ZIP entry "${key}" in ${skillName}.zip is not rooted under "${skillName}/"`,
      );
    }

    // 1. Verify <skillName>/SKILL.md exists and matches source byte-for-byte and text-for-text
    const skillMdKey = `${skillName}/SKILL.md`;
    assert.equal(Boolean(entries[skillMdKey]), true, `Missing ${skillMdKey} in ${skillName}.zip`);
    const expectedSkillMdBuf = fs.readFileSync(srcSkillMdPath);
    const actualSkillMdBuf = Buffer.from(entries[skillMdKey]);
    assert.equal(
      Buffer.compare(actualSkillMdBuf, expectedSkillMdBuf),
      0,
      `SKILL.md byte mismatch inside ${skillName}.zip`,
    );
    assert.equal(
      strFromU8(entries[skillMdKey]),
      expectedSkillMdBuf.toString('utf8'),
      `SKILL.md text mismatch inside ${skillName}.zip`,
    );

    // 2. Verify <skillName>/EVAL.md exists and matches source byte-for-byte and text-for-text
    const evalMdKey = `${skillName}/EVAL.md`;
    assert.equal(Boolean(entries[evalMdKey]), true, `Missing ${evalMdKey} in ${skillName}.zip`);
    const expectedEvalMdBuf = fs.readFileSync(srcEvalMdPath);
    const actualEvalMdBuf = Buffer.from(entries[evalMdKey]);
    assert.equal(
      Buffer.compare(actualEvalMdBuf, expectedEvalMdBuf),
      0,
      `EVAL.md byte mismatch inside ${skillName}.zip`,
    );
    assert.equal(
      strFromU8(entries[evalMdKey]),
      expectedEvalMdBuf.toString('utf8'),
      `EVAL.md text mismatch inside ${skillName}.zip`,
    );

    // 3. Verify all reference files in source exist inside the ZIP and match byte-for-byte
    const refDir = path.join(srcSkillDir, 'references');
    if (fs.existsSync(refDir)) {
      const refFiles = fs
        .readdirSync(refDir, { withFileTypes: true })
        .filter((d) => d.isFile())
        .map((d) => d.name)
        .sort();
      for (const refFile of refFiles) {
        const refKey = `${skillName}/references/${refFile}`;
        assert.equal(Boolean(entries[refKey]), true, `Missing reference ${refKey} inside ${skillName}.zip`);
        const expectedRefBuf = fs.readFileSync(path.join(refDir, refFile));
        const actualRefBuf = Buffer.from(entries[refKey]);
        assert.equal(
          Buffer.compare(actualRefBuf, expectedRefBuf),
          0,
          `Reference ${refKey} byte mismatch inside ${skillName}.zip`,
        );

        const codeRefPath = path.join(codeDir, skillName, 'references', refFile);
        assert.equal(fs.existsSync(codeRefPath), true, `Missing Claude Code reference ${codeRefPath}`);
        assert.equal(
          Buffer.compare(fs.readFileSync(codeRefPath), expectedRefBuf),
          0,
          `Claude Code reference byte mismatch for ${skillName}/references/${refFile}`,
        );
      }
    }

    // 4. Verify Claude Code folder copy for SKILL.md and EVAL.md
    const codeSkillMdPath = path.join(codeDir, skillName, 'SKILL.md');
    const codeEvalMdPath = path.join(codeDir, skillName, 'EVAL.md');
    assert.equal(fs.existsSync(codeSkillMdPath), true, `Missing Claude Code folder SKILL.md for ${skillName}`);
    assert.equal(fs.existsSync(codeEvalMdPath), true, `Missing Claude Code folder EVAL.md for ${skillName}`);
    assert.equal(
      Buffer.compare(fs.readFileSync(codeSkillMdPath), expectedSkillMdBuf),
      0,
      `Claude Code SKILL.md byte mismatch for ${skillName}`,
    );
    assert.equal(
      Buffer.compare(fs.readFileSync(codeEvalMdPath), expectedEvalMdBuf),
      0,
      `Claude Code EVAL.md byte mismatch for ${skillName}`,
    );
  }
});

test('Phase 1 (F-01): all 48 skills and _template separate Runtime status (Not Run) from Artifact status (Not Produced)', () => {
  const allDirs = [...listCanonicalSkills(), '_template'];
  for (const dir of allDirs) {
    const fPath = path.join(skillsDir, dir, 'SKILL.md');
    const txt = fs.readFileSync(fPath, 'utf8');
    const lines = txt.split(/\r?\n/);
    let heading = '';
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const hm = line.match(/^##\s+(.+?)\s*$/);
      if (hm) {
        heading = hm[1].trim();
        continue;
      }
      if (heading === 'Anti-patterns') continue;
      assert.equal(
        /^\s*(?:[-*]\s+)?Artifact status:\s*<?Not Run\b/i.test(line),
        false,
        `Found forbidden 'Artifact status: Not Run' in ${dir}/SKILL.md:${i + 1}: ${line}`,
      );
    }
  }
});
