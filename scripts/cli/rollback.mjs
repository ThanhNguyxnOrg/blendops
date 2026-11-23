import fs from 'node:fs';
import path from 'node:path';
import { sha256Buffer, validateDestinationRoot, validateSafeRelativeTargetFile } from './path-safety.mjs';
import { writeAtomicFile } from './install-plan.mjs';
import { formatInstallerReport } from './report.mjs';

export function isSha256Hex(val) {
  return typeof val === 'string' && /^[0-9a-f]{64}$/.test(val);
}

export function validateSafeRelativeManifestPath(relPath, { allowInsideBlendops = false } = {}) {
  if (typeof relPath !== 'string' || relPath.trim().length === 0 || relPath.includes('\0')) {
    throw new Error(`Rollback refused: invalid relative path in manifest: ${JSON.stringify(relPath)}`);
  }
  if (relPath.includes('\\') || relPath.startsWith('/') || /^[a-zA-Z]:/.test(relPath)) {
    throw new Error(
      `Rollback refused: non-normalized or absolute path in manifest: ${JSON.stringify(relPath)}`,
    );
  }
  const segments = relPath.split('/');
  if (segments.some((s) => s === '' || s === '.' || s === '..')) {
    throw new Error(
      `Rollback refused: path traversal or empty segment in manifest: ${JSON.stringify(relPath)}`,
    );
  }
  const isCatalogFile =
    relPath.startsWith('.blendops/catalog/') && relPath.length > '.blendops/catalog/'.length;
  if (
    !allowInsideBlendops &&
    !isCatalogFile &&
    (relPath === '.blendops' || relPath.startsWith('.blendops/'))
  ) {
    throw new Error(
      `Rollback refused: target file entry cannot reference internal .blendops metadata directory: ${relPath}`,
    );
  }
}

