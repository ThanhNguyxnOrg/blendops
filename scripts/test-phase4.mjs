import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  REQUIRED_CORE_SKILL_HEADINGS,
  REQUIRED_EXTENDED_SKILL_HEADINGS,
  REQUIRED_SKILL_HEADINGS,
  extractNormalizedLevel2Headings,
  validateSkillMarkdownStructure,
  runDocsCheck,
} from './check-docs.mjs';
import {
  generateCurrentAuditArtifacts,
  scanSkillMarkdown,
  AUDITED_INPUTS_MANIFEST_REL,
} from './generate-current-audit.mjs';

const root = process.cwd();
const skillsDir = path.join(root, 'skills');

const ORIGINALLY_AFFECTED_SKILLS = [
  'acceptance-criteria-builder',
  'cli-appendix-job-outline',
  'pack-prerequisite-checker',
  'path-one-host-outline',
  'recipe-fit-assessor',
  'runtime-attempt-report-writer',
  'runtime-path-picker',
  'workflow-stage-router',
];

const EXPECTED_EXTENDED_HEADINGS = [
  'Decision tree',
  'Playbooks',
  'Failure handling',
  'Troubleshooting',
  'Best practices',
  'Good examples',
  'Bad examples',
  'User-facing response template',
  'Anti-patterns',
];

function listRealCatalogSkills(rootDir = root) {
  const dir = path.join(rootDir, 'skills');
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== '_template')
    .map((d) => d.name)
    .filter((name) => fs.existsSync(path.join(dir, name, 'SKILL.md')))
    .sort();
}

