import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { buildSharedCatalogFilesMap } from '../build-knowledge-catalog.mjs';
import { AGENT_SKILLS_SH_DIRECTORY_MAP, DEFAULT_REPO_ROOT, INSTALLER_VERSION, SUPPORTED_TARGETS, TARGET_DETECTION_MARKERS } from './constants.mjs';
import { isGlobalAgentPath, resolveWithExistingAncestorRealpath, sha256Buffer, sha256String, validateSafeRelativeTargetFile } from './path-safety.mjs';
import { detectProjectTargetMarkers } from './args.mjs';
import { SKILLS_LOCK_EXCLUDED_DIRS, buildSkillsLockJsonV2, compareCodeUnitOrder, computeBlendOpsSourceFingerprint } from './source-fingerprint.mjs';
import { applyManagedBlockToDocument, buildCanonicalBlendOpsMd, buildCursorRuleMdcContent, buildCursorRuleMdcManagedBlock, buildManagedBlendOpsSection, inspectManagedMarkers } from './managed-blocks.mjs';
import { isSha256Hex, recoverPendingTransactionJournal, validateRollbackManifestSchema } from './rollback.mjs';

export function planSingleFileOperation(projectReal, relPath, desiredContent, options = {}) {
  const { norm, absTarget, exists } = validateSafeRelativeTargetFile(projectReal, relPath);
  const previousManifest = options.previousManifest || null;
  const initialFileContent =
    options.initialFileContent !== undefined ? options.initialFileContent : desiredContent;
  const extractedFromInitial = inspectManagedMarkers(initialFileContent);
  const canonicalManagedBlock = (
    options.managedBlock !== undefined
      ? options.managedBlock
      : extractedFromInitial.status === 'valid'
        ? extractedFromInitial.managedBlock
        : desiredContent
  ).trim();
  const desiredManagedBlockSha256 = sha256String(canonicalManagedBlock);

  const wasCreatedByInstaller = Boolean(
    previousManifest &&
      Array.isArray(previousManifest.files_created) &&
      previousManifest.files_created.includes(norm),
  );
  const wasModifiedByInstaller = Boolean(
    previousManifest &&
      Array.isArray(previousManifest.files_modified) &&
      previousManifest.files_modified.includes(norm),
  );
  const prevCreatedHash = wasCreatedByInstaller
    ? previousManifest.created_file_hashes?.[norm]
    : null;
  const prevModifiedMeta = wasModifiedByInstaller
    ? previousManifest.modified_file_hashes?.[norm]
    : null;

  if (!exists) {
    if (wasModifiedByInstaller) {
      throw new Error(
        `Refusing to modify '${norm}': previously modified target file is missing on disk; restore the file or run --rollback --force-rollback before re-running.`,
      );
    }
    const desiredBuf = Buffer.from(initialFileContent, 'utf8');
    const desiredSha256 = sha256Buffer(desiredBuf);
    return {
      action: 'create',
      path: norm,
      absPath: absTarget,
      desiredContent: initialFileContent,
      desiredSha256,
      desiredManagedBlockSha256,
      preExistingSha256: null,
      backupRelPath: null,
      transitionedFromCreated: false,
    };
  }

  const currentBuf = fs.readFileSync(absTarget);
  if (currentBuf.includes(0x00)) {
    throw new Error(
      `Refusing to modify binary or NUL-containing file '${norm}': preservation of user content cannot be guaranteed.`,
    );
  }
  const currentSha256 = sha256Buffer(currentBuf);
  const currentText = currentBuf.toString('utf8');

  const userEditedCreatedFile = Boolean(
    wasCreatedByInstaller && (!isSha256Hex(prevCreatedHash) || currentSha256 !== prevCreatedHash),
  );
  const userEditedModifiedFile = Boolean(
    wasModifiedByInstaller &&
      (!prevModifiedMeta ||
        !isSha256Hex(prevModifiedMeta.post_install_sha256) ||
        currentSha256 !== prevModifiedMeta.post_install_sha256),
  );

  const markerInfo = inspectManagedMarkers(currentText);
  if (markerInfo.status === 'malformed') {
    throw new Error(
      `Refusing to modify '${norm}': managed BlendOps section markers are malformed or duplicated (${markerInfo.reason}), so user edits cannot be safely preserved.`,
    );
  }

  if (markerInfo.status === 'none') {
    if (wasCreatedByInstaller || wasModifiedByInstaller) {
      throw new Error(
        `Refusing to modify '${norm}': file was modified after installation and its managed BlendOps section markers were removed, so user edits cannot be safely preserved.`,
      );
    }
  } else if (markerInfo.status === 'valid') {
    const currentManagedBlockHash = sha256String(markerInfo.managedBlock.trim());
    if (userEditedCreatedFile) {
      const expectedPrevManagedHash = previousManifest?.created_managed_block_hashes?.[norm];
      if (isSha256Hex(expectedPrevManagedHash) && currentManagedBlockHash !== expectedPrevManagedHash) {
        throw new Error(
          `Refusing to modify '${norm}': installer-created file was edited inside the managed BlendOps section, so preservation of user edits cannot be guaranteed.`,
        );
      }
      // Fallback check when created_managed_block_hashes was not recorded: if outside text matches initial template, edit was inside managed block
      const initialWithCurrentManaged = applyManagedBlockToDocument(
        initialFileContent,
        markerInfo.managedBlock,
        null,
      );
      if (currentText === initialWithCurrentManaged) {
        throw new Error(
          `Refusing to modify '${norm}': installer-created file was edited inside the managed BlendOps section, so preservation of user edits cannot be guaranteed.`,
        );
      }
    }
    if (userEditedModifiedFile) {
      throw new Error(
        `Refusing to modify '${norm}': file in files_modified was edited after installation (expected post-install SHA-256 ${prevModifiedMeta?.post_install_sha256?.slice(0, 12) || 'unknown'}, got ${currentSha256.slice(0, 12)}), so preserving both the original pre-install backup and new post-install user edits cannot be guaranteed.`,
      );
    }
  }

  const mergedText = applyManagedBlockToDocument(currentText, canonicalManagedBlock, null);
  const mergedBuf = Buffer.from(mergedText, 'utf8');
  const mergedSha256 = sha256Buffer(mergedBuf);
  const encodedBackupName = `${norm.replace(/\//g, '__')}.bak`;
  const backupRelPath = `.blendops/backups/${encodedBackupName}`;

  if (userEditedCreatedFile) {
    return {
      action: 'modify',
      path: norm,
      absPath: absTarget,
      desiredContent: mergedText,
      desiredSha256: mergedSha256,
      desiredManagedBlockSha256,
      preExistingSha256: currentSha256,
      backupRelPath,
      transitionedFromCreated: true,
    };
  }

  if (currentSha256 === mergedSha256 && currentBuf.equals(mergedBuf)) {
    return {
      action: 'skip',
      path: norm,
      absPath: absTarget,
      reason: 'Managed section already up to date (idempotent)',
      desiredContent: mergedText,
      desiredSha256: mergedSha256,
      desiredManagedBlockSha256,
      preExistingSha256: currentSha256,
      backupRelPath: null,
      transitionedFromCreated: false,
    };
  }

  return {
    action: 'modify',
    path: norm,
    absPath: absTarget,
    desiredContent: mergedText,
    desiredSha256: mergedSha256,
    desiredManagedBlockSha256,
    preExistingSha256: currentSha256,
    backupRelPath: wasCreatedByInstaller ? null : backupRelPath,
    transitionedFromCreated: false,
  };
}

