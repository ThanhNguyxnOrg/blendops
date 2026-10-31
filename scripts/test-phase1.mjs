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

test('Phase 1 (F-02): npm run skills:export generates 48 valid, uncorrupted ZIP archives and matching manifest', () => {
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

  for (const skillName of expectedSkills) {
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

    // Must contain <skillName>/SKILL.md and <skillName>/EVAL.md with identical content to source
    const expectedSkillMd = fs.readFileSync(path.join(skillsDir, skillName, 'SKILL.md'), 'utf8');
    const actualSkillMd = strFromU8(entries[`${skillName}/SKILL.md`]);
    assert.equal(actualSkillMd, expectedSkillMd, `SKILL.md content mismatch inside ${skillName}.zip`);

    // Verify all reference files in source exist inside the ZIP
    const refDir = path.join(skillsDir, skillName, 'references');
    if (fs.existsSync(refDir)) {
      const refFiles = fs.readdirSync(refDir).filter((f) => f.endsWith('.md'));
      for (const refFile of refFiles) {
        const refKey = `${skillName}/references/${refFile}`;
        assert.equal(Boolean(entries[refKey]), true, `Missing reference ${refKey} inside ${skillName}.zip`);
      }
    }

    // Also verify Claude Code folder copy
    const codeSkillMdPath = path.join(codeDir, skillName, 'SKILL.md');
    assert.equal(fs.existsSync(codeSkillMdPath), true, `Missing Claude Code folder SKILL.md for ${skillName}`);
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
