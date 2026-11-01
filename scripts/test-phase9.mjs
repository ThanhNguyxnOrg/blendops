import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync, spawn } from 'node:child_process';
import {
  CANONICAL_BUNDLE_FILENAME,
  COMPATIBILITY_BUNDLE_ROUTES,
  resolveDefaultBundleCachePath,
  createDevServer,
} from './dev-server.mjs';

function createIsolatedGitRepo(prefix = 'blendops-phase9-repo-') {
  const repoDir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  execFileSync('git', ['init', '-b', 'main'], {
    cwd: repoDir,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  execFileSync('git', ['config', 'user.name', 'Phase 9 Test Runner'], {
    cwd: repoDir,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  execFileSync('git', ['config', 'user.email', 'phase9@example.com'], {
    cwd: repoDir,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  fs.writeFileSync(
    path.join(repoDir, 'README.md'),
    `# Isolated Test Repo (${prefix})\n`,
    'utf8',
  );
  execFileSync('git', ['add', 'README.md'], {
    cwd: repoDir,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  execFileSync('git', ['commit', '-m', 'chore: initial commit'], {
    cwd: repoDir,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  return repoDir;
}

function commitFile(repoDir, relPath, content, message) {
  const fullPath = path.join(repoDir, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  execFileSync('git', ['add', relPath], {
    cwd: repoDir,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  execFileSync('git', ['commit', '-m', message], {
    cwd: repoDir,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const headSha = execFileSync('git', ['rev-parse', '--verify', 'HEAD'], {
    cwd: repoDir,
    encoding: 'utf8',
  }).trim();
  const mainSha = execFileSync(
    'git',
    ['rev-parse', '--verify', 'refs/heads/main'],
    {
      cwd: repoDir,
      encoding: 'utf8',
    },
  ).trim();
  return { headSha, mainSha };
}

async function startTestServer(options = {}) {
  const server = createDevServer(options);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const addr = server.address();
  const baseUrl = `http://127.0.0.1:${addr.port}`;

  // Bounded readiness check against /api/health
  const deadline = Date.now() + 5000;
  let ready = false;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${baseUrl}/api/health`);
      if (res.status === 200) {
        ready = true;
        break;
      }
    } catch {
      // Retry briefly until listening socket responds
    }
    await new Promise((r) => setTimeout(r, 25));
  }
  assert.equal(ready, true, 'Test HTTP server failed readiness check within 5s');

  return {
    server,
    baseUrl,
    async close() {
      await new Promise((resolve) => server.close(() => resolve()));
    },
  };
}

function sha256Hex(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

test('Scenario 1 & 2 (Phase 9 Fix A/B/C): Initial binary export and metadata/download consistency', async () => {
  const repoDir = createIsolatedGitRepo('blendops-p9-s1-repo-');
  const cacheWorkDir = fs.mkdtempSync(path.join(os.tmpdir(), 'blendops-p9-s1-cache-'));
  const bundlePath = path.join(cacheWorkDir, CANONICAL_BUNDLE_FILENAME);
  const verifyWorkDir = fs.mkdtempSync(path.join(os.tmpdir(), 'blendops-p9-s1-verify-'));

  let srv = null;
  try {
    const expectedHead = execFileSync('git', ['rev-parse', '--verify', 'HEAD'], {
      cwd: repoDir,
      encoding: 'utf8',
    }).trim();
    const expectedMain = execFileSync(
      'git',
      ['rev-parse', '--verify', 'refs/heads/main'],
      {
        cwd: repoDir,
        encoding: 'utf8',
      },
    ).trim();

    srv = await startTestServer({ rootDir: repoDir, bundlePath });

    // 1. Query /api/bundle-info
    const infoRes = await fetch(`${srv.baseUrl}/api/bundle-info`);
    assert.equal(infoRes.status, 200);
    const info = await infoRes.json();

    assert.equal(info.exists, true);
    assert.equal(info.filename, 'blendops-phase-9.bundle');
    assert.ok(info.size > 0, 'Bundle byte size must be > 0');
    assert.match(info.header, /^# v[23] git bundle$/);
    assert.equal(info.headSha, expectedHead);
    assert.equal(info.mainSha, expectedMain);
    assert.deepEqual(info.refs, {
      HEAD: expectedHead,
      'refs/heads/main': expectedMain,
    });

    // 2. Download /blendops-phase-9.bundle
    const dlRes = await fetch(`${srv.baseUrl}/blendops-phase-9.bundle`);
    assert.equal(dlRes.status, 200);
    assert.equal(
      dlRes.headers.get('content-disposition'),
      'attachment; filename="blendops-phase-9.bundle"',
    );
    assert.equal(dlRes.headers.get('content-length'), String(info.size));

    const dlBytes = Buffer.from(await dlRes.arrayBuffer());
    assert.equal(dlBytes.length, info.size);
    assert.equal(sha256Hex(dlBytes), info.sha256);

    const headerLine = dlBytes
      .subarray(0, dlBytes.indexOf(0x0a))
      .toString('utf8')
      .trim();
    assert.equal(headerLine, info.header);

    // 3. Write downloaded bytes to disk and verify with git bundle verify & clone
    const downloadedBundlePath = path.join(verifyWorkDir, 'downloaded.bundle');
    fs.writeFileSync(downloadedBundlePath, dlBytes);

    execFileSync('git', ['bundle', 'verify', downloadedBundlePath], {
      cwd: repoDir,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const listHeadsOut = execFileSync(
      'git',
      ['bundle', 'list-heads', downloadedBundlePath],
      {
        cwd: repoDir,
        encoding: 'utf8',
      },
    );
    assert.ok(listHeadsOut.includes(`${expectedHead} HEAD`));
    assert.ok(listHeadsOut.includes(`${expectedMain} refs/heads/main`));

    const cloneDir = path.join(verifyWorkDir, 'cloned-repo');
    execFileSync('git', ['clone', downloadedBundlePath, cloneDir], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const clonedHead = execFileSync('git', ['rev-parse', '--verify', 'HEAD'], {
      cwd: cloneDir,
      encoding: 'utf8',
    }).trim();
    assert.equal(clonedHead, expectedHead);
  } finally {
    if (srv) await srv.close();
    fs.rmSync(repoDir, { recursive: true, force: true });
    fs.rmSync(cacheWorkDir, { recursive: true, force: true });
    fs.rmSync(verifyWorkDir, { recursive: true, force: true });
  }
});

test('Scenario 3 (Phase 9 Fix A): Freshness after a new commit without restarting the server', async () => {
  const repoDir = createIsolatedGitRepo('blendops-p9-s3-repo-');
  const cacheWorkDir = fs.mkdtempSync(path.join(os.tmpdir(), 'blendops-p9-s3-cache-'));
  const bundlePath = path.join(cacheWorkDir, CANONICAL_BUNDLE_FILENAME);
  const verifyWorkDir = fs.mkdtempSync(path.join(os.tmpdir(), 'blendops-p9-s3-verify-'));

  let srv = null;
  try {
    srv = await startTestServer({ rootDir: repoDir, bundlePath });

    // Initial bundle fetch
    const info1 = await (await fetch(`${srv.baseUrl}/api/bundle-info`)).json();
    assert.equal(info1.exists, true);
    const initialSha = info1.headSha;
    const initialBundleSha256 = info1.sha256;

    // Advance main with a new commit while the server remains running
    const { headSha: secondSha, mainSha: secondMainSha } = commitFile(
      repoDir,
      'phase9-freshness.txt',
      'New commit payload for freshness test\n',
      'feat: advance main for freshness verification',
    );
    assert.notEqual(secondSha, initialSha);

    // Fetch /api/bundle-info and /blendops-phase-9.bundle without restarting server
    const info2Res = await fetch(`${srv.baseUrl}/api/bundle-info`);
    assert.equal(info2Res.status, 200);
    const info2 = await info2Res.json();

    assert.equal(info2.exists, true);
    assert.equal(info2.headSha, secondSha, 'Bundle headSha must advance to new commit');
    assert.equal(info2.mainSha, secondMainSha, 'Bundle mainSha must advance to new commit');
    assert.notEqual(
      info2.sha256,
      initialBundleSha256,
      'Regenerated bundle SHA-256 must differ from stale bundle',
    );

    const dl2Res = await fetch(`${srv.baseUrl}/blendops-phase-9.bundle`);
    assert.equal(dl2Res.status, 200);
    const dl2Bytes = Buffer.from(await dl2Res.arrayBuffer());
    assert.equal(sha256Hex(dl2Bytes), info2.sha256);

    const downloadedPath = path.join(verifyWorkDir, 'fresh.bundle');
    fs.writeFileSync(downloadedPath, dl2Bytes);
    execFileSync('git', ['bundle', 'verify', downloadedPath], {
      cwd: repoDir,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const headsOut = execFileSync('git', ['bundle', 'list-heads', downloadedPath], {
      cwd: repoDir,
      encoding: 'utf8',
    });
    assert.ok(headsOut.includes(`${secondSha} HEAD`));
    assert.ok(headsOut.includes(`${secondMainSha} refs/heads/main`));
    assert.equal(
      headsOut.includes(initialSha),
      false,
      'Advertised bundle heads must not point to the superseded commit SHA',
    );
  } finally {
    if (srv) await srv.close();
    fs.rmSync(repoDir, { recursive: true, force: true });
    fs.rmSync(cacheWorkDir, { recursive: true, force: true });
    fs.rmSync(verifyWorkDir, { recursive: true, force: true });
  }
});

test('Scenario 4 (Phase 9 Fix A/B): Corrupted or truncated cache recovery', async () => {
  const repoDir = createIsolatedGitRepo('blendops-p9-s4-repo-');
  const cacheWorkDir = fs.mkdtempSync(path.join(os.tmpdir(), 'blendops-p9-s4-cache-'));
  const bundlePath = path.join(cacheWorkDir, CANONICAL_BUNDLE_FILENAME);
  const verifyWorkDir = fs.mkdtempSync(path.join(os.tmpdir(), 'blendops-p9-s4-verify-'));

  let srv = null;
  try {
    // 1. Write corrupt non-bundle bytes at cache path before first request
    const corruptPayload1 = Buffer.from('corrupted non-bundle payload', 'utf8');
    fs.writeFileSync(bundlePath, corruptPayload1);

    srv = await startTestServer({ rootDir: repoDir, bundlePath });

    const info1Res = await fetch(`${srv.baseUrl}/api/bundle-info`);
    assert.equal(info1Res.status, 200);
    const info1 = await info1Res.json();
    assert.equal(info1.exists, true);
    assert.notEqual(info1.sha256, sha256Hex(corruptPayload1));
    assert.match(info1.header, /^# v[23] git bundle$/);

    // 2. Write a fake header with truncated body to simulate partial write corruption
    const corruptPayload2 = Buffer.from('# v2 git bundle\n0000000000000000000000000000000000000000 HEAD\n\nTRUNCATED', 'utf8');
    fs.writeFileSync(bundlePath, corruptPayload2);

    const dlRes = await fetch(`${srv.baseUrl}/blendops-phase-9.bundle`);
    assert.equal(dlRes.status, 200);
    const dlBytes = Buffer.from(await dlRes.arrayBuffer());
    assert.notEqual(sha256Hex(dlBytes), sha256Hex(corruptPayload2));
    assert.equal(sha256Hex(dlBytes), info1.sha256);

    const recoveredPath = path.join(verifyWorkDir, 'recovered.bundle');
    fs.writeFileSync(recoveredPath, dlBytes);
    execFileSync('git', ['bundle', 'verify', recoveredPath], {
      cwd: repoDir,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } finally {
    if (srv) await srv.close();
    fs.rmSync(repoDir, { recursive: true, force: true });
    fs.rmSync(cacheWorkDir, { recursive: true, force: true });
    fs.rmSync(verifyWorkDir, { recursive: true, force: true });
  }
});

test('Scenario 5 (Phase 9 Fix C): Compatibility routes serve identical verified current bundle bytes', async () => {
  const repoDir = createIsolatedGitRepo('blendops-p9-s5-repo-');
  const cacheWorkDir = fs.mkdtempSync(path.join(os.tmpdir(), 'blendops-p9-s5-cache-'));
  const bundlePath = path.join(cacheWorkDir, CANONICAL_BUNDLE_FILENAME);

  let srv = null;
  try {
    srv = await startTestServer({ rootDir: repoDir, bundlePath });
    const info = await (await fetch(`${srv.baseUrl}/api/bundle-info`)).json();
    assert.equal(info.exists, true);

    assert.ok(COMPATIBILITY_BUNDLE_ROUTES.includes('/blendops-phase-9.bundle'));
    assert.ok(COMPATIBILITY_BUNDLE_ROUTES.includes('/blendops-phase-8.1.1.bundle'));
    assert.ok(COMPATIBILITY_BUNDLE_ROUTES.includes('/blendops-phase-8.1.bundle'));
    assert.ok(COMPATIBILITY_BUNDLE_ROUTES.includes('/blendops-phase-8.bundle'));

    for (const route of COMPATIBILITY_BUNDLE_ROUTES) {
      const res = await fetch(`${srv.baseUrl}${route}`);
      assert.equal(res.status, 200, `Route ${route} must return HTTP 200`);
      assert.equal(
        res.headers.get('content-disposition'),
        'attachment; filename="blendops-phase-9.bundle"',
        `Route ${route} must set canonical Content-Disposition`,
      );
      const buf = Buffer.from(await res.arrayBuffer());
      assert.equal(buf.length, info.size, `Route ${route} size mismatch`);
      assert.equal(sha256Hex(buf), info.sha256, `Route ${route} SHA-256 mismatch`);
    }
  } finally {
    if (srv) await srv.close();
    fs.rmSync(repoDir, { recursive: true, force: true });
    fs.rmSync(cacheWorkDir, { recursive: true, force: true });
  }
});

test('Scenario 6 (Phase 9 Fix B): Concurrent requests return consistent verified artifacts with zero leaked temp files', async () => {
  const repoDir = createIsolatedGitRepo('blendops-p9-s6-repo-');
  const cacheWorkDir = fs.mkdtempSync(path.join(os.tmpdir(), 'blendops-p9-s6-cache-'));
  const bundlePath = path.join(cacheWorkDir, CANONICAL_BUNDLE_FILENAME);

  let srv = null;
  try {
    srv = await startTestServer({ rootDir: repoDir, bundlePath });

    // Fire 12 concurrent requests against a cold cache
    const endpoints = [
      '/api/bundle-info',
      '/blendops-phase-9.bundle',
      '/api/bundle-info',
      '/blendops-phase-8.1.1.bundle',
      '/blendops-phase-8.1.bundle',
      '/blendops-phase-8.bundle',
      '/api/bundle-info',
      '/blendops-phase-9.bundle',
      '/blendops-phase-7.bundle',
      '/api/bundle-info',
      '/blendops-phase-9.bundle',
      '/blendops-phase-8.1.1.bundle',
    ];

    const responses = await Promise.all(
      endpoints.map(async (ep) => {
        const res = await fetch(`${srv.baseUrl}${ep}`);
        assert.equal(res.status, 200, `Concurrent request to ${ep} failed`);
        if (ep === '/api/bundle-info') {
          return { type: 'info', data: await res.json() };
        }
        return { type: 'binary', buffer: Buffer.from(await res.arrayBuffer()) };
      }),
    );

    const infoResults = responses.filter((r) => r.type === 'info').map((r) => r.data);
    const binResults = responses.filter((r) => r.type === 'binary').map((r) => r.buffer);

    const canonicalSha256 = infoResults[0].sha256;
    const canonicalSize = infoResults[0].size;

    for (const info of infoResults) {
      assert.equal(info.exists, true);
      assert.equal(info.sha256, canonicalSha256);
      assert.equal(info.size, canonicalSize);
    }
    for (const buf of binResults) {
      assert.equal(buf.length, canonicalSize);
      assert.equal(sha256Hex(buf), canonicalSha256);
    }

    // Verify zero temporary candidate files remain in cacheWorkDir
    const remainingFiles = fs.readdirSync(cacheWorkDir);
    assert.deepEqual(
      remainingFiles,
      [CANONICAL_BUNDLE_FILENAME],
      `Expected only ${CANONICAL_BUNDLE_FILENAME} in cache directory, found: ${remainingFiles.join(', ')}`,
    );
  } finally {
    if (srv) await srv.close();
    fs.rmSync(repoDir, { recursive: true, force: true });
    fs.rmSync(cacheWorkDir, { recursive: true, force: true });
  }
});

test('Scenario 7 (Phase 9 Fix A): Repository cache isolation under default cache strategy', async () => {
  const repoA = createIsolatedGitRepo('blendops-p9-s7-repoA-');
  const repoB = createIsolatedGitRepo('blendops-p9-s7-repoB-');

  const commitA = commitFile(
    repoA,
    'repo-a.txt',
    'Repository A unique content\n',
    'feat: repo A commit',
  );
  const commitB = commitFile(
    repoB,
    'repo-b.txt',
    'Repository B unique content\n',
    'feat: repo B commit',
  );
  assert.notEqual(commitA.headSha, commitB.headSha);

  const defaultCachePathA = resolveDefaultBundleCachePath(repoA);
  const defaultCachePathB = resolveDefaultBundleCachePath(repoB);
  assert.notEqual(
    defaultCachePathA,
    defaultCachePathB,
    'Default cache paths for distinct repository roots must be isolated',
  );

  let srvA = null;
  let srvB = null;
  try {
    srvA = await startTestServer({ rootDir: repoA });
    srvB = await startTestServer({ rootDir: repoB });

    const infoA = await (await fetch(`${srvA.baseUrl}/api/bundle-info`)).json();
    const infoB = await (await fetch(`${srvB.baseUrl}/api/bundle-info`)).json();

    assert.equal(infoA.exists, true);
    assert.equal(infoB.exists, true);
    assert.equal(infoA.headSha, commitA.headSha);
    assert.equal(infoB.headSha, commitB.headSha);
    assert.notEqual(infoA.sha256, infoB.sha256);

    const bytesA = Buffer.from(
      await (await fetch(`${srvA.baseUrl}/blendops-phase-9.bundle`)).arrayBuffer(),
    );
    const bytesB = Buffer.from(
      await (await fetch(`${srvB.baseUrl}/blendops-phase-9.bundle`)).arrayBuffer(),
    );
    assert.equal(sha256Hex(bytesA), infoA.sha256);
    assert.equal(sha256Hex(bytesB), infoB.sha256);
  } finally {
    if (srvA) await srvA.close();
    if (srvB) await srvB.close();
    fs.rmSync(path.dirname(defaultCachePathA), { recursive: true, force: true });
    fs.rmSync(path.dirname(defaultCachePathB), { recursive: true, force: true });
    fs.rmSync(repoA, { recursive: true, force: true });
    fs.rmSync(repoB, { recursive: true, force: true });
  }
});

test('Scenario 8 (Phase 9 Fix A/B/C): Strict guardrails on invalid repo state or uncreatable bundle path, plus CLI subprocess verification', async () => {
  const nonGitDir = fs.mkdtempSync(path.join(os.tmpdir(), 'blendops-p9-s8-nongit-'));
  const repoMissingMain = createIsolatedGitRepo('blendops-p9-s8-nomain-');
  const validRepo = createIsolatedGitRepo('blendops-p9-s8-valid-');
  const cacheWorkDir = fs.mkdtempSync(path.join(os.tmpdir(), 'blendops-p9-s8-cache-'));

  let srvNonGit = null;
  let srvNoMain = null;
  let srvUncreatable = null;
  let childProc = null;

  try {
    // 8a. Non-Git directory fails closed with 503 and actionable error
    const nonGitBundlePath = path.join(cacheWorkDir, 'nongit.bundle');
    srvNonGit = await startTestServer({
      rootDir: nonGitDir,
      bundlePath: nonGitBundlePath,
    });
    const resNonGitInfo = await fetch(`${srvNonGit.baseUrl}/api/bundle-info`);
    assert.equal(resNonGitInfo.status, 503);
    const bodyNonGitInfo = await resNonGitInfo.json();
    assert.equal(bodyNonGitInfo.exists, false);
    assert.equal(bodyNonGitInfo.filename, 'blendops-phase-9.bundle');
    assert.match(bodyNonGitInfo.error, /Failed to resolve Git HEAD/i);

    const resNonGitDl = await fetch(`${srvNonGit.baseUrl}/blendops-phase-9.bundle`);
    assert.equal(resNonGitDl.status, 503);

    // 8b. Repository with a valid cached bundle that subsequently loses refs/heads/main must NOT serve the stale bundle
    const staleGuardBundlePath = path.join(cacheWorkDir, 'stale-guard.bundle');
    srvNoMain = await startTestServer({
      rootDir: repoMissingMain,
      bundlePath: staleGuardBundlePath,
    });
    const warmInfo = await (await fetch(`${srvNoMain.baseUrl}/api/bundle-info`)).json();
    assert.equal(warmInfo.exists, true);

    // Rename branch main -> trunk so refs/heads/main no longer exists
    execFileSync('git', ['branch', '-m', 'main', 'trunk'], {
      cwd: repoMissingMain,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const afterBranchRenameInfoRes = await fetch(`${srvNoMain.baseUrl}/api/bundle-info`);
    assert.equal(afterBranchRenameInfoRes.status, 503);
    const afterBranchRenameInfo = await afterBranchRenameInfoRes.json();
    assert.equal(afterBranchRenameInfo.exists, false);
    assert.match(afterBranchRenameInfo.error, /refs\/heads\/main/);

    const afterBranchRenameDlRes = await fetch(
      `${srvNoMain.baseUrl}/blendops-phase-9.bundle`,
    );
    assert.equal(afterBranchRenameDlRes.status, 503);

    // 8c. Uncreatable bundle path (parent path is a regular file) fails closed
    const blockingFile = path.join(cacheWorkDir, 'blocking-regular-file');
    fs.writeFileSync(blockingFile, 'not a directory\n', 'utf8');
    const uncreatableBundlePath = path.join(blockingFile, 'impossible.bundle');

    srvUncreatable = await startTestServer({
      rootDir: validRepo,
      bundlePath: uncreatableBundlePath,
    });
    const uncreatableRes = await fetch(`${srvUncreatable.baseUrl}/api/bundle-info`);
    assert.equal(uncreatableRes.status, 503);
    const uncreatableBody = await uncreatableRes.json();
    assert.equal(uncreatableBody.exists, false);
    assert.ok(uncreatableBody.error.length > 0);

    // 8d. Real CLI subprocess test using PORT, BLENDOPS_REPO_ROOT, and BLENDOPS_BUNDLE_PATH
    const cliBundlePath = path.join(cacheWorkDir, 'cli-subprocess.bundle');
    // Pick an available ephemeral port by binding briefly
    const probeServer = createDevServer({ rootDir: validRepo, bundlePath: cliBundlePath });
    await new Promise((resolve) => probeServer.listen(0, '127.0.0.1', resolve));
    const cliPort = probeServer.address().port;
    await new Promise((resolve) => probeServer.close(() => resolve()));

    childProc = spawn(
      process.execPath,
      [path.join(process.cwd(), 'scripts', 'dev-server.mjs')],
      {
        env: {
          ...process.env,
          PORT: String(cliPort),
          HOST: '127.0.0.1',
          BLENDOPS_REPO_ROOT: validRepo,
          BLENDOPS_BUNDLE_PATH: cliBundlePath,
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );

    const cliBaseUrl = `http://127.0.0.1:${cliPort}`;
    const deadline = Date.now() + 5000;
    let cliReady = false;
    while (Date.now() < deadline) {
      try {
        const health = await fetch(`${cliBaseUrl}/api/health`);
        if (health.status === 200) {
          cliReady = true;
          break;
        }
      } catch {
        // Wait for subprocess to listen
      }
      await new Promise((r) => setTimeout(r, 30));
    }
    assert.equal(cliReady, true, 'CLI dev-server subprocess failed readiness check');

    const cliInfoRes = await fetch(`${cliBaseUrl}/api/bundle-info`);
    assert.equal(cliInfoRes.status, 200);
    const cliInfo = await cliInfoRes.json();
    assert.equal(cliInfo.exists, true);
    assert.equal(cliInfo.filename, 'blendops-phase-9.bundle');
    assert.equal(fs.existsSync(cliBundlePath), true);
  } finally {
    if (childProc && !childProc.killed) {
      childProc.kill('SIGTERM');
      await new Promise((resolve) => {
        childProc.once('exit', resolve);
        setTimeout(resolve, 1000);
      });
    }
    if (srvNonGit) await srvNonGit.close();
    if (srvNoMain) await srvNoMain.close();
    if (srvUncreatable) await srvUncreatable.close();
    fs.rmSync(nonGitDir, { recursive: true, force: true });
    fs.rmSync(repoMissingMain, { recursive: true, force: true });
    fs.rmSync(validRepo, { recursive: true, force: true });
    fs.rmSync(cacheWorkDir, { recursive: true, force: true });
  }
});