export function planCatalogFileOperation(projectReal, relPath, desiredContent, previousManifest = null) {
  const { norm, absTarget, exists } = validateSafeRelativeTargetFile(projectReal, relPath);
  const desiredBuf = Buffer.from(desiredContent, 'utf8');
  const desiredSha256 = sha256Buffer(desiredBuf);

  const wasCreatedByInstaller = Boolean(
    previousManifest &&
      Array.isArray(previousManifest.files_created) &&
      previousManifest.files_created.includes(norm),
  );
  const prevCreatedHash = wasCreatedByInstaller
    ? previousManifest.created_file_hashes?.[norm]
    : null;

  if (!exists) {
    return {
      action: 'create',
      path: norm,
      absPath: absTarget,
      desiredContent,
      desiredSha256,
      desiredManagedBlockSha256: null,
      preExistingSha256: null,
      backupRelPath: null,
      transitionedFromCreated: false,
    };
  }

  const currentBuf = fs.readFileSync(absTarget);
  const currentSha256 = sha256Buffer(currentBuf);

  if (currentSha256 === desiredSha256 && currentBuf.equals(desiredBuf)) {
    return {
      action: 'skip',
      path: norm,
      absPath: absTarget,
      reason: 'Shared catalog file already up to date (idempotent)',
      desiredContent,
      desiredSha256,
      desiredManagedBlockSha256: null,
      preExistingSha256: currentSha256,
      backupRelPath: null,
      transitionedFromCreated: false,
    };
  }

  if (wasCreatedByInstaller && isSha256Hex(prevCreatedHash) && currentSha256 === prevCreatedHash) {
    return {
      action: 'modify',
      path: norm,
      absPath: absTarget,
      desiredContent,
      desiredSha256,
      desiredManagedBlockSha256: null,
      preExistingSha256: currentSha256,
      backupRelPath: null,
      transitionedFromCreated: false,
    };
  }

  throw new Error(
    `Refusing to overwrite modified or pre-existing catalog file '${norm}' (expected SHA-256 ${prevCreatedHash?.slice(0, 12) || 'none'}, got ${currentSha256.slice(0, 12)}). Run --rollback --force-rollback or inspect changes manually.`,
  );
}