export function validateRollbackManifestSchema(manifest, manifestAbs) {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    throw new Error(`Rollback refused: invalid rollback manifest schema at ${manifestAbs}`);
  }
  if (typeof manifest.target !== 'string' || manifest.target.trim().length === 0) {
    throw new Error(`Rollback refused: invalid rollback manifest schema (missing target) at ${manifestAbs}`);
  }
  if (manifest.scope !== 'project-local' && manifest.scope !== 'bundle-output') {
    throw new Error(`Rollback refused: invalid rollback manifest schema (invalid scope) at ${manifestAbs}`);
  }
  if (
    !Array.isArray(manifest.files_created) ||
    !Array.isArray(manifest.files_modified) ||
    !Array.isArray(manifest.backups)
  ) {
    throw new Error(
      `Rollback refused: invalid rollback manifest schema (files_created, files_modified, and backups must be arrays) at ${manifestAbs}`,
    );
  }
  if (
    !manifest.created_file_hashes ||
    typeof manifest.created_file_hashes !== 'object' ||
    Array.isArray(manifest.created_file_hashes)
  ) {
    throw new Error(
      `Rollback refused: invalid rollback manifest schema (missing created_file_hashes object) at ${manifestAbs}`,
    );
  }
  if (
    !manifest.modified_file_hashes ||
    typeof manifest.modified_file_hashes !== 'object' ||
    Array.isArray(manifest.modified_file_hashes)
  ) {
    throw new Error(
      `Rollback refused: invalid rollback manifest schema (missing modified_file_hashes object) at ${manifestAbs}`,
    );
  }

  const createdSet = new Set();
  for (const relPath of manifest.files_created) {
    validateSafeRelativeManifestPath(relPath, { allowInsideBlendops: false });
    if (createdSet.has(relPath)) {
      throw new Error(
        `Rollback refused: duplicate files_created entry '${relPath}' in manifest at ${manifestAbs}`,
      );
    }
    createdSet.add(relPath);
    const expectedDigest = manifest.created_file_hashes[relPath];
    if (!isSha256Hex(expectedDigest)) {
      throw new Error(
        `Rollback refused: missing or invalid SHA-256 hash in created_file_hashes for '${relPath}' at ${manifestAbs}`,
      );
    }
  }

  for (const hashKey of Object.keys(manifest.created_file_hashes)) {
    if (!createdSet.has(hashKey)) {
      throw new Error(
        `Rollback refused: inconsistent created_file_hashes entry '${hashKey}' not listed in files_created at ${manifestAbs}`,
      );
    }
  }

  const modifiedSet = new Set();
  for (const relPath of manifest.files_modified) {
    validateSafeRelativeManifestPath(relPath, { allowInsideBlendops: false });
    if (createdSet.has(relPath)) {
      throw new Error(
        `Rollback refused: overlapping path '${relPath}' present in both files_created and files_modified at ${manifestAbs}`,
      );
    }
    if (modifiedSet.has(relPath)) {
      throw new Error(
        `Rollback refused: duplicate files_modified entry '${relPath}' in manifest at ${manifestAbs}`,
      );
    }
    modifiedSet.add(relPath);

    const meta = manifest.modified_file_hashes[relPath];
    if (!meta || typeof meta !== 'object' || Array.isArray(meta)) {
      throw new Error(
        `Rollback refused: missing backup metadata in modified_file_hashes for '${relPath}' at ${manifestAbs}`,
      );
    }
    validateSafeRelativeManifestPath(meta.backup_path, { allowInsideBlendops: true });
    if (
      !meta.backup_path.startsWith('.blendops/backups/') ||
      meta.backup_path.slice('.blendops/backups/'.length).includes('/') ||
      !meta.backup_path.endsWith('.bak')
    ) {
      throw new Error(
        `Rollback refused: invalid backup_path '${meta.backup_path}' for '${relPath}' at ${manifestAbs}`,
      );
    }
    if (!isSha256Hex(meta.pre_install_sha256)) {
      throw new Error(
        `Rollback refused: missing or invalid pre_install_sha256 for '${relPath}' at ${manifestAbs}`,
      );
    }
    if (!isSha256Hex(meta.post_install_sha256)) {
      throw new Error(
        `Rollback refused: missing or invalid post_install_sha256 for '${relPath}' at ${manifestAbs}`,
      );
    }
  }

  for (const modKey of Object.keys(manifest.modified_file_hashes)) {
    if (!modifiedSet.has(modKey)) {
      throw new Error(
        `Rollback refused: inconsistent modified_file_hashes entry '${modKey}' not listed in files_modified at ${manifestAbs}`,
      );
    }
  }

  if (manifest.backups.length !== manifest.files_modified.length) {
    throw new Error(
      `Rollback refused: inconsistent backups array length (${manifest.backups.length}) vs files_modified (${manifest.files_modified.length}) at ${manifestAbs}`,
    );
  }

  const seenBackupTargets = new Set();
  const seenBackupPaths = new Set();
  for (const b of manifest.backups) {
    if (!b || typeof b !== 'object' || Array.isArray(b)) {
      throw new Error(`Rollback refused: malformed entry in backups array at ${manifestAbs}`);
    }
    if (!modifiedSet.has(b.path)) {
      throw new Error(
        `Rollback refused: backups entry for '${String(b.path)}' is not listed in files_modified at ${manifestAbs}`,
      );
    }
    if (seenBackupTargets.has(b.path)) {
      throw new Error(
        `Rollback refused: duplicate backups entry for target '${b.path}' at ${manifestAbs}`,
      );
    }
    seenBackupTargets.add(b.path);

    const meta = manifest.modified_file_hashes[b.path];
    if (
      b.backup_path !== meta.backup_path ||
      b.pre_install_sha256 !== meta.pre_install_sha256 ||
      (b.post_install_sha256 !== undefined && b.post_install_sha256 !== meta.post_install_sha256)
    ) {
      throw new Error(
        `Rollback refused: backups array entry for '${b.path}' disagrees with modified_file_hashes at ${manifestAbs}`,
      );
    }
    if (seenBackupPaths.has(b.backup_path)) {
      throw new Error(
        `Rollback refused: duplicate backup_path '${b.backup_path}' in backups array at ${manifestAbs}`,
      );
    }
    seenBackupPaths.add(b.backup_path);
  }

  if (manifest.created_managed_block_hashes !== undefined) {
    if (
      !manifest.created_managed_block_hashes ||
      typeof manifest.created_managed_block_hashes !== 'object' ||
      Array.isArray(manifest.created_managed_block_hashes)
    ) {
      throw new Error(
        `Rollback refused: invalid created_managed_block_hashes object at ${manifestAbs}`,
      );
    }
    for (const [key, val] of Object.entries(manifest.created_managed_block_hashes)) {
      if (!createdSet.has(key) || !isSha256Hex(val)) {
        throw new Error(
          `Rollback refused: invalid created_managed_block_hashes entry for '${key}' at ${manifestAbs}`,
        );
      }
    }
  }

  if (manifest.modified_managed_block_hashes !== undefined) {
    if (
      !manifest.modified_managed_block_hashes ||
      typeof manifest.modified_managed_block_hashes !== 'object' ||
      Array.isArray(manifest.modified_managed_block_hashes)
    ) {
      throw new Error(
        `Rollback refused: invalid modified_managed_block_hashes object at ${manifestAbs}`,
      );
    }
    for (const [key, val] of Object.entries(manifest.modified_managed_block_hashes)) {
      if (!modifiedSet.has(key) || !isSha256Hex(val)) {
        throw new Error(
          `Rollback refused: invalid modified_managed_block_hashes entry for '${key}' at ${manifestAbs}`,
        );
      }
    }
  }

  if (manifest.metadata_files !== undefined) {
    if (
      !manifest.metadata_files ||
      typeof manifest.metadata_files !== 'object' ||
      Array.isArray(manifest.metadata_files)
    ) {
      throw new Error(`Rollback refused: invalid metadata_files object at ${manifestAbs}`);
    }
    for (const [metaKey, metaVal] of Object.entries(manifest.metadata_files)) {
      if (metaKey === '.blendops/INSTALL_REPORT.md') {
        if (!isSha256Hex(metaVal)) {
          throw new Error(
            `Rollback refused: invalid SHA-256 hash for '.blendops/INSTALL_REPORT.md' in metadata_files at ${manifestAbs}`,
          );
        }
      } else if (metaKey === '.blendops/install-manifest.json') {
        if (metaVal !== 'self' && !isSha256Hex(metaVal)) {
          throw new Error(
            `Rollback refused: invalid metadata_files entry for '.blendops/install-manifest.json' at ${manifestAbs}`,
          );
        }
      } else {
        throw new Error(
          `Rollback refused: unexpected metadata_files path '${metaKey}' in manifest at ${manifestAbs}`,
        );
      }
    }
  }
}