describe('Phase 4 — Catalog Template Completion & F-05 Resolution', () => {
  it('Scenario 1: all 48 catalog skills contain all 9 extended template sections and all 9 core sections', () => {
    const skills = listRealCatalogSkills(root);
    assert.equal(skills.length, 48, 'Expected exactly 48 real catalog skills');
    assert.deepEqual(
      REQUIRED_EXTENDED_SKILL_HEADINGS,
      EXPECTED_EXTENDED_HEADINGS,
      'REQUIRED_EXTENDED_SKILL_HEADINGS must match the 9 canonical extended sections',
    );
    assert.equal(REQUIRED_CORE_SKILL_HEADINGS.length, 9);
    assert.equal(REQUIRED_SKILL_HEADINGS.length, 18);

    for (const skillId of skills) {
      const relPath = `skills/${skillId}/SKILL.md`;
      const md = fs.readFileSync(path.join(root, relPath), 'utf8');
      const res = validateSkillMarkdownStructure(relPath, md, { isTemplate: false });
      assert.deepEqual(
        res.errors,
        [],
        `Expected ${relPath} to pass structural validation with 0 errors, got: ${res.errors.join('; ')}`,
      );
      for (const extHeading of EXPECTED_EXTENDED_HEADINGS) {
        assert.equal(
          res.headings.includes(extHeading),
          true,
          `Skill ${skillId} is missing extended heading "## ${extHeading}"`,
        );
      }
    }
  });

  it('Scenario 2: each of the 8 originally affected skills passes validation with substantive, role-specific content in all 9 extended sections', () => {
    assert.equal(ORIGINALLY_AFFECTED_SKILLS.length, 8);

    const decisionTrees = new Set();
    const responseTemplates = new Set();

    for (const skillId of ORIGINALLY_AFFECTED_SKILLS) {
      const relPath = `skills/${skillId}/SKILL.md`;
      const md = fs.readFileSync(path.join(root, relPath), 'utf8');
      const res = validateSkillMarkdownStructure(relPath, md, { isTemplate: false });
      assert.deepEqual(
        res.errors,
        [],
        `Originally affected skill ${skillId} failed validation: ${res.errors.join('; ')}`,
      );

      for (const extHeading of EXPECTED_EXTENDED_HEADINGS) {
        const body = (res.sectionBodies.get(extHeading) || '').trim();
        assert.ok(
          body.length >= 80,
          `Section "## ${extHeading}" in ${skillId} must have substantive content (>= 80 chars, got ${body.length})`,
        );
        assert.equal(
          /<step>|<condition>|TODO|TBD/i.test(body),
          false,
          `Section "## ${extHeading}" in ${skillId} must not contain template placeholders`,
        );
      }

      decisionTrees.add((res.sectionBodies.get('Decision tree') || '').trim());
      responseTemplates.add((res.sectionBodies.get('User-facing response template') || '').trim());
    }

    assert.equal(
      decisionTrees.size,
      8,
      'Each of the 8 affected skills must have a distinct, role-specific Decision tree',
    );
    assert.equal(
      responseTemplates.size,
      8,
      'Each of the 8 affected skills must have a distinct, role-specific User-facing response template',
    );
  });

  it('Scenario 3: removing a required heading from a real skill causes structural validation to fail', () => {
    const relPath = 'skills/acceptance-criteria-builder/SKILL.md';
    const originalMd = fs.readFileSync(path.join(root, relPath), 'utf8');

    for (const targetHeading of ['Decision tree', 'User-facing response template', 'Purpose']) {
      const mutatedMd = originalMd.replace(
        new RegExp(`^##\\s+${targetHeading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'm'),
        '### Demoted subsection',
      );
      const res = validateSkillMarkdownStructure(relPath, mutatedMd, { isTemplate: false });
      assert.equal(
        res.errors.some((e) => e.includes(`Missing required heading in ${relPath}: ## ${targetHeading}`)),
        true,
        `Removing "## ${targetHeading}" must produce a missing required heading error`,
      );
    }
  });

  it('Scenario 4: duplicating a required heading in a real skill causes structural validation to fail', () => {
    const relPath = 'skills/runtime-path-picker/SKILL.md';
    const originalMd = fs.readFileSync(path.join(root, relPath), 'utf8');
    const mutatedMd = `${originalMd}\n## Troubleshooting\n\nDuplicate troubleshooting section content for test.\n`;

    const res = validateSkillMarkdownStructure(relPath, mutatedMd, { isTemplate: false });
    assert.equal(
      res.errors.some((e) =>
        e.includes(`Duplicate required heading in ${relPath}: ## Troubleshooting`),
      ),
      true,
      'Duplicating a required heading must fail structural validation',
    );
  });

  it('Scenario 5: heading normalization handles whitespace cleanly and ignores headings inside fenced code blocks or HTML comments', () => {
    const sampleMd = [
      '---',
      'name: sample-skill',
      'description: Sample skill description for normalization testing.',
      '---',
      '',
      '# sample-skill',
      '',
      '##   Decision tree   ',
      '',
      '```md',
      '## Decision tree',
      '## Fake heading inside code fence',
      '```',
      '',
      '<!--',
      '## Decision tree',
      '-->',
      '',
      'Walk the decision branches carefully.',
    ].join('\n');

    const extracted = extractNormalizedLevel2Headings(sampleMd);
    assert.deepEqual(extracted.headings, ['Decision tree']);
    assert.equal(extracted.counts.get('Decision tree'), 1);
  });

  it('Scenario 6: template files, non-skill Markdown, and generated artifacts are not mistaken for real catalog skills', () => {
    const skills = listRealCatalogSkills(root);
    assert.equal(skills.includes('_template'), false, '_template must never be listed as a real catalog skill');
    assert.equal(skills.length, 48);

    const templatePath = 'skills/_template/SKILL.md';
    const templateMd = fs.readFileSync(path.join(root, templatePath), 'utf8');
    const templateRes = validateSkillMarkdownStructure(templatePath, templateMd, { isTemplate: true });
    assert.deepEqual(
      templateRes.errors,
      [],
      'skills/_template/SKILL.md must pass template structural heading check without triggering real-skill placeholder errors',
    );

    const docsCheckRes = runDocsCheck(root);
    assert.equal(docsCheckRes.ok, true, `runDocsCheck failed: ${docsCheckRes.errors.join('; ')}`);
    assert.equal(docsCheckRes.catalogSkillCount, 48);
  });

  it('Scenario 7: inventory counts in docs/audits/current/skill-inventory.json agree 100% with per-skill records', () => {
    const inv = JSON.parse(
      fs.readFileSync(path.join(root, 'docs', 'audits', 'current', 'skill-inventory.json'), 'utf8'),
    );
    assert.equal(inv.summary.totalSkills, 48);
    assert.equal(inv.skills.length, 48);

    const derivedMissingExtendedSkills = inv.skills.filter(
      (s) => Array.isArray(s.missingExtendedTemplateHeadings) && s.missingExtendedTemplateHeadings.length > 0,
    ).length;
    const derivedMissingExtendedInstances = inv.skills.reduce(
      (sum, s) => sum + (Array.isArray(s.missingExtendedTemplateHeadings) ? s.missingExtendedTemplateHeadings.length : 0),
      0,
    );
    const derivedMissingOtherSkills = inv.skills.filter(
      (s) => Array.isArray(s.missingOtherTemplateHeadings) && s.missingOtherTemplateHeadings.length > 0,
    ).length;
    const derivedMissingAnySkills = inv.skills.filter(
      (s) => Array.isArray(s.missingTemplateHeadings) && s.missingTemplateHeadings.length > 0,
    ).length;

    assert.equal(inv.summary.skillsMissingExtendedTemplateSections, 0);
    assert.equal(inv.summary.totalMissingExtendedSectionInstances, 0);
    assert.equal(inv.summary.skillsMissingExtendedTemplateSections, derivedMissingExtendedSkills);
    assert.equal(inv.summary.totalMissingExtendedSectionInstances, derivedMissingExtendedInstances);
    assert.equal(inv.summary.skillsMissingOtherTemplateSections, derivedMissingOtherSkills);
    assert.equal(inv.summary.skillsMissingAnyTemplateSections, derivedMissingAnySkills);

    for (const skill of inv.skills) {
      assert.deepEqual(
        skill.missingExtendedTemplateHeadings,
        [],
        `Expected 0 missingExtendedTemplateHeadings for ${skill.id}`,
      );
      assert.equal(
        skill.issues.some((issue) => /missing_\d+_template_sections|missing_extended_template_sections/.test(issue)),
        false,
        `Skill ${skill.id} must not retain stale missing template section issue flags`,
      );
    }
  });

  it('Scenario 8: F-05 status in findings.json is FIXED only when all 48 skills pass extended-section compliance and reverts to OPEN if a skill omits an extended section', () => {
    const currentFindings = JSON.parse(
      fs.readFileSync(path.join(root, 'docs', 'audits', 'current', 'findings.json'), 'utf8'),
    );
    const f05 = currentFindings.findings.find((f) => f.id === 'F-05');
    assert.ok(f05, 'F-05 must exist in findings.json');
    assert.equal(f05.currentLifecycleStatus, 'FIXED');
    assert.equal(f05.resolvedInPhase, 'Phase 4');

    // Verify statusBreakdown matches the actual findings array
    const breakdown = {
      FIXED: 0,
      PARTIALLY_FIXED: 0,
      OPEN: 0,
      REGRESSION: 0,
      DEFERRED: 0,
      NOT_APPLICABLE: 0,
      UNVERIFIED: 0,
    };
    for (const f of currentFindings.findings) {
      breakdown[f.currentLifecycleStatus] = (breakdown[f.currentLifecycleStatus] || 0) + 1;
    }
    assert.deepEqual(currentFindings.summary.statusBreakdown, breakdown);

    // Now test in an isolated temp repo that removing an extended heading causes F-05 to report OPEN
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'blendops-phase4-f05-'));
    try {
      for (const relDir of [
        path.join('docs', 'audits', 'phase-0'),
        'registry',
        'evals',
        'schemas',
        'skills',
      ]) {
        fs.cpSync(path.join(root, relDir), path.join(tempDir, relDir), { recursive: true });
      }
      fs.writeFileSync(
        path.join(tempDir, AUDITED_INPUTS_MANIFEST_REL),
        JSON.stringify(
          {
            schemaVersion: '1.0.0',
            requiredFiles: [AUDITED_INPUTS_MANIFEST_REL],
            requiredDirectories: ['docs/audits/phase-0', 'registry', 'evals', 'schemas', 'skills'],
          },
          null,
          2,
        ) + '\n',
        'utf8',
      );
      execFileSync('git', ['init', '-b', 'main'], { cwd: tempDir });
      execFileSync('git', ['config', 'user.name', 'Temp Tester'], { cwd: tempDir });
      execFileSync('git', ['config', 'user.email', 'tester@example.com'], { cwd: tempDir });
      execFileSync('git', ['add', '.'], { cwd: tempDir });
      execFileSync('git', ['commit', '-m', 'Initial temp commit'], { cwd: tempDir });

      // Remove "## Decision tree" and "## Playbooks" from one skill in tempDir
      const targetSkillFile = path.join(tempDir, 'skills', 'runtime-path-picker', 'SKILL.md');
      const txt = fs.readFileSync(targetSkillFile, 'utf8');
      const mutated = txt
        .replace(/^##\s+Decision tree\s*$/m, '### Decision tree')
        .replace(/^##\s+Playbooks\s*$/m, '### Playbooks');
      fs.writeFileSync(targetSkillFile, mutated, 'utf8');

      const generated = generateCurrentAuditArtifacts(tempDir);
      assert.equal(generated.currentSkillInventory.summary.skillsMissingExtendedTemplateSections, 1);
      assert.equal(generated.currentSkillInventory.summary.totalMissingExtendedSectionInstances, 2);
      const mutatedF05 = generated.findings.findings.find((f) => f.id === 'F-05');
      assert.equal(mutatedF05.currentLifecycleStatus, 'OPEN');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('Scenario 9: historical Phase 0 baseline artifacts remain unchanged at 54.5 / 100', () => {
    const baselineScorecard = JSON.parse(
      fs.readFileSync(path.join(root, 'docs', 'audits', 'phase-0', 'baseline-scorecard.json'), 'utf8'),
    );
    const phase0Inv = JSON.parse(
      fs.readFileSync(path.join(root, 'docs', 'audits', 'phase-0', 'skill-inventory.json'), 'utf8'),
    );
    assert.equal(baselineScorecard.commitSha, '3ea3c35c6b8a6e5e915bab9f63333d4a1c09bd4d');
    assert.equal(baselineScorecard.totals.measuredScore, 54.5);
    assert.equal(phase0Inv.summary.skillsMissingExtendedTemplateSections, 8);
    assert.equal(phase0Inv.summary.skillsWithArtifactNotRunContradiction, 30);

    const diffOut = execFileSync('git', ['diff', 'HEAD', '--', 'docs/audits/phase-0'], {
      cwd: root,
      encoding: 'utf8',
    });
    assert.equal(diffOut, '', 'docs/audits/phase-0/* must have zero diff against HEAD');
  });

  it('Scenario 10: all 48 skills preserve valid Anthropic frontmatter and resolvable relative links', () => {
    const skills = listRealCatalogSkills(root);
    for (const skillId of skills) {
      const info = scanSkillMarkdown(root, skillId);
      assert.equal(info.exists, true);
      assert.equal(info.hasArtifactNotRunOutsideAntiPatterns, false);
      const relPath = `skills/${skillId}/SKILL.md`;
      const txt = fs.readFileSync(path.join(root, relPath), 'utf8');
      const fmMatch = txt.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      assert.ok(fmMatch, `Missing frontmatter in ${relPath}`);
      const fm = fmMatch[1];
      const nameMatch = fm.match(/^name:\s*(.+)$/m);
      const descMatch = fm.match(/^description:\s*(.+)$/m);
      assert.ok(nameMatch, `Missing name in ${relPath}`);
      assert.ok(descMatch, `Missing description in ${relPath}`);
      assert.equal(nameMatch[1].trim(), skillId);
      assert.ok(descMatch[1].trim().length <= 200, `Description > 200 chars in ${relPath}`);
      assert.equal(/^(version|status|tags):/m.test(fm), false, `Forbidden frontmatter key in ${relPath}`);
    }
  });

  it('Scenario 11: routing pilot contracts and managed Markdown blocks remain synchronized', () => {
    const out = execFileSync(process.execPath, [path.join(root, 'scripts', 'build-registry.mjs'), '--check'], {
      cwd: root,
      encoding: 'utf8',
    });
    assert.match(out, /build-registry --check passed/i);
  });

  it('Scenario 12: evaluation suites and exporter remain green across all 48 skills', () => {
    const evalCheckOut = execFileSync(process.execPath, [path.join(root, 'scripts', 'run-evals.mjs'), '--check'], {
      cwd: root,
      encoding: 'utf8',
    });
    assert.match(evalCheckOut, /evals:check passed/i);

    const evalRunOut = execFileSync(process.execPath, [path.join(root, 'scripts', 'run-evals.mjs')], {
      cwd: root,
      encoding: 'utf8',
    });
    assert.match(evalRunOut, /269\/269 deterministic cases Passed/i);
  });
});