export function captureTargetStateSnapshot(targetRootReal, candidateRelPaths, detectedMarkers) {
  const fileStates = {};
  const sortedPaths = [...new Set(candidateRelPaths)].sort();

  for (const relPath of sortedPaths) {
    const { norm, absTarget, exists } = validateSafeRelativeTargetFile(targetRootReal, relPath);
    if (!exists) {
      fileStates[norm] = { exists: false, sha256: null, size: 0 };
    } else {
      const buf = fs.readFileSync(absTarget);
      fileStates[norm] = {
        exists: true,
        sha256: sha256Buffer(buf),
        size: buf.length,
      };
    }
  }

  return {
    detectedMarkers: detectedMarkers.map((d) => ({
      target: d.target,
      markers: [...d.markers].sort(),
    })),
    fileStates,
  };
}

export function validatePlanStoreDirectory(
  rawPlanDir,
  { repoRootReal = DEFAULT_REPO_ROOT, targetRootReal = null } = {},
) {
  if (typeof rawPlanDir !== 'string' || rawPlanDir.trim().length === 0 || rawPlanDir.includes('\0')) {
    throw new Error('Invalid planDir path: must be a non-empty path string');
  }
  const trimmed = rawPlanDir.trim();
  if (trimmed === '~' || trimmed.startsWith('~/') || trimmed.startsWith('~\\')) {
    throw new Error(`Global home-directory planDir (${trimmed}) is rejected`);
  }
  if (/^[a-zA-Z]:[\\/]?$/.test(trimmed) || trimmed.startsWith('\\\\')) {
    throw new Error(`Unsafe planDir path (Windows drive root or UNC path is forbidden): ${rawPlanDir}`);
  }

  const normalizedInput = trimmed.replace(/\\/g, path.sep);
  const absCandidate = path.resolve(normalizedInput);
  const parsedRoot = path.parse(absCandidate).root;
  if (absCandidate === parsedRoot) {
    throw new Error(`Unsafe planDir path (filesystem root is forbidden): ${rawPlanDir}`);
  }

  const tmpResolved = path.resolve(os.tmpdir());
  const tmpReal = fs.existsSync(tmpResolved) ? fs.realpathSync(tmpResolved) : tmpResolved;
  const effectiveCandidate = resolveWithExistingAncestorRealpath(absCandidate);

  if (absCandidate === tmpResolved || effectiveCandidate === tmpReal) {
    throw new Error(`Unsafe planDir path (OS temp root itself is forbidden): ${rawPlanDir}`);
  }

  if (isGlobalAgentPath(absCandidate) || isGlobalAgentPath(effectiveCandidate)) {
    throw new Error(`Global configuration planDir (${rawPlanDir}) is rejected`);
  }

  const realRepo = fs.existsSync(repoRootReal) ? fs.realpathSync(repoRootReal) : path.resolve(repoRootReal);
  const relFromRepoToPlan = path.relative(realRepo, effectiveCandidate);
  const relFromPlanToRepo = path.relative(effectiveCandidate, realRepo);
  if (
    effectiveCandidate === realRepo ||
    (relFromRepoToPlan !== '' && !relFromRepoToPlan.startsWith('..') && !path.isAbsolute(relFromRepoToPlan)) ||
    (relFromPlanToRepo !== '' && !relFromPlanToRepo.startsWith('..') && !path.isAbsolute(relFromPlanToRepo))
  ) {
    throw new Error(
      `Unsafe planDir path (cannot be inside or an ancestor of the BlendOps repository root): ${rawPlanDir}`,
    );
  }

  if (targetRootReal) {
    const relFromTargetToPlan = path.relative(targetRootReal, effectiveCandidate);
    const relFromPlanToTarget = path.relative(effectiveCandidate, targetRootReal);
    if (
      effectiveCandidate === targetRootReal ||
      (relFromTargetToPlan !== '' &&
        !relFromTargetToPlan.startsWith('..') &&
        !path.isAbsolute(relFromTargetToPlan)) ||
      (relFromPlanToTarget !== '' &&
        !relFromPlanToTarget.startsWith('..') &&
        !path.isAbsolute(relFromPlanToTarget))
    ) {
      throw new Error(
        `Unsafe planDir path (cannot be inside or an ancestor of the target project/output root): ${rawPlanDir}`,
      );
    }
  }

  // Verify no existing segment from absCandidate up to its nearest existing directory is a symlink
  let cursor = absCandidate;
  while (true) {
    let lstat = null;
    try {
      lstat = fs.lstatSync(cursor);
    } catch (err) {
      if (!err || err.code !== 'ENOENT') {
        throw err;
      }
    }
    if (lstat) {
      if (lstat.isSymbolicLink()) {
        throw new Error(`Refusing symbolic link in planDir path: ${cursor}`);
      }
      if (!lstat.isDirectory()) {
        throw new Error(`Unsafe planDir path (existing non-directory at ${cursor})`);
      }
      break;
    }
    const parent = path.dirname(cursor);
    if (parent === cursor) break;
    cursor = parent;
  }

  return effectiveCandidate;
}

