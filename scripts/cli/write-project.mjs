import fs from 'node:fs';
import path from 'node:path';
import { INSTALLER_VERSION } from './constants.mjs';
import { assertNoSymlinkedAncestorsWithin, sha256Buffer, validateSafeRelativeTargetFile } from './path-safety.mjs';
import { writeAtomicFile } from './install-plan.mjs';
import { formatInstallerReport } from './report.mjs';
import { isSha256Hex, recoverPendingTransactionJournal, rollbackWriteTransaction, validateRollbackManifestSchema } from './rollback.mjs';

export function executeWriteProjectPlan(livePlan, options = {}) {
  const faultInjection = options.faultInjection || null;
  const projectReal = livePlan.projectPath;
  const blendopsDir = path.join(projectReal, '.blendops');
  const backupsDir = path.join(blendopsDir, 'backups');
  const manifestAbsPath = path.join(projectReal, livePlan.rollbackManifestRel);
  const reportAbsPath = path.join(projectReal, livePlan.installReportRel);

  // Check if .blendops or its children are symlinks or non-directories before touching anything
  assertNoSymlinkedAncestorsWithin(projectReal, manifestAbsPath);
  assertNoSymlinkedAncestorsWithin(projectReal, reportAbsPath);

  const blendopsExistedBefore = fs.existsSync(blendopsDir);
  if (blendopsExistedBefore) {
    const blendopsLstat = fs.lstatSync(blendopsDir);
    if (blendopsLstat.isSymbolicLink() || !blendopsLstat.isDirectory()) {
      throw new Error(`Unsafe .blendops metadata path at ${blendopsDir}: must be a regular directory`);
    }
  }
  const backupsDirExistedBefore = fs.existsSync(backupsDir);
  if (backupsDirExistedBefore) {
    const backupsLstat = fs.lstatSync(backupsDir);
    if (backupsLstat.isSymbolicLink() || !backupsLstat.isDirectory()) {
      throw new Error(`Unsafe .blendops/backups path at ${backupsDir}: must be a regular directory`);
    }
  }

  if (fs.existsSync(path.join(blendopsDir, 'transaction-journal.json'))) {
    recoverPendingTransactionJournal(projectReal);
  }

  // Capture exact pre-transaction bytes and existence state of .blendops/install-manifest.json and .blendops/INSTALL_REPORT.md
  let previousManifest = null;
  let prevManifestExisted = false;
  let prevManifestBytes = null;
  let prevManifestSha256 = null;

  if (fs.existsSync(manifestAbsPath)) {
    const lstat = fs.lstatSync(manifestAbsPath);
    if (lstat.isSymbolicLink() || !lstat.isFile() || lstat.nlink > 1) {
      throw new Error(`Unsafe existing rollback manifest at ${manifestAbsPath}`);
    }
    prevManifestExisted = true;
    prevManifestBytes = fs.readFileSync(manifestAbsPath);
    prevManifestSha256 = sha256Buffer(prevManifestBytes);
    try {
      previousManifest = JSON.parse(prevManifestBytes.toString('utf8'));
    } catch {
      throw new Error(`Malformed existing rollback manifest JSON at ${manifestAbsPath}`);
    }
    validateRollbackManifestSchema(previousManifest, manifestAbsPath);

    // Verify all previously recorded backup files exist, are safe regular files, and match pre_install_sha256
    for (const relPath of previousManifest.files_modified) {
      const prevMeta = previousManifest.modified_file_hashes[relPath];
      const { absTarget: prevBackupAbs, exists: prevBackupExists } =
        validateSafeRelativeTargetFile(projectReal, prevMeta.backup_path);
      if (!prevBackupExists) {
        throw new Error(
          `Existing backup file '${prevMeta.backup_path}' referenced by prior install manifest is missing on disk; refusing to overwrite original backup state.`,
        );
      }
      const prevBackupHash = sha256Buffer(fs.readFileSync(prevBackupAbs));
      if (prevBackupHash !== prevMeta.pre_install_sha256) {
        throw new Error(
          `Existing backup file '${prevMeta.backup_path}' failed SHA-256 verification against prior install manifest; refusing to overwrite corrupted backup.`,
        );
      }
    }
  }

  const { absTarget: prevReportAbs, exists: prevReportExists } = validateSafeRelativeTargetFile(
    projectReal,
    livePlan.installReportRel,
  );
  let prevReportBytes = null;
  let prevReportSha256 = null;
  if (prevReportExists) {
    prevReportBytes = fs.readFileSync(prevReportAbs);
    prevReportSha256 = sha256Buffer(prevReportBytes);
    if (prevManifestExisted) {
      if (previousManifest.metadata_files?.[livePlan.installReportRel]) {
        const expectedPrevReportHash = previousManifest.metadata_files[livePlan.installReportRel];
        if (prevReportSha256 !== expectedPrevReportHash) {
          throw new Error(
            `Existing installer report '${livePlan.installReportRel}' was modified after installation; refusing to overwrite user changes.`,
          );
        }
      }
    } else {
      throw new Error(
        `Refusing to overwrite pre-existing untracked file at '${livePlan.installReportRel}'`,
      );
    }
  }

  const createdFilesSet = new Set(previousManifest ? previousManifest.files_created : []);
  const modifiedFilesSet = new Set(previousManifest ? previousManifest.files_modified : []);
  const createdFileHashes = { ...(previousManifest?.created_file_hashes || {}) };
  const modifiedFileHashes = { ...(previousManifest?.modified_file_hashes || {}) };
  const createdManagedBlockHashes = { ...(previousManifest?.created_managed_block_hashes || {}) };
  const modifiedManagedBlockHashes = { ...(previousManifest?.modified_managed_block_hashes || {}) };
  const backupsMap = new Map();
  if (previousManifest) {
    for (const b of previousManifest.backups) {
      backupsMap.set(b.path, { ...b });
    }
  }

  // Capture exact pre-transaction state for all target files and newly created backups BEFORE any disk write
  const newlyCreatedBackups = [];
  const targetRecords = [];

  for (const op of livePlan.operations) {
    if (op.action === 'skip') {
      if (createdFilesSet.has(op.path) && isSha256Hex(op.desiredManagedBlockSha256)) {
        createdManagedBlockHashes[op.path] = op.desiredManagedBlockSha256;
      } else if (modifiedFilesSet.has(op.path) && isSha256Hex(op.desiredManagedBlockSha256)) {
        modifiedManagedBlockHashes[op.path] = op.desiredManagedBlockSha256;
      }
      continue;
    }

    if (op.action === 'create') {
      const { absTarget, exists } = validateSafeRelativeTargetFile(projectReal, op.path);
      if (exists) {
        throw new Error(
          `Target file '${op.path}' appeared after dry-run planning; aborting write.`,
        );
      }
      targetRecords.push({
        relPath: op.path,
        absPath: absTarget,
        action: 'create',
        existedBefore: false,
        preBytes: null,
        preSha256: null,
        desiredContent: op.desiredContent,
        desiredSha256: op.desiredSha256,
        stagingAbsPath: null,
        writeAttempted: false,
      });
      createdFilesSet.add(op.path);
      createdFileHashes[op.path] = op.desiredSha256;
      if (isSha256Hex(op.desiredManagedBlockSha256)) {
        createdManagedBlockHashes[op.path] = op.desiredManagedBlockSha256;
      }
      continue;
    }

    if (op.action !== 'modify') continue;

    const { absTarget, exists } = validateSafeRelativeTargetFile(projectReal, op.path);
    if (!exists) {
      throw new Error(
        `Target file '${op.path}' disappeared after dry-run planning; aborting write.`,
      );
    }
    const currentBytes = fs.readFileSync(absTarget);
    const currentHash = sha256Buffer(currentBytes);
    if (currentHash !== op.preExistingSha256) {
      throw new Error(
        `Target file '${op.path}' changed before backup could be recorded; aborting write.`,
      );
    }

    targetRecords.push({
      relPath: op.path,
      absPath: absTarget,
      action: 'modify',
      existedBefore: true,
      preBytes: currentBytes,
      preSha256: currentHash,
      desiredContent: op.desiredContent,
      desiredSha256: op.desiredSha256,
      stagingAbsPath: null,
      writeAttempted: false,
    });

    if (createdFilesSet.has(op.path)) {
      const prevCreatedHash = previousManifest?.created_file_hashes?.[op.path];
      const wasEditedByUser =
        Boolean(op.transitionedFromCreated) ||
        !isSha256Hex(prevCreatedHash) ||
        currentHash !== prevCreatedHash;
      if (!wasEditedByUser) {
        // File was not edited by the user; keep in files_created and refresh its hash
        createdFileHashes[op.path] = op.desiredSha256;
        if (isSha256Hex(op.desiredManagedBlockSha256)) {
          createdManagedBlockHashes[op.path] = op.desiredManagedBlockSha256;
        }
        continue;
      }
      // User edited an installer-created file: transition ownership from files_created to files_modified
      createdFilesSet.delete(op.path);
      delete createdFileHashes[op.path];
      delete createdManagedBlockHashes[op.path];
    }

    const encodedBackupName = `${op.path.replace(/\//g, '__')}.bak`;
    const backupRelPath = backupsMap.has(op.path)
      ? backupsMap.get(op.path).backup_path
      : op.backupRelPath || `.blendops/backups/${encodedBackupName}`;
    const { absTarget: backupAbsPath, exists: backupAlreadyExists } =
      validateSafeRelativeTargetFile(projectReal, backupRelPath);

    if (backupsMap.has(op.path)) {
      const existingEntry = backupsMap.get(op.path);
      if (!backupAlreadyExists) {
        throw new Error(
          `Original backup '${backupRelPath}' for '${op.path}' is missing on disk; refusing to overwrite original pre-install backup with post-install file content.`,
        );
      }
      const existingBackupHash = sha256Buffer(fs.readFileSync(backupAbsPath));
      if (existingBackupHash !== existingEntry.pre_install_sha256) {
        throw new Error(
          `Original backup '${backupRelPath}' for '${op.path}' failed SHA-256 integrity check; refusing to continue.`,
        );
      }
      existingEntry.post_install_sha256 = op.desiredSha256;
      modifiedFileHashes[op.path] = {
        pre_install_sha256: existingEntry.pre_install_sha256,
        post_install_sha256: op.desiredSha256,
        backup_path: existingEntry.backup_path,
      };
    } else {
      if (backupAlreadyExists) {
        throw new Error(
          `Refusing to overwrite unexpected pre-existing file at backup path '${backupRelPath}'`,
        );
      }
      newlyCreatedBackups.push({
        targetRelPath: op.path,
        backupRelPath,
        backupAbsPath,
        bytes: currentBytes,
        sha256: currentHash,
      });
      backupsMap.set(op.path, {
        path: op.path,
        backup_path: backupRelPath,
        pre_install_sha256: currentHash,
        post_install_sha256: op.desiredSha256,
      });
      modifiedFileHashes[op.path] = {
        pre_install_sha256: currentHash,
        post_install_sha256: op.desiredSha256,
        backup_path: backupRelPath,
      };
    }

    modifiedFilesSet.add(op.path);
    if (isSha256Hex(op.desiredManagedBlockSha256)) {
      modifiedManagedBlockHashes[op.path] = op.desiredManagedBlockSha256;
    }
  }

  // Ensure every created file in createdFilesSet has a valid SHA-256 in createdFileHashes
  for (const createdRel of createdFilesSet) {
    if (!isSha256Hex(createdFileHashes[createdRel])) {
      const { absTarget, exists } = validateSafeRelativeTargetFile(projectReal, createdRel);
      if (!exists) {
        throw new Error(`Missing hash and file for created path '${createdRel}'`);
      }
      createdFileHashes[createdRel] = sha256Buffer(fs.readFileSync(absTarget));
    }
  }

  for (const key of Object.keys(createdManagedBlockHashes)) {
    if (!createdFilesSet.has(key)) {
      delete createdManagedBlockHashes[key];
    }
  }

  // Ensure every modified file in modifiedFilesSet has up-to-date post_install_sha256
  for (const modRel of modifiedFilesSet) {
    if (createdFilesSet.has(modRel)) continue;
    const meta = modifiedFileHashes[modRel];
    const bEntry = backupsMap.get(modRel);
    if (!meta || !bEntry) {
      throw new Error(`Missing backup metadata for modified file '${modRel}'`);
    }
  }

  for (const key of Object.keys(modifiedManagedBlockHashes)) {
    if (!modifiedFilesSet.has(key) || createdFilesSet.has(key)) {
      delete modifiedManagedBlockHashes[key];
    }
  }

  const finalFilesCreated = [...createdFilesSet];
  const finalFilesModified = [...modifiedFilesSet].filter((p) => !createdFilesSet.has(p));
  const finalBackups = [...backupsMap.values()].filter((b) => !createdFilesSet.has(b.path));

  const result = {
    ok: true,
    mode: 'write',
    targetRequested: livePlan.requestedTarget,
    targetSelected: livePlan.selectedTarget,
    resolvedInstallMode: livePlan.effectiveBehavior,
    confidence: livePlan.confidence,
    scope: livePlan.scope,
    projectOrOutPath: projectReal,
    detectedMarkers: livePlan.detectedMarkers,
    filesCreated: livePlan.filesToCreate,
    filesModified: livePlan.filesToModify,
    filesSkipped: livePlan.filesToSkip,
    backups: livePlan.backupsToCreate,
    rollbackManifestPath: manifestAbsPath,
    globalTouched: false,
    runtimeStatus: 'Not Run',
    artifactStatus: 'Not Produced',
    limitations: livePlan.limitations,
  };

  result.report = formatInstallerReport(result);
  const reportSha256 = sha256Buffer(Buffer.from(result.report, 'utf8'));

  const rollbackSteps = [
    `node scripts/install-skills.mjs --rollback --project "${projectReal}"`,
    ...finalBackups.map((b) => `cp "${b.backup_path}" "${b.path}"`),
    ...finalFilesCreated.map((f) => `rm -f "${f}"`),
    ...finalBackups.map((b) => `rm -f "${b.backup_path}"`),
    'rm -f ".blendops/INSTALL_REPORT.md" ".blendops/install-manifest.json"',
    'rmdir ".blendops/backups" ".blendops" 2>/dev/null || true',
  ];

  const manifestData = {
    installer_version: INSTALLER_VERSION,
    timestamp: new Date().toISOString(),
    target: livePlan.selectedTarget,
    requested_target: livePlan.requestedTarget,
    confidence: livePlan.confidence,
    scope: livePlan.scope,
    project: projectReal,
    plan_hash: livePlan.planHash,
    source_fingerprint: livePlan.sourceFingerprint,
    files_created: finalFilesCreated,
    files_modified: finalFilesModified,
    backups: finalBackups,
    files_skipped: livePlan.filesToSkip,
    created_file_hashes: createdFileHashes,
    modified_file_hashes: modifiedFileHashes,
    created_managed_block_hashes: createdManagedBlockHashes,
    modified_managed_block_hashes: modifiedManagedBlockHashes,
    metadata_files: {
      [livePlan.installReportRel]: reportSha256,
      [livePlan.rollbackManifestRel]: 'self',
    },
    global_touched: false,
    runtime_status: 'Not Run',
    artifact_status: 'Not Produced',
    rollback_steps: rollbackSteps,
  };

  validateRollbackManifestSchema(manifestData, manifestAbsPath);

  const txStagingDir = path.join(blendopsDir, 'tx-staging');
  const journalAbsPath = path.join(blendopsDir, 'transaction-journal.json');

  const txState = {
    journalAbsPath,
    txStagingDir,
    blendopsExistedBefore,
    backupsDirExistedBefore,
    manifestState: {
      relPath: livePlan.rollbackManifestRel,
      absPath: manifestAbsPath,
      existedBefore: prevManifestExisted,
      preBytes: prevManifestBytes,
      preSha256: prevManifestSha256,
      stagingAbsPath: prevManifestExisted ? path.join(txStagingDir, 'prev-manifest.bin') : null,
    },
    reportState: {
      relPath: livePlan.installReportRel,
      absPath: reportAbsPath,
      existedBefore: prevReportExists,
      preBytes: prevReportBytes,
      preSha256: prevReportSha256,
      stagingAbsPath: prevReportExists ? path.join(txStagingDir, 'prev-report.bin') : null,
    },
    newlyCreatedBackups,
    targetRecords,
  };

  // Begin recoverable write transaction
  try {
    fs.mkdirSync(blendopsDir, { recursive: true });
    fs.mkdirSync(txStagingDir, { recursive: true });

    if (prevManifestExisted && prevManifestBytes) {
      writeAtomicFile(txState.manifestState.stagingAbsPath, prevManifestBytes);
    }
    if (prevReportExists && prevReportBytes) {
      writeAtomicFile(txState.reportState.stagingAbsPath, prevReportBytes);
    }
    for (let i = 0; i < targetRecords.length; i += 1) {
      const rec = targetRecords[i];
      if (rec.existedBefore && rec.preBytes) {
        const stagingFileName = `target-${i}-${rec.relPath.replace(/\//g, '__')}.bin`;
        rec.stagingAbsPath = path.join(txStagingDir, stagingFileName);
        writeAtomicFile(rec.stagingAbsPath, rec.preBytes);
      }
    }

    const journalData = {
      installer_version: INSTALLER_VERSION,
      started_at: new Date().toISOString(),
      project: projectReal,
      blendops_existed_before: blendopsExistedBefore,
      backups_dir_existed_before: backupsDirExistedBefore,
      manifest_state: {
        rel_path: livePlan.rollbackManifestRel,
        existed_before: prevManifestExisted,
        pre_sha256: prevManifestSha256,
        staging_rel_path: prevManifestExisted ? '.blendops/tx-staging/prev-manifest.bin' : null,
      },
      report_state: {
        rel_path: livePlan.installReportRel,
        existed_before: prevReportExists,
        pre_sha256: prevReportSha256,
        staging_rel_path: prevReportExists ? '.blendops/tx-staging/prev-report.bin' : null,
      },
      newly_created_backups: newlyCreatedBackups.map((b) => ({
        target_rel_path: b.targetRelPath,
        backup_rel_path: b.backupRelPath,
        sha256: b.sha256,
      })),
      target_records: targetRecords.map((rec, idx) => ({
        rel_path: rec.relPath,
        action: rec.action,
        existed_before: rec.existedBefore,
        pre_sha256: rec.preSha256,
        desired_sha256: rec.desiredSha256,
        staging_rel_path: rec.existedBefore
          ? `.blendops/tx-staging/target-${idx}-${rec.relPath.replace(/\//g, '__')}.bin`
          : null,
      })),
    };
    writeAtomicFile(journalAbsPath, `${JSON.stringify(journalData, null, 2)}\n`);

    // Step 1: Write and verify newly created backups before mutating manifest or targets
    for (const b of newlyCreatedBackups) {
      const { exists: nowExists } = validateSafeRelativeTargetFile(projectReal, b.backupRelPath);
      if (nowExists) {
        throw new Error(
          `Refusing to overwrite unexpected file at backup path '${b.backupRelPath}'`,
        );
      }
      fs.mkdirSync(path.dirname(b.backupAbsPath), { recursive: true });
      writeAtomicFile(b.backupAbsPath, b.bytes);
      const verifyBackupHash = sha256Buffer(fs.readFileSync(b.backupAbsPath));
      if (verifyBackupHash !== b.sha256) {
        throw new Error(`Backup verification failed for ${b.backupRelPath}`);
      }
      if (faultInjection?.afterBackupWrite) {
        faultInjection.afterBackupWrite({ backup: b, projectReal });
      }
    }

    // Step 2: Persist provisional rollback manifest BEFORE mutating any target project instruction files
    const manifestJsonText = `${JSON.stringify(manifestData, null, 2)}\n`;
    const expectedManifestSha = sha256Buffer(Buffer.from(manifestJsonText, 'utf8'));
    writeAtomicFile(manifestAbsPath, manifestJsonText);
    const writtenManifestSha = sha256Buffer(fs.readFileSync(manifestAbsPath));
    if (writtenManifestSha !== expectedManifestSha) {
      throw new Error(`Post-write hash verification failed for ${livePlan.rollbackManifestRel}`);
    }
    if (faultInjection?.afterProvisionalManifestWrite) {
      faultInjection.afterProvisionalManifestWrite({ manifestAbsPath, projectReal });
    }

    // Step 3: Atomically write created and modified target files with immediate pre-write revalidation
    for (let i = 0; i < targetRecords.length; i += 1) {
      const rec = targetRecords[i];
      if (faultInjection?.beforeTargetOperation) {
        faultInjection.beforeTargetOperation({ index: i, op: rec, projectReal });
      }
      const { absTarget, exists } = validateSafeRelativeTargetFile(projectReal, rec.relPath);
      if (rec.action === 'create') {
        if (exists) {
          throw new Error(
            `Target file '${rec.relPath}' appeared after planning right before write; aborting write.`,
          );
        }
      } else if (rec.action === 'modify') {
        if (!exists) {
          throw new Error(
            `Target file '${rec.relPath}' disappeared right before write; aborting write.`,
          );
        }
        const preWriteBytes = fs.readFileSync(absTarget);
        const preWriteHash = sha256Buffer(preWriteBytes);
        if (preWriteHash !== rec.preSha256) {
          throw new Error(
            `Target file '${rec.relPath}' changed right before atomic replacement; aborting write.`,
          );
        }
      }
      rec.writeAttempted = true;
      writeAtomicFile(absTarget, rec.desiredContent);
      if (faultInjection?.afterTargetWriteBeforeVerify) {
        faultInjection.afterTargetWriteBeforeVerify({ index: i, op: rec, projectReal });
      }
      const writtenHash = sha256Buffer(fs.readFileSync(absTarget));
      if (writtenHash !== rec.desiredSha256) {
        throw new Error(`Post-write hash verification failed for ${rec.relPath}`);
      }
      if (faultInjection?.afterTargetOperation) {
        faultInjection.afterTargetOperation({ index: i, op: rec, projectReal });
      }
    }

    // Step 4: Write and verify .blendops/INSTALL_REPORT.md inside the same transaction
    if (faultInjection?.beforeReportWrite) {
      faultInjection.beforeReportWrite({ reportAbsPath, projectReal });
    }
    validateSafeRelativeTargetFile(projectReal, livePlan.installReportRel);
    writeAtomicFile(reportAbsPath, result.report);
    if (faultInjection?.afterReportWriteBeforeVerify) {
      faultInjection.afterReportWriteBeforeVerify({ reportAbsPath, projectReal });
    }
    const writtenReportHash = sha256Buffer(fs.readFileSync(reportAbsPath));
    if (writtenReportHash !== reportSha256) {
      throw new Error(`Post-write hash verification failed for ${livePlan.installReportRel}`);
    }
    if (faultInjection?.afterReportOperation) {
      faultInjection.afterReportOperation({ reportAbsPath, projectReal });
    }

    // Step 5: Finalize transaction only after all steps succeed
    if (faultInjection?.beforeTransactionFinalize) {
      faultInjection.beforeTransactionFinalize({ journalAbsPath, projectReal });
    }
    if (fs.existsSync(txStagingDir)) {
      fs.rmSync(txStagingDir, { recursive: true, force: true });
    }
    if (fs.existsSync(journalAbsPath)) {
      fs.rmSync(journalAbsPath, { force: true });
    }
  } catch (txErr) {
    if (faultInjection?.simulateProcessCrashOnFailure) {
      throw txErr;
    }
    const cleanupErrors = rollbackWriteTransaction(projectReal, txState, faultInjection);
    if (cleanupErrors.length > 0) {
      const origMsg = txErr instanceof Error ? txErr.message : String(txErr);
      throw new Error(
        `Transactional rollback incomplete after write failure (${origMsg}): ${cleanupErrors.join('; ')}`,
      );
    }
    throw txErr;
  }

  return result;
}