export function pruneEmptyParentDirectories(startFileAbs, stopRootReal) {
  let parentDir = path.dirname(startFileAbs);
  while (parentDir !== stopRootReal && parentDir.startsWith(stopRootReal)) {
    const rel = path.relative(stopRootReal, parentDir);
    if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) {
      break;
    }
    try {
      const lstat = fs.lstatSync(parentDir);
      if (lstat.isSymbolicLink() || !lstat.isDirectory()) {
        break;
      }
      if (fs.readdirSync(parentDir).length === 0) {
        fs.rmdirSync(parentDir);
        parentDir = path.dirname(parentDir);
      } else {
        break;
      }
    } catch {
      break;
    }
  }
}

export function rollbackWriteTransaction(projectReal, txState, faultInjection = null) {
  const cleanupErrors = [];
  const blendopsDir = path.join(projectReal, '.blendops');
  const backupsDir = path.join(blendopsDir, 'backups');

  // 1. Restore modified target files or remove newly created target files
  for (const rec of txState.targetRecords) {
    try {
      if (faultInjection?.onRollbackTarget) {
        faultInjection.onRollbackTarget(rec);
      }
      if (!rec.existedBefore) {
        // Target file did not exist before transaction; remove only if created by this transaction
        if (fs.existsSync(rec.absPath)) {
          let shouldRemove = Boolean(rec.writeAttempted);
          if (!shouldRemove && rec.fromJournal) {
            try {
              const diskHash = sha256Buffer(fs.readFileSync(rec.absPath));
              if (diskHash === rec.desiredSha256) {
                shouldRemove = true;
              }
            } catch {
              shouldRemove = false;
            }
          }
          if (shouldRemove) {
            fs.rmSync(rec.absPath, { force: true });
            if (fs.existsSync(rec.absPath)) {
              throw new Error(`Failed to remove newly created target file '${rec.relPath}'`);
            }
            pruneEmptyParentDirectories(rec.absPath, projectReal);
          }
        }
      } else {
        // Target file existed before transaction; restore exact pre-transaction bytes and verify SHA-256
        let restoreBytes = rec.preBytes;
        if (!restoreBytes && rec.stagingAbsPath && fs.existsSync(rec.stagingAbsPath)) {
          restoreBytes = fs.readFileSync(rec.stagingAbsPath);
        }
        if (!restoreBytes) {
          throw new Error(
            `Missing pre-transaction snapshot bytes for modified target '${rec.relPath}'`,
          );
        }
        const preSnapshotHash = sha256Buffer(restoreBytes);
        if (preSnapshotHash !== rec.preSha256) {
          throw new Error(
            `Pre-transaction snapshot hash mismatch for '${rec.relPath}' (expected ${rec.preSha256}, got ${preSnapshotHash})`,
          );
        }
        writeAtomicFile(rec.absPath, restoreBytes);
        if (faultInjection?.afterRollbackTargetWrite) {
          faultInjection.afterRollbackTargetWrite(rec);
        }
        const diskHash = sha256Buffer(fs.readFileSync(rec.absPath));
        if (diskHash !== rec.preSha256) {
          throw new Error(
            `Post-rollback SHA-256 verification failed for target '${rec.relPath}' (expected ${rec.preSha256}, got ${diskHash})`,
          );
        }
      }
    } catch (err) {
      cleanupErrors.push(
        `target '${rec.relPath}': ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  // 2. Remove only backups newly created by the failed transaction
  for (const b of txState.newlyCreatedBackups) {
    try {
      if (faultInjection?.onRollbackBackup) {
        faultInjection.onRollbackBackup(b);
      }
      if (fs.existsSync(b.backupAbsPath)) {
        fs.rmSync(b.backupAbsPath, { force: true });
        if (fs.existsSync(b.backupAbsPath)) {
          throw new Error(`Failed to remove newly created backup '${b.backupRelPath}'`);
        }
      }
    } catch (err) {
      cleanupErrors.push(
        `backup '${b.backupRelPath}': ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  // 3. Restore or remove .blendops/INSTALL_REPORT.md
  try {
    if (faultInjection?.onRollbackReport) {
      faultInjection.onRollbackReport(txState.reportState);
    }
    const rep = txState.reportState;
    if (rep.existedBefore) {
      let restoreBytes = rep.preBytes;
      if (!restoreBytes && rep.stagingAbsPath && fs.existsSync(rep.stagingAbsPath)) {
        restoreBytes = fs.readFileSync(rep.stagingAbsPath);
      }
      if (!restoreBytes) {
        throw new Error(`Missing pre-transaction snapshot bytes for '${rep.relPath}'`);
      }
      writeAtomicFile(rep.absPath, restoreBytes);
      if (faultInjection?.afterRollbackReportWrite) {
        faultInjection.afterRollbackReportWrite(rep);
      }
      const diskHash = sha256Buffer(fs.readFileSync(rep.absPath));
      if (diskHash !== rep.preSha256) {
        throw new Error(
          `Post-rollback SHA-256 verification failed for '${rep.relPath}' (expected ${rep.preSha256}, got ${diskHash})`,
        );
      }
    } else if (fs.existsSync(rep.absPath)) {
      fs.rmSync(rep.absPath, { force: true });
      if (fs.existsSync(rep.absPath)) {
        throw new Error(`Failed to remove newly written '${rep.relPath}'`);
      }
    }
  } catch (err) {
    cleanupErrors.push(
      `report '${txState.reportState.relPath}': ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  // 4. Restore or remove .blendops/install-manifest.json
  try {
    if (faultInjection?.onRollbackManifest) {
      faultInjection.onRollbackManifest(txState.manifestState);
    }
    const man = txState.manifestState;
    if (man.existedBefore) {
      let restoreBytes = man.preBytes;
      if (!restoreBytes && man.stagingAbsPath && fs.existsSync(man.stagingAbsPath)) {
        restoreBytes = fs.readFileSync(man.stagingAbsPath);
      }
      if (!restoreBytes) {
        throw new Error(`Missing pre-transaction snapshot bytes for '${man.relPath}'`);
      }
      writeAtomicFile(man.absPath, restoreBytes);
      if (faultInjection?.afterRollbackManifestWrite) {
        faultInjection.afterRollbackManifestWrite(man);
      }
      const diskHash = sha256Buffer(fs.readFileSync(man.absPath));
      if (diskHash !== man.preSha256) {
        throw new Error(
          `Post-rollback SHA-256 verification failed for '${man.relPath}' (expected ${man.preSha256}, got ${diskHash})`,
        );
      }
    } else if (fs.existsSync(man.absPath)) {
      fs.rmSync(man.absPath, { force: true });
      if (fs.existsSync(man.absPath)) {
        throw new Error(`Failed to remove provisional '${man.relPath}'`);
      }
    }
  } catch (err) {
    cleanupErrors.push(
      `manifest '${txState.manifestState.relPath}': ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  // 5. Clean up transaction staging/journal and prune empty installer-created metadata directories only when all restorations succeeded
  if (cleanupErrors.length === 0) {
    try {
      if (txState.txStagingDir && fs.existsSync(txState.txStagingDir)) {
        fs.rmSync(txState.txStagingDir, { recursive: true, force: true });
      }
      if (txState.journalAbsPath && fs.existsSync(txState.journalAbsPath)) {
        fs.rmSync(txState.journalAbsPath, { force: true });
      }
      if (!txState.backupsDirExistedBefore && fs.existsSync(backupsDir)) {
        if (fs.readdirSync(backupsDir).length === 0) {
          fs.rmdirSync(backupsDir);
        }
      }
      if (!txState.blendopsExistedBefore && fs.existsSync(blendopsDir)) {
        if (fs.readdirSync(blendopsDir).length === 0) {
          fs.rmdirSync(blendopsDir);
        }
      }
    } catch (err) {
      cleanupErrors.push(
        `transaction metadata cleanup: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return cleanupErrors;
}

export function recoverPendingTransactionJournal(projectReal, options = {}) {
  const journalRel = '.blendops/transaction-journal.json';
  const { absTarget: journalAbsPath, exists: journalExists } = validateSafeRelativeTargetFile(
    projectReal,
    journalRel,
  );
  if (!journalExists) {
    return { recovered: false };
  }

  let journal;
  try {
    journal = JSON.parse(fs.readFileSync(journalAbsPath, 'utf8'));
  } catch {
    throw new Error(
      `Pending transaction recovery failed: malformed transaction journal JSON at ${journalAbsPath}`,
    );
  }
  if (!journal || typeof journal !== 'object' || Array.isArray(journal)) {
    throw new Error(
      `Pending transaction recovery failed: invalid transaction journal schema at ${journalAbsPath}`,
    );
  }

  const txStagingDir = path.join(projectReal, '.blendops', 'tx-staging');
  const txState = {
    journalAbsPath,
    txStagingDir,
    blendopsExistedBefore: Boolean(journal.blendops_existed_before),
    backupsDirExistedBefore: Boolean(journal.backups_dir_existed_before),
    manifestState: {
      relPath: journal.manifest_state.rel_path,
      absPath: path.join(projectReal, journal.manifest_state.rel_path),
      existedBefore: Boolean(journal.manifest_state.existed_before),
      preBytes: null,
      preSha256: journal.manifest_state.pre_sha256 || null,
      stagingAbsPath: journal.manifest_state.staging_rel_path
        ? path.join(projectReal, journal.manifest_state.staging_rel_path)
        : null,
    },
    reportState: {
      relPath: journal.report_state.rel_path,
      absPath: path.join(projectReal, journal.report_state.rel_path),
      existedBefore: Boolean(journal.report_state.existed_before),
      preBytes: null,
      preSha256: journal.report_state.pre_sha256 || null,
      stagingAbsPath: journal.report_state.staging_rel_path
        ? path.join(projectReal, journal.report_state.staging_rel_path)
        : null,
    },
    newlyCreatedBackups: (journal.newly_created_backups || []).map((b) => ({
      targetRelPath: b.target_rel_path,
      backupRelPath: b.backup_rel_path,
      backupAbsPath: path.join(projectReal, b.backup_rel_path),
    })),
    targetRecords: (journal.target_records || []).map((r) => ({
      relPath: r.rel_path,
      absPath: path.join(projectReal, r.rel_path),
      action: r.action,
      existedBefore: Boolean(r.existed_before),
      preBytes: null,
      preSha256: r.pre_sha256 || null,
      desiredSha256: r.desired_sha256 || null,
      stagingAbsPath: r.staging_rel_path ? path.join(projectReal, r.staging_rel_path) : null,
      writeAttempted: true,
      fromJournal: true,
    })),
  };

  const cleanupErrors = rollbackWriteTransaction(
    projectReal,
    txState,
    options.faultInjection || null,
  );
  if (cleanupErrors.length > 0) {
    throw new Error(
      `Pending transaction recovery failed for ${projectReal}: ${cleanupErrors.join('; ')}`,
    );
  }
  return { recovered: true };
}

export function executeRollbackMode({ repoRootReal, project, out, forceRollback = false }) {
  const rawRoot = project || out;
  const kind = project ? 'project' : 'out';
  const targetRootReal = validateDestinationRoot(rawRoot, {
    kind,
    repoRoot: repoRootReal,
    mustExist: true,
  });

  const blendopsDir = path.join(targetRootReal, '.blendops');
  const backupsDir = path.join(blendopsDir, 'backups');
  if (fs.existsSync(blendopsDir)) {
    const blendopsLstat = fs.lstatSync(blendopsDir);
    if (blendopsLstat.isSymbolicLink() || !blendopsLstat.isDirectory()) {
      throw new Error(`Rollback refused: unsafe .blendops path at ${blendopsDir}`);
    }
  }
  if (fs.existsSync(backupsDir)) {
    const backupsLstat = fs.lstatSync(backupsDir);
    if (backupsLstat.isSymbolicLink() || !backupsLstat.isDirectory()) {
      throw new Error(`Rollback refused: unsafe .blendops/backups path at ${backupsDir}`);
    }
  }

  if (fs.existsSync(path.join(blendopsDir, 'transaction-journal.json'))) {
    recoverPendingTransactionJournal(targetRootReal);
  }

  const manifestRel = '.blendops/install-manifest.json';
  const { absTarget: manifestAbs, exists: manifestExists } = validateSafeRelativeTargetFile(
    targetRootReal,
    manifestRel,
  );
  if (!manifestExists) {
    throw new Error(
      `Rollback failed: no rollback manifest found at ${path.join(targetRootReal, manifestRel)}`,
    );
  }

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestAbs, 'utf8'));
  } catch {
    throw new Error(`Rollback refused: malformed rollback manifest JSON at ${manifestAbs}`);
  }

  // Schema & integrity metadata validation (--force-rollback never bypasses schema/hash metadata checks)
  validateRollbackManifestSchema(manifest, manifestAbs);

  const filesCreated = manifest.files_created;
  const filesModified = manifest.files_modified;
  const createdHashes = manifest.created_file_hashes;
  const modifiedHashes = manifest.modified_file_hashes;

  // Step 1: Preflight verification before deleting or restoring anything
  const verifiedCreatedTargets = [];
  for (const relPath of filesCreated) {
    const { absTarget, exists } = validateSafeRelativeTargetFile(targetRootReal, relPath);
    const expectedHash = createdHashes[relPath];
    if (!exists) continue;
    const currentHash = sha256Buffer(fs.readFileSync(absTarget));
    if (currentHash !== expectedHash && !forceRollback) {
      throw new Error(
        `Rollback refused: installer-created file '${relPath}' was modified after installation (expected SHA-256 ${expectedHash.slice(0, 12)}, got ${currentHash.slice(0, 12)}). Inspect changes manually or pass --force-rollback.`,
      );
    }
    verifiedCreatedTargets.push({ relPath, absTarget });
  }

  const restoreTasks = [];
  for (const relPath of filesModified) {
    const { absTarget, exists } = validateSafeRelativeTargetFile(targetRootReal, relPath);
    const meta = modifiedHashes[relPath];
    const { absTarget: backupAbs, exists: backupExists } = validateSafeRelativeTargetFile(
      targetRootReal,
      meta.backup_path,
    );
    if (!backupExists) {
      throw new Error(`Rollback refused: backup file '${meta.backup_path}' is missing on disk`);
    }
    const backupBytes = fs.readFileSync(backupAbs);
    const backupHash = sha256Buffer(backupBytes);
    if (backupHash !== meta.pre_install_sha256) {
      throw new Error(
        `Rollback refused: backup file '${meta.backup_path}' failed SHA-256 integrity verification`,
      );
    }

    if (!exists && !forceRollback) {
      throw new Error(
        `Rollback refused: modified file '${relPath}' is missing on disk. Inspect changes manually or pass --force-rollback.`,
      );
    }

    if (exists && !forceRollback) {
      const currentHash = sha256Buffer(fs.readFileSync(absTarget));
      if (currentHash !== meta.post_install_sha256) {
        throw new Error(
          `Rollback refused: modified file '${relPath}' was edited by the user after installation (expected post-install SHA-256 ${meta.post_install_sha256.slice(0, 12)}, got ${currentHash.slice(0, 12)}). Inspect changes manually or pass --force-rollback.`,
        );
      }
    }

    restoreTasks.push({
      relPath,
      absTarget,
      backupRelPath: meta.backup_path,
      backupAbs,
      backupBytes,
      expectedPreHash: meta.pre_install_sha256,
    });
  }

  // Verify installer-owned .blendops/INSTALL_REPORT.md before deleting it
  const reportRel = '.blendops/INSTALL_REPORT.md';
  const { absTarget: reportAbs, exists: reportExists } = validateSafeRelativeTargetFile(
    targetRootReal,
    reportRel,
  );
  if (reportExists) {
    const expectedReportHash = manifest.metadata_files?.[reportRel];
    if (!isSha256Hex(expectedReportHash)) {
      throw new Error(
        `Rollback refused: missing expected SHA-256 hash for existing '${reportRel}' in rollback manifest at ${manifestAbs}`,
      );
    }
    const actualReportHash = sha256Buffer(fs.readFileSync(reportAbs));
    if (actualReportHash !== expectedReportHash) {
      throw new Error(
        `Rollback refused: installer metadata file '${reportRel}' was modified and failed SHA-256 verification at ${reportAbs}`,
      );
    }
  }

  // Step 2: Execute restorations first
  const restoredPaths = [];
  for (const task of restoreTasks) {
    writeAtomicFile(task.absTarget, task.backupBytes);
    const restoredHash = sha256Buffer(fs.readFileSync(task.absTarget));
    if (restoredHash !== task.expectedPreHash) {
      throw new Error(`Rollback verification failed after restoring '${task.relPath}'`);
    }
    restoredPaths.push(task.relPath);
  }

  // Step 3: Remove verified installer-created files and clean up empty parent directories
  const removedPaths = [];
  for (const item of verifiedCreatedTargets) {
    if (fs.existsSync(item.absTarget)) {
      fs.rmSync(item.absTarget, { force: true });
      removedPaths.push(item.relPath);
    }
    pruneEmptyParentDirectories(item.absTarget, targetRootReal);
  }

  // Step 4: Ownership-aware cleanup of verified installer backups and metadata files inside .blendops
  for (const task of restoreTasks) {
    if (fs.existsSync(task.backupAbs)) {
      fs.rmSync(task.backupAbs, { force: true });
    }
    pruneEmptyParentDirectories(task.backupAbs, targetRootReal);
  }
  if (reportExists && fs.existsSync(reportAbs)) {
    fs.rmSync(reportAbs, { force: true });
  }
  if (fs.existsSync(manifestAbs)) {
    fs.rmSync(manifestAbs, { force: true });
  }
  pruneEmptyParentDirectories(manifestAbs, targetRootReal);

  const result = {
    ok: true,
    mode: 'rollback',
    targetRequested: manifest.requested_target || manifest.target || 'generic-project',
    targetSelected: manifest.target || 'generic-project',
    resolvedInstallMode: 'rollback',
    confidence: manifest.confidence || 'verified-read',
    scope: manifest.scope || 'project-local',
    projectOrOutPath: targetRootReal,
    detectedMarkers: [],
    filesCreated: [],
    filesModified: restoredPaths,
    filesSkipped: [],
    backups: [],
    removedFiles: removedPaths,
    restoredFiles: restoredPaths,
    rollbackManifestPath: manifestAbs,
    globalTouched: false,
    runtimeStatus: 'Not Run',
    artifactStatus: 'Not Produced',
    limitations: [
      `Rollback completed: restored ${restoredPaths.length} modified file(s) from verified backups and removed ${removedPaths.length} installer-created file(s).`,
    ],
  };

  result.report = formatInstallerReport(result);
  return result;
}