export function resolvePlanStorePath({
  planDir,
  repoRootReal,
  targetRootReal,
  requestedTarget,
}) {
  const defaultPlanDir = path.join(os.tmpdir(), 'blendops-installer-plans');
  const rawPlanDir = planDir || process.env.BLENDOPS_INSTALLER_PLAN_DIR || defaultPlanDir;
  const validatedPlanDir = validatePlanStoreDirectory(rawPlanDir, {
    repoRootReal,
    targetRootReal,
  });
  const key = sha256String(`${repoRootReal}::${targetRootReal}::${requestedTarget}`).slice(0, 24);
  const planFilePath = path.join(validatedPlanDir, `plan-${key}.json`);

  let existingLstat = null;
  try {
    existingLstat = fs.lstatSync(planFilePath);
  } catch (err) {
    if (!err || err.code !== 'ENOENT') {
      throw err;
    }
  }
  if (existingLstat) {
    if (
      existingLstat.isSymbolicLink() ||
      !existingLstat.isFile() ||
      (typeof existingLstat.nlink === 'number' && existingLstat.nlink > 1)
    ) {
      throw new Error(`Unsafe existing plan file at ${planFilePath}`);
    }
  }

  return planFilePath;
}

export function buildProjectInstallPlan({
  repoRootReal,
  projectReal,
  requestedTarget,
  confirmTargetPath,
  patchAgentsMd,
  patchClaudeMd = false,
  withSkillsDir = false,
  skillsFilter = null,
}) {
  const detectedMarkers = detectProjectTargetMarkers(projectReal);
  const sourceInfo = computeBlendOpsSourceFingerprint(repoRootReal);

  let selectedTarget = requestedTarget;
  let confidence = SUPPORTED_TARGETS[requestedTarget].confidence;
  let effectiveBehavior = 'generic-project';
  const limitations = [];
  const skippedEntries = [];

  if (requestedTarget === 'auto') {
    if (detectedMarkers.length > 1) {
      const choices = detectedMarkers.map((d) => `${d.target} (${d.markers.join(', ')})`).join('; ');
      throw new Error(
        `Ambiguous target detection: multiple target markers found in ${projectReal}: ${choices}. Stop before writing and specify an explicit --target <name>.`,
      );
    }
    if (detectedMarkers.length === 0) {
      selectedTarget = 'generic-project';
      confidence = 'verified-read';
      effectiveBehavior = 'generic-project';
      limitations.push(
        'No tool-specific project markers detected; using verified-read generic-project fallback (BLENDOPS.md).',
      );
    } else {
      const single = detectedMarkers[0];
      selectedTarget = single.target;
      confidence = single.confidence;
      if (single.target === 'claude-code') {
        effectiveBehavior = 'claude-code-project-local';
      } else {
        effectiveBehavior = 'generic-project';
        limitations.push(
          `Detected '${single.target}' marker (${single.markers.join(', ')}) with '${single.confidence}' confidence; using safe generic-project fallback (BLENDOPS.md) unless --target ${single.target} --confirm-target-path is explicitly specified.`,
        );
      }
    }
  } else {
    selectedTarget = requestedTarget;
    confidence = SUPPORTED_TARGETS[requestedTarget].confidence;
    if (selectedTarget === 'generic-project') {
      effectiveBehavior = 'generic-project';
    } else if (selectedTarget === 'claude-code') {
      effectiveBehavior = 'claude-code-project-local';
    } else if (selectedTarget === 'cursor') {
      if (confirmTargetPath) {
        effectiveBehavior = 'cursor-mdc-project-local';
      } else {
        effectiveBehavior = 'generic-project';
      }
    } else if (selectedTarget === 'codex') {
      if (confirmTargetPath || patchAgentsMd) {
        effectiveBehavior = 'codex-agents-project-local';
      } else {
        effectiveBehavior = 'generic-project';
      }
    } else {
      // opencode, gemini, antigravity, github-copilot: native paths are unverified/not researched
      effectiveBehavior = 'generic-project';
    }
  }

  const rollbackManifestRel = '.blendops/install-manifest.json';
  const installReportRel = '.blendops/INSTALL_REPORT.md';

  const journalCandidateAbs = path.join(projectReal, '.blendops', 'transaction-journal.json');
  try {
    if (fs.lstatSync(journalCandidateAbs).isFile()) {
      recoverPendingTransactionJournal(projectReal);
    }
  } catch (err) {
    if (!err || (err.code !== 'ENOENT' && err.code !== 'ENOTDIR')) {
      throw err;
    }
  }

  let previousManifest = null;
  const { absTarget: prevManifestAbs, exists: prevManifestExists } =
    validateSafeRelativeTargetFile(projectReal, rollbackManifestRel);
  if (prevManifestExists) {
    try {
      previousManifest = JSON.parse(fs.readFileSync(prevManifestAbs, 'utf8'));
    } catch {
      throw new Error(`Malformed existing rollback manifest JSON at ${prevManifestAbs}`);
    }
    validateRollbackManifestSchema(previousManifest, prevManifestAbs);
  }

  const operations = [];
  const blendopsMdContent = buildCanonicalBlendOpsMd(repoRootReal, {
    selectedTarget,
    confidence,
    effectiveBehavior,
  });
  operations.push(
    planSingleFileOperation(projectReal, 'BLENDOPS.md', blendopsMdContent, {
      managedBlock: blendopsMdContent.trim(),
      initialFileContent: blendopsMdContent,
      previousManifest,
    }),
  );

  const managedSection = buildManagedBlendOpsSection({
    selectedTarget,
    effectiveBehavior,
  });

  if (selectedTarget === 'claude-code') {
    const claudeInitial = applyManagedBlockToDocument(null, managedSection, '# CLAUDE.md');
    operations.push(
      planSingleFileOperation(projectReal, 'CLAUDE.md', claudeInitial, {
        managedBlock: managedSection,
        initialFileContent: claudeInitial,
        previousManifest,
      }),
    );
    skippedEntries.push({
      path: '.claude/skills/',
      reason:
        'Claude Code native .claude/skills/ loader path is unverified in this environment; using project-local CLAUDE.md + BLENDOPS.md attachment.',
    });
    limitations.push(
      'Claude Code project-local adapter (CLAUDE.md / BLENDOPS.md) is verified-read; native .claude/skills/ loader and live claude CLI execution remain unverified.',
    );
  } else if (patchClaudeMd) {
    const claudeInitial = applyManagedBlockToDocument(null, managedSection, '# CLAUDE.md');
    operations.push(
      planSingleFileOperation(projectReal, 'CLAUDE.md', claudeInitial, {
        managedBlock: managedSection,
        initialFileContent: claudeInitial,
        previousManifest,
      }),
    );
  }

  if (selectedTarget === 'cursor') {
    skippedEntries.push({
      path: '.cursor/rules/*.md',
      reason: 'Plain .md files under .cursor/rules/ are ignored by Cursor and are never written.',
    });
    if (effectiveBehavior === 'cursor-mdc-project-local') {
      const mdcManagedBlock = buildCursorRuleMdcManagedBlock({ selectedTarget, confidence });
      const mdcContent = buildCursorRuleMdcContent({ selectedTarget, confidence });
      operations.push(
        planSingleFileOperation(projectReal, '.cursor/rules/blendops.mdc', mdcContent, {
          managedBlock: mdcManagedBlock,
          initialFileContent: mdcContent,
          previousManifest,
        }),
      );
      limitations.push(
        'Cursor .cursor/rules/blendops.mdc is documented upstream (linked-only); live Cursor host verification and .cursor/mcp.json setup remain separate.',
      );
    } else {
      skippedEntries.push({
        path: '.cursor/rules/blendops.mdc',
        reason:
          'Cursor rule path (.cursor/rules/blendops.mdc) is linked-only; using generic BLENDOPS.md fallback unless --confirm-target-path is specified.',
      });
      limitations.push(
        'Cursor target is linked-only; installed BLENDOPS.md via generic-project fallback. Pass --confirm-target-path to also write .cursor/rules/blendops.mdc with frontmatter.',
      );
    }
  }

  const shouldPatchAgentsMd =
    patchAgentsMd ||
    (selectedTarget === 'codex' && (confirmTargetPath || effectiveBehavior === 'codex-agents-project-local'));

  if (selectedTarget === 'codex') {
    if (shouldPatchAgentsMd) {
      const agentsInitial = applyManagedBlockToDocument(null, managedSection, '# AGENTS.md');
      operations.push(
        planSingleFileOperation(projectReal, 'AGENTS.md', agentsInitial, {
          managedBlock: managedSection,
          initialFileContent: agentsInitial,
          previousManifest,
        }),
      );
      limitations.push(
        'Codex target is linked-only (no native Codex skills loader exists); AGENTS.md references BLENDOPS.md for Codex discovery.',
      );
    } else {
      skippedEntries.push({
        path: 'AGENTS.md',
        reason:
          'BLENDOPS.md alone is not auto-discovered by Codex; pass --patch-agents-md or --confirm-target-path to create/patch AGENTS.md with backup.',
      });
      limitations.push(
        'BLENDOPS.md alone is NOT auto-discovered by Codex unless referenced from AGENTS.md or added to project_doc_fallback_filenames; pass --patch-agents-md or --confirm-target-path to patch AGENTS.md with backup.',
      );
    }
  } else if (patchAgentsMd) {
    const agentsInitial = applyManagedBlockToDocument(null, managedSection, '# AGENTS.md');
    operations.push(
      planSingleFileOperation(projectReal, 'AGENTS.md', agentsInitial, {
        managedBlock: managedSection,
        initialFileContent: agentsInitial,
        previousManifest,
      }),
    );
  } else {
    skippedEntries.push({
      path: 'AGENTS.md',
      reason: 'Optional AGENTS.md patch not requested (pass --patch-agents-md to update with backup).',
    });
  }

  if (selectedTarget === 'opencode') {
    skippedEntries.push({
      path: '.opencode/',
      reason:
        'OpenCode native skill-loader path is candidate/unverified; using generic project-local BLENDOPS.md fallback.',
    });
    limitations.push(
      'OpenCode target is linked-only; no unverified .opencode/ native skill-loader directory was created.',
    );
  } else if (selectedTarget === 'gemini') {
    skippedEntries.push({
      path: 'GEMINI.md',
      reason:
        'Gemini CLI native adapter path is not researched/unverified; using generic project-local BLENDOPS.md fallback.',
    });
    limitations.push(
      'Gemini CLI target is linked-only/not researched; no unverified Gemini-native directory was created.',
    );
  } else if (selectedTarget === 'antigravity') {
    skippedEntries.push({
      path: '.agent/skills/',
      reason:
        'Antigravity candidate skill path (.agent/skills/) is unverified; using generic project-local BLENDOPS.md fallback.',
    });
    limitations.push(
      'Antigravity target is linked-only; no unverified .agent/skills/ directory was created.',
    );
  } else if (selectedTarget === 'github-copilot') {
    skippedEntries.push({
      path: '.github/copilot-instructions.md',
      reason:
        'GitHub Copilot native path is linked-only/unverified; using generic project-local BLENDOPS.md fallback.',
    });
    limitations.push(
      'GitHub Copilot target is linked-only/generic; no extension or marketplace listing exists.',
    );
  } else if (
    selectedTarget !== 'generic-project' &&
    selectedTarget !== 'claude-code' &&
    selectedTarget !== 'cursor' &&
    selectedTarget !== 'codex' &&
    SUPPORTED_TARGETS[selectedTarget]?.confidence === 'linked-only'
  ) {
    const markerEntry = TARGET_DETECTION_MARKERS.find((m) => m.target === selectedTarget);
    const candidatePath = markerEntry?.markers?.[0] || `.${selectedTarget}/`;
    skippedEntries.push({
      path: candidatePath,
      reason: `${selectedTarget} native skill-loader path (${candidatePath}) is linked-only/unverified; using generic project-local BLENDOPS.md fallback.`,
    });
    limitations.push(
      `${selectedTarget} target is linked-only; no unverified ${candidatePath} native skill-loader path was created (installed BLENDOPS.md via generic-project fallback).`,
    );
  } else if (selectedTarget === 'generic-project' && limitations.length === 0) {
    limitations.push(
      'Project-local instruction attachment only; Blender runtime and MCP host setup remain separate.',
    );
  }

  const catalogRelPaths = [];
  if (fs.existsSync(path.join(repoRootReal, 'registry', 'knowledge-catalog.json'))) {
    const sharedCatalogMap = buildSharedCatalogFilesMap(repoRootReal);
    for (const [subRel, contentStr] of Object.entries(sharedCatalogMap)) {
      const targetCatalogRel = `.blendops/catalog/${subRel}`;
      catalogRelPaths.push(targetCatalogRel);
      operations.push(
        planCatalogFileOperation(projectReal, targetCatalogRel, contentStr, previousManifest),
      );
    }
  }

  const normalizedSkillsFilter =
    Array.isArray(skillsFilter) && skillsFilter.length > 0
      ? [...new Set(skillsFilter)].sort(compareCodeUnitOrder)
      : null;

  if (normalizedSkillsFilter) {
    for (const requestedSlug of normalizedSkillsFilter) {
      if (!sourceInfo.skillNames.includes(requestedSlug)) {
        throw new Error(
          `Unknown canonical skill '${requestedSlug}' requested via --skill. Available skills (${sourceInfo.skillNames.length}): ${sourceInfo.skillNames.slice(0, 8).join(', ')}, ...`,
        );
      }
    }
  }

  if (withSkillsDir) {
    const skillsDirPrefix = AGENT_SKILLS_SH_DIRECTORY_MAP[selectedTarget] || '.agents/skills';
    const selectedSkillNames = normalizedSkillsFilter || sourceInfo.skillNames;

    // Remove skippedEntry for skillsDirPrefix if it was pushed earlier (e.g. .claude/skills/)
    for (let sIdx = skippedEntries.length - 1; sIdx >= 0; sIdx -= 1) {
      if (
        skippedEntries[sIdx].path === `${skillsDirPrefix}/` ||
        skippedEntries[sIdx].path === skillsDirPrefix
      ) {
        skippedEntries.splice(sIdx, 1);
      }
    }

    function collectSkillFiles(absSkillDir, relSubPrefix = '') {
      const items = fs
        .readdirSync(absSkillDir, { withFileTypes: true })
        .sort((a, b) => compareCodeUnitOrder(a.name, b.name));
      const collected = [];
      for (const item of items) {
        if (SKILLS_LOCK_EXCLUDED_DIRS.has(item.name) || item.name === 'metadata.json') continue;
        const absChild = path.join(absSkillDir, item.name);
        const relChild = relSubPrefix ? `${relSubPrefix}/${item.name}` : item.name;
        const childStat = fs.lstatSync(absChild);
        if (childStat.isSymbolicLink()) continue;
        if (childStat.isDirectory()) {
          collected.push(...collectSkillFiles(absChild, relChild));
        } else if (childStat.isFile()) {
          collected.push({
            relChild,
            contentStr: fs.readFileSync(absChild, 'utf8'),
          });
        }
      }
      return collected;
    }

    for (const skillName of selectedSkillNames) {
      const absSkillDir = path.join(repoRootReal, 'skills', skillName);
      const skillFiles = collectSkillFiles(absSkillDir);
      for (const sf of skillFiles) {
        const targetSkillFileRel = `${skillsDirPrefix}/${skillName}/${sf.relChild}`;
        catalogRelPaths.push(targetSkillFileRel);
        operations.push(
          planCatalogFileOperation(
            projectReal,
            targetSkillFileRel,
            sf.contentStr,
            previousManifest,
          ),
        );
      }
    }

    const lockfileObj = buildSkillsLockJsonV2(repoRootReal, selectedSkillNames);
    const lockfileContent = `${JSON.stringify(lockfileObj, null, 2)}\n`;
    catalogRelPaths.push('skills-lock.json');
    operations.push(
      planCatalogFileOperation(projectReal, 'skills-lock.json', lockfileContent, previousManifest),
    );

    limitations.push(
      `skills.sh directory mode (--with-skills-dir): materialized ${selectedSkillNames.length} canonical skill folder(s) into '${skillsDirPrefix}/<skill>/' and wrote 'skills-lock.json' (Lockfile v2 computedHash). Runtime status remains Not Run and Artifact status remains Not Produced.`,
    );
  }

  const filesToCreate = operations.filter((op) => op.action === 'create').map((op) => op.path);
  const filesToModify = operations.filter((op) => op.action === 'modify').map((op) => op.path);
  const backupsToCreate = operations
    .filter((op) => op.action === 'modify' && Boolean(op.backupRelPath))
    .map((op) => ({
      path: op.path,
      backup_path: op.backupRelPath,
      pre_install_sha256: op.preExistingSha256,
    }));
  const filesToSkip = [
    ...operations
      .filter((op) => op.action === 'skip')
      .map((op) => ({ path: op.path, reason: op.reason })),
    ...skippedEntries,
  ];

  const inspectedRelPaths = [
    'BLENDOPS.md',
    'AGENTS.md',
    'CLAUDE.md',
    '.cursor/rules/blendops.mdc',
    ...catalogRelPaths,
  ];
  const targetStateSnapshot = captureTargetStateSnapshot(
    projectReal,
    inspectedRelPaths,
    detectedMarkers,
  );

  const planPayload = {
    installerVersion: INSTALLER_VERSION,
    requestedTarget,
    selectedTarget,
    confidence,
    effectiveBehavior,
    scope: 'project-local',
    projectPath: projectReal,
    repoRootPath: repoRootReal,
    confirmTargetPath: Boolean(confirmTargetPath),
    patchAgentsMd: Boolean(patchAgentsMd),
    ...(patchClaudeMd ? { patchClaudeMd: true } : {}),
    ...(withSkillsDir ? { withSkillsDir: true } : {}),
    ...(normalizedSkillsFilter ? { skillsFilter: normalizedSkillsFilter } : {}),
    sourceFingerprint: sourceInfo.fingerprint,
    detectedMarkers,
    targetStateSnapshot,
    operations: operations.map((op) => ({
      action: op.action,
      path: op.path,
      desiredSha256: op.desiredSha256,
      desiredManagedBlockSha256: op.desiredManagedBlockSha256,
      desiredContent: op.desiredContent,
      preExistingSha256: op.preExistingSha256,
      backupRelPath: op.backupRelPath,
      transitionedFromCreated: Boolean(op.transitionedFromCreated),
      reason: op.reason || null,
    })),
    filesToCreate,
    filesToModify,
    filesToSkip,
    backupsToCreate,
    rollbackManifestRel,
    installReportRel,
    limitations,
    runtimeStatus: 'Not Run',
    artifactStatus: 'Not Produced',
    globalTouched: false,
  };

  const planHash = sha256String(JSON.stringify(planPayload));
  return {
    ...planPayload,
    planHash,
  };
}

export function buildClaudeDesktopPlan({ repoRootReal, outReal, requestedTarget }) {
  let outAlreadyExists = false;
  try {
    fs.lstatSync(outReal);
    outAlreadyExists = true;
  } catch (err) {
    if (!err || err.code !== 'ENOENT') {
      throw err;
    }
  }
  if (outAlreadyExists) {
    throw new Error(
      `Refusing to use existing --out destination (${outReal}): Claude Desktop export requires a non-existent output directory path so existing files are never overwritten or deleted.`,
    );
  }

  const sourceInfo = computeBlendOpsSourceFingerprint(repoRootReal);
  const hasSharedCatalog = fs.existsSync(
    path.join(repoRootReal, 'registry', 'knowledge-catalog.json'),
  );
  const filesToCreate = [
    ...sourceInfo.skillNames.map((name) => `desktop-zips/${name}.zip`),
    ...sourceInfo.skillNames.map((name) => `claude-code-skills/${name}/SKILL.md`),
    'README.md',
    'manifest.json',
    'claude-desktop-manual/README.md',
    'claude-desktop-manual/SKILL.md',
    'claude-desktop-manual/BLENDOPS_SINGLE_FILE.md',
    'claude-desktop-manual/IMPORT_STEPS.md',
    'claude-desktop-manual/manifest.json',
    ...(hasSharedCatalog
      ? [
          'shared-catalog/README.md',
          'shared-catalog/manifest.json',
          'shared-catalog/blendops-knowledge-and-recipes.zip',
        ]
      : []),
  ];

  const targetStateSnapshot = {
    outExists: false,
    existingEntries: [],
  };

  const limitations = [
    'Manual upload bundle only (16 per-skill ZIPs in desktop-zips/*.zip + claude-desktop-manual/ + shared-catalog/blendops-knowledge-and-recipes.zip). Does not automate Claude Desktop UI import, does not configure Anthropic Blender Connector or Lab MCP add-on, and does not run Blender.',
  ];

  const planPayload = {
    installerVersion: INSTALLER_VERSION,
    requestedTarget,
    selectedTarget: 'claude-desktop',
    confidence: 'linked-only/manual',
    effectiveBehavior: 'claude-desktop-bundle-output',
    scope: 'bundle-output',
    projectPath: outReal,
    repoRootPath: repoRootReal,
    confirmTargetPath: false,
    patchAgentsMd: false,
    sourceFingerprint: sourceInfo.fingerprint,
    skillCount: sourceInfo.skillCount,
    detectedMarkers: [],
    targetStateSnapshot,
    operations: [],
    filesToCreate,
    filesToModify: [],
    filesToSkip: [],
    backupsToCreate: [],
    rollbackManifestRel: '.blendops/install-manifest.json',
    installReportRel: '.blendops/INSTALL_REPORT.md',
    limitations,
    runtimeStatus: 'Not Run',
    artifactStatus: 'Not Produced',
    globalTouched: false,
  };

  const planHash = sha256String(JSON.stringify(planPayload));
  return {
    ...planPayload,
    planHash,
  };
}

export function writeAtomicFile(targetAbsPath, contentBufferOrString) {
  const dir = path.dirname(targetAbsPath);
  fs.mkdirSync(dir, { recursive: true });
  const tempPath = path.join(
    dir,
    `.${path.basename(targetAbsPath)}.tmp-${process.pid}-${Date.now()}-${crypto.randomBytes(6).toString('hex')}`,
  );
  try {
    fs.writeFileSync(tempPath, contentBufferOrString, { flag: 'wx' });
    fs.renameSync(tempPath, targetAbsPath);
  } finally {
    if (fs.existsSync(tempPath)) {
      try {
        fs.rmSync(tempPath, { force: true });
      } catch {
        // Best-effort cleanup
      }
    }
  }
}
